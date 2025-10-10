import React, { useState, useEffect } from 'react'
import apiService from '../services/api'
import Swal from 'sweetalert2'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

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

  const { isBackoffice } = useAuth()

  useEffect(() => {
    loadEVOwners()
  }, [])

  // If suppressErrors is true, do not show a Swal modal on failure;
  // instead rethrow so the caller can handle it.
  const loadEVOwners = async (suppressErrors = false) => {
    try {
      const data = await apiService.getEVOwners()
      setEvOwners(data)
    } catch (err) {
      if (!suppressErrors) {
        Swal.fire('Error', 'Failed to load EV owners', 'error')
      }
      // rethrow so callers (when suppressErrors=true) can react
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingOwner) {
        if (isBackoffice) {
          // Backoffice can only toggle activation status
          await apiService.updateEVOwnerStatus(editingOwner.nic, formData.isActive)
          Swal.fire('Success', `EV owner ${formData.isActive ? 'activated' : 'deactivated'}`, 'success')
        } else {
          // Non-backoffice can update full details
          await apiService.updateEVOwner(editingOwner.nic, formData)
          Swal.fire('Success', 'EV owner updated successfully', 'success')
        }
      } else {
        // Ensure newly created EV owners are inactive by default.
        const payload = { ...formData, isActive: false }
        await apiService.createEVOwner(payload)
        Swal.fire('Success', 'EV owner created successfully', 'success')
      }
      setShowModal(false)
      resetForm()
      loadEVOwners()
    } catch (err) {
      console.error(err)
      // Server response will be displayed to the user below when available

      // If server returned ModelState errors, aggregate them into a single message
      const resp = err.response?.data
      let display = 'Failed to update status'
      if (resp) {
        if (resp.errors && typeof resp.errors === 'object') {
          // resp.errors is an object where each key maps to an array of messages
          const parts = []
          for (const key of Object.keys(resp.errors)) {
            const v = resp.errors[key]
            if (Array.isArray(v)) parts.push(...v)
            else parts.push(String(v))
          }
          display = parts.join('\n') || JSON.stringify(resp)
        } else if (typeof resp === 'string') {
          display = resp
        } else if (resp.message) {
          display = resp.message
        } else {
          display = JSON.stringify(resp)
        }
      }

      Swal.fire({ title: 'Error', text: display, icon: 'error', width: 600 })
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
    const action = isActive ? 'activate' : 'deactivate'
    const result = await Swal.fire({
      title: `Are you sure you want to ${action} this account?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      await apiService.updateEVOwnerStatus(nic, isActive)
      // show non-blocking toast for success
      window.__toast?.push(`EV owner ${isActive ? 'activated' : 'deactivated'}`, 'success')

      // Try to refresh the list, but treat refresh failures as non-fatal
      try {
        await loadEVOwners(true)
      } catch (refreshErr) {
        console.error('Failed to refresh EV owners after status change:', refreshErr)
        window.__toast?.push('Status updated but failed to refresh list. Please refresh the page.', 'warning')
      }
    } catch (err) {
      console.error(err)
      const resp = err.response?.data

      // Aggregate model-state errors if present
      let display = 'Failed to update status'
      if (resp) {
        if (resp.errors && typeof resp.errors === 'object') {
          const parts = []
          for (const key of Object.keys(resp.errors)) {
            const v = resp.errors[key]
            if (Array.isArray(v)) parts.push(...v)
            else parts.push(String(v))
          }
          display = parts.join('\n') || JSON.stringify(resp)
        } else if (typeof resp === 'string') {
          display = resp
        } else if (resp.message) {
          display = resp.message
        } else {
          display = JSON.stringify(resp)
        }
      }

      // This is an actual update failure — show modal error
      Swal.fire({ title: 'Error', text: display, icon: 'error', width: 600 })
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
      isActive: false
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
        {/*
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add EV Owner
        </button>
        */}
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
                        {!isBackoffice && (
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => handleEdit(owner)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
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
          {editingOwner && isBackoffice ? (
            // Backoffice editing: only allow activation toggle
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
            // Full create/edit form for non-backoffice or creating new owner
            <>
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
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}

export default EVOwners