import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import Swal from 'sweetalert2'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'

const Users = () => {
  const { isBackoffice } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'StationOperator',
    isActive: true,
    password: ''
  })

  useEffect(() => {
    if (isBackoffice) {
      loadUsers()
    }
  }, [isBackoffice])

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers()
      setUsers(data)
    } catch {
      Swal.fire('Error', 'Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        await apiService.updateUser(editingUser.id, updateData)
        Swal.fire('Success', 'User updated successfully', 'success')
      } else {
        await apiService.createUser({
          user: formData,
          password: formData.password
        })
        Swal.fire('Success', 'User created successfully', 'success')
      }
      setShowModal(false)
      resetForm()
      loadUsers()
    } catch (error) {
      Swal.fire('Error', error.response?.data || 'Operation failed', 'error')
    }
  }

  const handleDelete = async (id) => {
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
        await apiService.deleteUser(id)
        Swal.fire('Deleted!', 'User has been deleted.', 'success')
        loadUsers()
      } catch {
        Swal.fire('Error', 'Failed to delete user', 'error')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      role: 'StationOperator',
      isActive: true,
      password: ''
    })
    setEditingUser(null)
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      Backoffice: 'bg-danger',
      StationOperator: 'bg-info',
      EVOwner: 'bg-success'
    }
    return roleConfig[role] || 'bg-secondary'
  }

  const getStatusBadge = (isActive) => {
    return isActive ? 'bg-success' : 'bg-danger'
  }

  if (!isBackoffice) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-ban me-2"></i>
        Access denied. You don't have permission to view this page.
      </div>
    )
  }

  if (loading) return <LoadingSpinner text="Loading users..." />

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="h2 fw-bold text-dark d-flex align-items-center gap-3 mb-2">
              <span className="bg-primary bg-opacity-10 text-primary p-3 rounded-3">
                <i className="fas fa-user-cog"></i>
              </span>
              Users Management
            </h2>
            <p className="text-muted mb-0 ms-1">Manage and monitor all system users</p>
          </div>
          <button 
            className="btn btn-primary btn-lg shadow-sm d-flex align-items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus-circle"></i>
            <span>New User</span>
          </button>
        </div>

        {/* Users Table Card */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-dark">Username</th>
                    <th className="px-4 py-3 fw-semibold text-dark">Email</th>
                    <th className="px-4 py-3 fw-semibold text-dark">Role</th>
                    <th className="px-4 py-3 fw-semibold text-dark">Status</th>
                    <th className="px-4 py-3 fw-semibold text-dark">Created Date</th>
                    <th className="px-4 py-3 fw-semibold text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                          <i className="fas fa-users fa-2x text-muted"></i>
                        </div>
                        <h5 className="text-muted mb-2">No Users Found</h5>
                        <p className="text-muted mb-0">There are no users to display.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-user text-primary"></i>
                            <span className="fw-medium">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-envelope text-success"></i>
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getRoleBadge(user.role)} px-3 py-2`}>
                            {user.role === 'Backoffice' && <i className="fas fa-cogs me-1"></i>}
                            {user.role === 'StationOperator' && <i className="fas fa-charging-station me-1"></i>}
                            {user.role === 'EVOwner' && <i className="fas fa-car me-1"></i>}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getStatusBadge(user.isActive)} px-3 py-2`}>
                            {user.isActive ? (
                              <>
                                <i className="fas fa-check-circle me-1"></i>
                                Active
                              </>
                            ) : (
                              <>
                                <i className="fas fa-ban me-1"></i>
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-calendar text-warning"></i>
                            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                              onClick={() => {
                                setEditingUser(user)
                                setFormData({ ...user, password: '' })
                                setShowModal(true)
                              }}
                              title="Edit User"
                            >
                              <i className="fas fa-edit"></i>
                              <span className="d-none d-lg-inline">Edit</span>
                            </button>
                            <button 
                              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                              onClick={() => handleDelete(user.id)}
                              title="Delete User"
                            >
                              <i className="fas fa-trash"></i>
                              <span className="d-none d-lg-inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Table Footer with Stats */}
          {users.length > 0 && (
            <div className="card-footer bg-light border-0 py-3">
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="fw-bold text-dark h4 mb-1">{users.length}</div>
                    <small className="text-muted">Total Users</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="fw-bold text-primary h4 mb-1">
                      {users.filter(u => u.role === 'StationOperator').length}
                    </div>
                    <small className="text-muted">Station Operators</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="fw-bold text-danger h4 mb-1">
                      {users.filter(u => u.role === 'Backoffice').length}
                    </div>
                    <small className="text-muted">Backoffice</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="fw-bold text-success h4 mb-1">
                      {users.filter(u => u.isActive).length}
                    </div>
                    <small className="text-muted">Active Users</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit User Modal */}
      <Modal
        show={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingUser ? 'Edit User' : 'Create New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium">
                <i className="fas fa-user text-primary me-2"></i>
                Username *
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={!!editingUser}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">
                <i className="fas fa-envelope text-success me-2"></i>
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
                <i className="fas fa-user-tag text-info me-2"></i>
                Role *
              </label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="StationOperator">Station Operator</option>
                <option value="Backoffice">Backoffice</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">
                <i className="fas fa-key text-warning me-2"></i>
                {editingUser ? 'New Password' : 'Password *'}
              </label>
              <input
                type="password"
                className="form-control"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                placeholder={editingUser ? 'Leave empty to keep current password' : ''}
              />
              {editingUser && (
                <small className="form-text text-muted">Leave empty to keep current password</small>
              )}
            </div>

            <div className="col-12">
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  id="isActiveSwitch"
                />
                <label className="form-check-label fw-medium" htmlFor="isActiveSwitch">
                  <i className="fas fa-power-off text-success me-2"></i>
                  Active User
                </label>
              </div>
            </div>
          </div>

          <div className="alert alert-info d-flex align-items-start gap-2 mt-4">
            <i className="fas fa-info-circle mt-1"></i>
            <div>
              <strong>Note:</strong> Username cannot be changed after user creation. 
              Passwords must meet security requirements.
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4">
              <i className="fas fa-save me-2"></i>
              {editingUser ? 'Update' : 'Create'} User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Users