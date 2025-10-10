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
    isActive: false
  })

  const { isBackoffice } = useAuth()

  useEffect(() => {
    loadEVOwners()
  }, [])

  const loadEVOwners = async (suppressErrors = false) => {
    try {
      const data = await apiService.getEVOwners()
      setEvOwners(data)
    } catch (err) {
      if (!suppressErrors) {
        Swal.fire('Error', 'Failed to load EV owners', 'error')
      }
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
          await apiService.updateEVOwnerStatus(editingOwner.nic, formData.isActive)
          Swal.fire('Success', `EV owner ${formData.isActive ? 'activated' : 'deactivated'}`, 'success')
        } else {
          await apiService.updateEVOwner(editingOwner.nic, formData)
          Swal.fire('Success', 'EV owner updated successfully', 'success')
        }
      } else {
        const payload = { ...formData, isActive: false }
        await apiService.createEVOwner(payload)
        Swal.fire('Success', 'EV owner created successfully', 'success')
      }
      setShowModal(false)
      resetForm()
      loadEVOwners()
    } catch (err) {
      console.error(err)
      const resp = err.response?.data
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
      window.__toast?.push(`EV owner ${isActive ? 'activated' : 'deactivated'}`, 'success')

      try {
        await loadEVOwners(true)
      } catch (refreshErr) {
        console.error('Failed to refresh EV owners after status change:', refreshErr)
        window.__toast?.push('Status updated but failed to refresh list. Please refresh the page.', 'warning')
      }
    } catch (err) {
      console.error(err)
      const resp = err.response?.data

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 p-md-6">
      <div className="container-fluid px-4">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-5 gap-3">
          <div>
            <h1 className="h2 fw-bold text-dark d-flex align-items-center gap-3 mb-2">
              <span className="bg-success text-white p-3 rounded-3 shadow" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                <i className="fas fa-users"></i>
              </span>
              EV Owners Management
            </h1>
            <p className="text-muted mb-0 ms-1">Manage electric vehicle owners and their accounts</p>
          </div>
        </div>

        {/* EV Owners Table Card */}
        {evOwners.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-4" style={{ width: '96px', height: '96px' }}>
                <i className="fas fa-users fa-3x text-muted"></i>
              </div>
              <h4 className="fw-bold text-dark mb-3">No EV Owners Found</h4>
              <p className="text-muted mb-4">EV owners register through the mobile application.</p>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                    <tr>
                      <th className="text-white py-3 px-4 fw-semibold">NIC</th>
                      <th className="text-white py-3 px-4 fw-semibold">Name</th>
                      <th className="text-white py-3 px-4 fw-semibold">Email</th>
                      <th className="text-white py-3 px-4 fw-semibold">Phone</th>
                      <th className="text-white py-3 px-4 fw-semibold">Vehicle</th>
                      <th className="text-white py-3 px-4 fw-semibold">Status</th>
                      <th className="text-white py-3 px-4 fw-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evOwners.map(owner => (
                      <tr key={owner.nic} style={{ borderBottom: '1px solid #e9ecef' }}>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-id-card text-primary"></i>
                            <code className="text-dark small bg-light px-2 py-1 rounded">
                              {owner.nic}
                            </code>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-user text-success"></i>
                            <span className="fw-medium">{owner.firstName} {owner.lastName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-envelope text-info"></i>
                            <span>{owner.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-phone text-warning"></i>
                            <span>{owner.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-car" style={{ color: '#11998e' }}></i>
                            <div>
                              <div className="fw-medium">{owner.vehicleModel}</div>
                              <small className="text-muted">{owner.vehiclePlateNumber}</small>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`badge ${owner.isActive ? 'bg-success' : 'bg-danger'} px-3 py-2 d-inline-flex align-items-center gap-2`}>
                            <i className={`fas ${owner.isActive ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            {owner.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex gap-2">
                            {!isBackoffice && (
                              <button 
                                className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                                onClick={() => handleEdit(owner)}
                                title="Edit EV Owner"
                              >
                                <i className="fas fa-edit"></i>
                                <span className="d-none d-lg-inline">Edit</span>
                              </button>
                            )}
                            <button 
                              className={`btn ${owner.isActive ? 'btn-warning' : 'btn-success'} btn-sm d-flex align-items-center gap-1`}
                              onClick={() => handleStatusChange(owner.nic, !owner.isActive)}
                              title={owner.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <i className={`fas ${owner.isActive ? 'fa-ban' : 'fa-check'}`}></i>
                              <span className="d-none d-lg-inline">{owner.isActive ? 'Deactivate' : 'Activate'}</span>
                            </button>
                            <button 
                              className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                              onClick={() => handleDelete(owner.nic)}
                              title="Delete EV Owner"
                            >
                              <i className="fas fa-trash"></i>
                              <span className="d-none d-lg-inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Table Footer with Stats */}
            <div className="card-footer bg-light border-0 py-3">
              <div className="row g-3">
                <div className="col-6 col-md-4">
                  <div className="text-center">
                    <div className="fw-bold text-dark h4 mb-1">{evOwners.length}</div>
                    <small className="text-muted">Total EV Owners</small>
                  </div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="text-center">
                    <div className="fw-bold text-success h4 mb-1">
                      {evOwners.filter(o => o.isActive).length}
                    </div>
                    <small className="text-muted">Active</small>
                  </div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="text-center">
                    <div className="fw-bold text-danger h4 mb-1">
                      {evOwners.filter(o => !o.isActive).length}
                    </div>
                    <small className="text-muted">Inactive</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit EV Owner Modal */}
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
            <>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    <i className="fas fa-id-card text-primary me-2"></i>
                    NIC *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    required
                    disabled={!!editingOwner}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    <i className="fas fa-envelope text-info me-2"></i>
                    Email *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    <i className="fas fa-user text-success me-2"></i>
                    First Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    <i className="fas fa-user text-success me-2"></i>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    <i className="fas fa-phone text-warning me-2"></i>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    <i className="fas fa-car text-primary me-2" style={{ color: '#11998e' }}></i>
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-medium">
                    <i className="fas fa-id-badge text-secondary me-2"></i>
                    Vehicle Plate Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.vehiclePlateNumber}
                    onChange={(e) => setFormData({ ...formData, vehiclePlateNumber: e.target.value })}
                  />
                </div>
              </div>

              {editingOwner ? (
                <div className="mb-3 form-check mt-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label className="form-check-label">Active Account</label>
                </div>
              ) : (
                <div className="alert alert-info d-flex align-items-start gap-2 mt-4">
                  <i className="fas fa-info-circle mt-1"></i>
                  <div>
                    <strong>Note:</strong> New EV owner accounts are created as <strong>Inactive</strong>. Backoffice staff must activate the account before the EV owner can use the mobile app to login.
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success px-4" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none' }}>
                  <i className="fas fa-save me-2"></i>
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