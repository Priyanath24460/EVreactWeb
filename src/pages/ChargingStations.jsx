import React, { useState, useEffect } from 'react'
import apiService from '../services/api'
import Swal from 'sweetalert2'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'

const ChargingStations = () => {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStation, setEditingStation] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    stationType: 'AC',
    totalSlots: 4,
    location: {
      address: '',
      city: '',
      latitude: 0,
      longitude: 0
    },
    isActive: true
  })

  useEffect(() => {
    loadStations()
  }, [])

  const loadStations = async () => {
    try {
      const data = await apiService.getChargingStations()
      setStations(data)
    } catch (error) {
      Swal.fire('Error', 'Failed to load charging stations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingStation) {
        await apiService.updateChargingStation(editingStation.id, formData)
        Swal.fire('Success', 'Charging station updated successfully', 'success')
      } else {
        await apiService.createChargingStation(formData)
        Swal.fire('Success', 'Charging station created successfully', 'success')
      }
      setShowModal(false)
      resetForm()
      loadStations()
    } catch (error) {
      Swal.fire('Error', error.response?.data || 'Operation failed', 'error')
    }
  }

  const handleEdit = (station) => {
    setEditingStation(station)
    setFormData({ ...station })
    setShowModal(true)
  }

  const handleDeactivate = async (id) => {
    try {
      await apiService.deactivateStation(id)
      Swal.fire('Success', 'Station deactivated successfully', 'success')
      loadStations()
    } catch (error) {
      Swal.fire('Error', error.response?.data || 'Deactivation failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the charging station!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await apiService.deleteStation(id)
        Swal.fire('Deleted!', 'Charging station has been deleted.', 'success')
        loadStations()
      } catch (error) {
        Swal.fire('Error', error.response?.data || 'Deletion failed', 'error')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      stationType: 'AC',
      totalSlots: 4,
      location: {
        address: '',
        city: '',
        latitude: 0,
        longitude: 0
      },
      isActive: true
    })
    setEditingStation(null)
  }

  if (loading) return <LoadingSpinner text="Loading charging stations..." />

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-charging-station me-2 text-primary"></i>
          Charging Stations Management
        </h2>
        <div className="btn-group">
          <button 
            className="btn btn-success"
            onClick={() => window.location.href = '/create-station-with-operator'}
          >
            <i className="fas fa-plus-circle me-2"></i>
            Create Station + Operator
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Add Station Only
          </button>
        </div>
      </div>

      <div className="row">
        {stations.map(station => (
          <div key={station.id} className="col-md-6 col-lg-4 mb-4">
            <div className={`card h-100 ${station.isActive ? 'border-success' : 'border-danger'}`}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">{station.name}</h5>
                <span className={`badge ${station.stationType === 'AC' ? 'bg-info' : 'bg-warning'}`}>
                  {station.stationType}
                </span>
              </div>
              <div className="card-body">
                <p className="card-text">
                  <i className="fas fa-map-marker-alt text-muted me-2"></i>
                  {station.location.address}, {station.location.city}
                </p>
                <p className="card-text">
                  <i className="fas fa-slots text-muted me-2"></i>
                  {station.totalSlots} slots available
                </p>
                <p className="card-text">
                  <i className="fas fa-clock text-muted me-2"></i>
                  {station.availableSlots?.length || 0} time slots
                </p>
                <div className="mb-2">
                  <span className={`badge ${station.isActive ? 'bg-success' : 'bg-danger'}`}>
                    {station.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="card-footer">
                <div className="btn-group w-100">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleEdit(station)}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                  {station.isActive && (
                    <button 
                      className="btn btn-outline-warning btn-sm"
                      onClick={() => handleDeactivate(station.id)}
                    >
                      <i className="fas fa-ban me-1"></i>Deactivate
                    </button>
                  )}
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDelete(station.id)}
                  >
                    <i className="fas fa-trash me-1"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        show={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingStation ? 'Edit Charging Station' : 'Add New Charging Station'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Station Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Station Type *</label>
                <select
                  className="form-select"
                  value={formData.stationType}
                  onChange={(e) => setFormData({ ...formData, stationType: e.target.value })}
                  required
                >
                  <option value="AC">AC Charging</option>
                  <option value="DC">DC Fast Charging</option>
                </select>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Total Slots *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.totalSlots}
                  onChange={(e) => setFormData({ ...formData, totalSlots: parseInt(e.target.value) })}
                  min="1"
                  max="20"
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Address *</label>
            <textarea
              className="form-control"
              value={formData.location.address}
              onChange={(e) => setFormData({
                ...formData,
                location: { ...formData.location, address: e.target.value }
              })}
              required
            />
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={formData.location.latitude}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, latitude: parseFloat(e.target.value) }
                  })}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={formData.location.longitude}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, longitude: parseFloat(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label className="form-check-label">Active Station</label>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingStation ? 'Update' : 'Create'} Station
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ChargingStations