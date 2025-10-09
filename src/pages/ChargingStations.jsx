import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import Swal from 'sweetalert2'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import MapPicker from '../components/MapPicker'

const ChargingStations = () => {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showOperatorModal, setShowOperatorModal] = useState(false)
  const [editingStation, setEditingStation] = useState(null)
  const [editingOperator, setEditingOperator] = useState(null)
  const [operatorFormData, setOperatorFormData] = useState({
    username: '',
    password: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    stationType: 'AC',
    totalSlots: 4,
    slotsPerDay: 10,
    location: {
      address: '',
      city: '',
      latitude: 0,
      longitude: 0
    },
    isActive: true
  })

  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')

  const { isBackoffice, isStationOperator } = useAuth()

  const loadStations = useCallback(async () => {
    try {
      let data = []
      if (isStationOperator) {
        data = await apiService.getMyStations()
      } else {
        data = await apiService.getChargingStations()
      }
      setStations(data)
    } catch (err) {
      console.error('Failed to load stations', err)
      Swal.fire('Error', 'Failed to load charging stations', 'error')
    } finally {
      setLoading(false)
    }
  }, [isStationOperator])

  useEffect(() => {
    loadStations()
  }, [loadStations])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // client-side validation for slotsPerDay
      if (isNaN(parseInt(formData.slotsPerDay)) || parseInt(formData.slotsPerDay) < 1) {
        return window.__toast?.push('Slots per day must be at least 1', 'error')
      }
      if (parseInt(formData.slotsPerDay) > 48) {
        return window.__toast?.push('Slots per day must be 48 or less', 'error')
      }
      if (editingStation) {
        await apiService.updateChargingStation(editingStation.id, formData)
        window.__toast?.push('Charging station updated', 'success')
      } else {
        await apiService.createChargingStation(formData)
        window.__toast?.push('Charging station created', 'success')
      }
      setShowModal(false)
      resetForm()
      loadStations()
    } catch (error) {
      window.__toast?.push(error.response?.data || 'Operation failed', 'error')
    }
  }

  const handleEdit = (station) => {
    setEditingStation(station)
    setFormData({ ...station })
    setShowModal(true)
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by this browser.')
      return
    }

    setLocationError('')
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setFormData(prev => ({
          ...prev,
          location: { ...prev.location, latitude, longitude }
        }))
        setLocating(false)
      },
      (err) => {
        setLocationError(err.message || 'Unable to retrieve location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleGeocodeAddress = async () => {
    const city = `${formData.location.city}`.trim()
    if (!city) {
      setGeocodeError('Please enter a city to lookup')
      return
    }

    setGeocodeError('')
    setGeocoding(true)
    try {
      const url = `/api/geocoding?city=${encodeURIComponent(city)}`
      const res = await fetch(url)
      if (res.status === 429) {
        setGeocodeError('Geocoding rate limit reached. Please try again later.')
        return
      }
      if (!res.ok) throw new Error('Geocoding request failed')
      const data = await res.json()
      if (!data || data.length === 0) {
        setGeocodeError('No coordinates found for the given city')
        return
      }
      const place = data[0]
      setFormData(prev => ({ ...prev, location: { ...prev.location, latitude: parseFloat(place.lat), longitude: parseFloat(place.lon) } }))
    } catch (err) {
      console.error('Geocoding error', err)
      setGeocodeError(err.message || 'Failed to lookup coordinates')
    } finally {
      setGeocoding(false)
    }
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
      slotsPerDay: 10,
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

  const handleEditOperator = (station) => {
    setEditingOperator(station)
    setOperatorFormData({
      username: station.assignedOperatorUsername || '',
      password: station.assignedOperatorPassword || ''
    })
    setShowOperatorModal(true)
  }

  const handleOperatorSubmit = async (e) => {
    e.preventDefault()
    try {
      await apiService.updateOperatorCredentials(editingOperator.id, operatorFormData)
      Swal.fire('Success', 'Operator credentials updated successfully', 'success')
      setShowOperatorModal(false)
      loadStations()
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update credentials', 'error')
    }
  }

  const resetOperatorForm = () => {
    setOperatorFormData({
      username: '',
      password: ''
    })
    setEditingOperator(null)
    setShowOperatorModal(false)
  }

  if (loading) return <LoadingSpinner text="Loading charging stations..." />

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-charging-station me-2 text-primary"></i>
          Charging Stations Management
        </h2>
        {/* Backoffice controls only */}
        {isBackoffice && (
          <div className="btn-group">
            <button 
              className="btn btn-success"
              onClick={() => window.location.href = '/create-station-with-operator'}
            >
              <i className="fas fa-plus-circle me-2"></i>
              Create Station + Operator
            </button>
          </div>
        )}
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
                  <i className="fas fa-plug text-muted me-2"></i>
                  <strong>{station.totalSlots}</strong> total physical sockets
                </p>
                <p className="card-text">
                  <i className="fas fa-clock text-muted me-2"></i>
                  <strong>{station.availableSlots?.length || 0}</strong> scheduled time slots
                  {station.availableSlots && (
                    <div>
                      <small className="text-muted">
                        {station.availableSlots.filter(s => s.isAvailable).length} available
                      </small>
                    </div>
                  )}
                </p>
                
                {/* Operator Credentials Section */}
                {station.assignedOperatorUsername && (
                  <div className="operator-credentials mb-3">
                    <h6 className="text-muted mb-2">
                      <i className="fas fa-user-cog me-2"></i>
                      Station Operator
                    </h6>
                    <div className="row g-2">
                      <div className="col-12">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">Username</span>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={station.assignedOperatorUsername} 
                            readOnly 
                          />
                          <button 
                            className="btn btn-outline-secondary" 
                            type="button"
                            onClick={() => navigator.clipboard.writeText(station.assignedOperatorUsername)}
                            title="Copy username"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">Password</span>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={station.assignedOperatorPassword || 'Not Available'} 
                            readOnly 
                          />
                          <button 
                            className="btn btn-outline-secondary" 
                            type="button"
                            onClick={() => navigator.clipboard.writeText(station.assignedOperatorPassword || '')}
                            title="Copy password"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                      </div>
                      <div className="col-12">
                        <button 
                          className="btn btn-sm btn-warning w-100"
                          onClick={() => handleEditOperator(station)}
                        >
                          <i className="fas fa-edit me-1"></i>
                          Edit Operator Credentials
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
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
                <label className="form-label">Sockets (physical chargers) *</label>
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
                <label className="form-label">Slots Per Day *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.slotsPerDay}
                  onChange={(e) => setFormData({ ...formData, slotsPerDay: parseInt(e.target.value) })}
                  min="1"
                  max="48"
                  required
                />
                <div className="form-text">Number of time slots generated per day (default 10)</div>
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
            <div className="col-12 mb-3">
              <button
                type="button"
                className="btn btn-outline-secondary me-2"
                onClick={handleGeocodeAddress}
                disabled={geocoding}
              >
                {geocoding ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-search-location me-2"></i>}
                Lookup coordinates from city
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleUseCurrentLocation}
                disabled={locating}
              >
                {locating ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-map-marker-alt me-2"></i>}
                Use current location
              </button>
              {geocodeError && <div className="text-danger small mt-2">{geocodeError}</div>}
              {locationError && <div className="text-danger small mt-2">{locationError}</div>}
            </div>

            <div className="col-12 mb-3">
              <MapPicker
                lat={formData.location.latitude || 6.9271}
                lon={formData.location.longitude || 79.8612}
                onChange={({ latitude, longitude }) => setFormData(prev => ({ ...prev, location: { ...prev.location, latitude, longitude } }))}
              />
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

      {/* Operator Credentials Edit Modal */}
      <Modal
        show={showOperatorModal}
        onClose={resetOperatorForm}
        title="Edit Operator Credentials"
        size="md"
      >
        <form onSubmit={handleOperatorSubmit}>
          <div className="mb-3">
            <label className="form-label">Station Name</label>
            <input
              type="text"
              className="form-control"
              value={editingOperator?.name || ''}
              readOnly
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Username *</label>
            <input
              type="text"
              className="form-control"
              value={operatorFormData.username}
              onChange={(e) => setOperatorFormData(prev => ({...prev, username: e.target.value}))}
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Password *</label>
            <input
              type="text"
              className="form-control"
              value={operatorFormData.password}
              onChange={(e) => setOperatorFormData(prev => ({...prev, password: e.target.value}))}
              required
              placeholder="Enter new password"
            />
          </div>

          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Important:</strong> Changing credentials will require the operator to use the new username and password to log in.
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={resetOperatorForm}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning">
              <i className="fas fa-save me-2"></i>
              Update Credentials
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ChargingStations