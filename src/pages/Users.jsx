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
    } catch (error) {
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
      } catch (error) {
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-user-cog me-2 text-primary"></i>
          Users Management
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add User
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.username}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${
                        user.role === 'Backoffice' ? 'bg-danger' : 'bg-info'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => {
                            setEditingUser(user)
                            setFormData({ ...user, password: '' })
                            setShowModal(true)
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(user.id)}
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
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username *</label>
            <input
              type="text"
              className="form-control"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!editingUser}
            />
          </div>

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

          <div className="mb-3">
            <label className="form-label">Role *</label>
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

          <div className="mb-3">
            <label className="form-label">
              {editingUser ? 'New Password (leave empty to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              className="form-control"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />
          </div>

          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label className="form-check-label">Active User</label>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Update' : 'Create'} User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Users