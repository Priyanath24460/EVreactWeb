import React, { useState, useEffect } from 'react'
import apiService from '../services/api'
import Swal from 'sweetalert2'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'

const EVOwners = () => {
  const [evOwners, setEvOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingOwner, setEditingOwner] = useState(null)
  const [formData, setFormData] = useState({
    nic: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    vehicleModel: '',
    vehiclePlateNumber: '',
    // EV Owner accounts must be activated by Backoffice staff.
    // Default to inactive when created via the web UI.
    isActive: false
  })

  useEffect(() => {
    loadEVOwners()
  }, [])

  const loadEVOwners = async () => {
    try {
      const data = await apiService.getEVOwners()
      setEvOwners(data)
    } catch {
      Swal.fire('Error', 'Failed to load EV owners', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingOwner) {
        await apiService.updateEVOwner(editingOwner.nic, formData)
        Swal.fire('Success', 'EV owner updated successfully', 'success')
      } else {
        // Ensure newly created EV owners are inactive by default.
        const payload = { ...formData, isActive: false }
        await apiService.createEVOwner(payload)
        Swal.fire('Success', 'EV owner created successfully', 'success')
      }
      setShowModal(false)
      resetForm()
      loadEVOwners()
    } catch (error) {
      Swal.fire('Error', error.response?.data || 'Operation failed', 'error')
    }
  }

  const handleEdit = (owner) => {
    setEditingOwner(owner)
    setFormData({ ...owner })
    setShowModal(true)
  }

  const handleDelete = async (nic) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await apiService.deleteEVOwner(nic)
        Swal.fire('Deleted!', 'EV owner has been deleted.', 'success')
        loadEVOwners()
      } catch {
        Swal.fire('Error', 'Failed to delete EV owner', 'error')
      }
    }
  }

  const handleStatusChange = async (nic, isActive) => {
    try {
      await apiService.updateEVOwnerStatus(nic, isActive)
      Swal.fire('Success', `EV owner ${isActive ? 'activated' : 'deactivated'}`, 'success')
      loadEVOwners()
    } catch {
      Swal.fire('Error', 'Failed to update status', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      nic: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      vehicleModel: '',
      vehiclePlateNumber: '',
      isActive: true
    })
    setEditingOwner(null)
  }

  if (loading) return <LoadingSpinner text="Loading EV owners..." />

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-users me-2 text-primary"></i>
          EV Owners Management
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add EV Owner
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>NIC</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evOwners.map(owner => (
                  <tr key={owner.nic}>
                    <td>{owner.nic}</td>
                    <td>{owner.firstName} {owner.lastName}</td>
                    <td>{owner.email}</td>
                    <td>{owner.phoneNumber}</td>
                    <td>
                      <small>
                        {owner.vehicleModel} ({owner.vehiclePlateNumber})
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${owner.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {owner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => handleEdit(owner)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => handleStatusChange(owner.nic, !owner.isActive)}
                        >
                          <i className={`fas ${owner.isActive ? 'fa-ban' : 'fa-check'}`}></i>
                        </button>
                        <button 
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(owner.nic)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        show={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingOwner ? 'Edit EV Owner' : 'Add New EV Owner'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">NIC *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nic}
                  onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                  required
                  disabled={!!editingOwner}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Vehicle Model</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Vehicle Plate Number</label>
            <input
              type="text"
              className="form-control"
              value={formData.vehiclePlateNumber}
              onChange={(e) => setFormData({ ...formData, vehiclePlateNumber: e.target.value })}
            />
          </div>

          {/* Activation: only allow toggling when editing an existing owner.
              New accounts are inactive by default and must be activated by Backoffice. */}
          {editingOwner ? (
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label className="form-check-label">Active Account</label>
            </div>
          ) : (
            <div className="alert alert-info small">
              <i className="fas fa-info-circle me-2"></i>
              New EV owner accounts are created as <strong>Inactive</strong>. Backoffice staff must activate the account before the EV owner can use the mobile app to login.
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingOwner ? 'Update' : 'Create'} EV Owner
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default EVOwners