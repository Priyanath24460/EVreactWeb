import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import Swal from 'sweetalert2'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import MapPicker from '../components/MapPicker'

const BackofficeChargingStations = () => {
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

  const { isBackoffice } = useAuth()

  const loadStations = useCallback(async () => {
    try {
      const data = await apiService.getChargingStations()
      setStations(data)
    } catch (err) {
      console.error('Failed to load stations', err)
      Swal.fire('Error', 'Failed to load charging stations', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isBackoffice) loadStations()
  }, [loadStations, isBackoffice])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
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

  if (!isBackoffice) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="fas fa-ban me-2"></i>
          Access denied. This page is only available for Backoffice users.
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner text="Loading charging stations..." />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 p-md-6">
      <div className="container-fluid" style={{ maxWidth: '1600px' }}>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-5 gap-3">
          <div>
            <h1 className="h3 fw-bold text-dark d-flex align-items-center gap-3 mb-2">
              <span className="bg-success text-white p-2 rounded-3 shadow">
                <i className="fas fa-charging-station fa-lg"></i>
              </span>
              Charging Stations Management
            </h1>
            <p className="text-muted mb-0 ms-1">Manage all charging stations and operators</p>
          </div>
          <button 
            className="btn btn-success px-3 py-2 shadow-sm d-flex align-items-center gap-2"
            onClick={() => window.location.href = '/create-station-with-operator'}
          >
            <i className="fas fa-plus-circle"></i>
            Create Station with Operator
          </button>
        </div>

        {/* Stations List */}
        {stations.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-4" style={{ width: '80px', height: '80px' }}>
                <i className="fas fa-charging-station fa-2x text-muted"></i>
              </div>
              <h4 className="fw-bold text-dark mb-3">No Charging Stations</h4>
              <p className="text-muted mb-4">Get started by creating your first charging station.</p>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {stations.map(station => (
              <div key={station.id} className="col-12 col-xl-6">
                <div className="card border-0 shadow-sm">
                  {/* Station Header Bar */}
                  <div 
                    className="p-3" 
                    style={{ 
                      background: station.isActive 
                        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' 
                        : 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-white bg-opacity-25 p-3 rounded-3">
                          <i className="fas fa-charging-station text-white" style={{ fontSize: '1rem' }}></i>
                        </div>
                        <div>
                          <h4 className="text-white fw-bold mb-1" style={{ fontSize: '1rem' }}>{station.name}</h4>
                          <div className="d-flex gap-2 align-items-center flex-wrap">
                            <span className={`badge ${station.stationType === 'AC' ? 'bg-info' : 'bg-warning text-dark'} px-3 py-2 fs-6`}>
                              {station.stationType} Charging
                            </span>
                            <span className={`badge ${station.isActive ? 'bg-white text-success' : 'bg-danger'} px-3 py-2 fs-6`}>
                              {station.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <button 
                          className="btn btn-light px-3 py-2"
                          onClick={() => handleEdit(station)}
                        >
                          <i className="fas fa-edit me-2"></i>Edit
                        </button>
                        {station.isActive && (
                          <button 
                            className="btn btn-warning px-3 py-2"
                            onClick={() => handleDeactivate(station.id)}
                          >
                            <i className="fas fa-ban me-2"></i>Deactivate
                          </button>
                        )}
                        <button 
                          className="btn btn-danger px-3 py-2"
                          onClick={() => handleDelete(station.id)}
                        >
                          <i className="fas fa-trash me-2"></i>Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Station Content */}
                  <div className="card-body p-3">
                    {/* Location Section - Row 1 */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="bg-danger bg-opacity-10 p-2 rounded-3">
                          <i className="fas fa-map-marker-alt text-danger" style={{ fontSize: '1.15rem' }}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0" style={{ fontSize: '0.95rem' }}>Location</h6>
                          <small className="text-muted">Station Address</small>
                        </div>
                      </div>
                      <div className="bg-light p-3 rounded-3">
                        <div className="row g-2">
                          <div className="col-md-4">
                            <label className="text-muted small fw-semibold mb-1 d-block">CITY</label>
                            <p className="fw-semibold text-dark mb-0" style={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>{station.location.city}</p>
                          </div>
                          <div className="col-md-5">
                            <label className="text-muted small fw-semibold mb-1 d-block">ADDRESS</label>
                            <p className="text-dark mb-0" style={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>{station.location.address}</p>
                          </div>
                          <div className="col-md-3">
                            <label className="text-muted small fw-semibold mb-1 d-block">COORDINATES</label>
                            <p className="text-dark mb-0 font-monospace small" style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>
                              <i className="fas fa-globe me-2"></i>
                              {station.location.latitude?.toFixed(4)}, {station.location.longitude?.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Section - Row 2 */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                          <i className="fas fa-plug text-primary" style={{ fontSize: '1.15rem' }}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0" style={{ fontSize: '0.95rem' }}>Capacity</h6>
                          <small className="text-muted">Available Resources</small>
                        </div>
                      </div>
                      <div className="bg-light p-3 rounded-3">
                        <div className="row g-2 align-items-center">
                          <div className="col-md-4">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-center">
                              <i className="fas fa-plug text-primary mb-2" style={{ fontSize: '1.15rem' }}></i>
                              <p className="text-muted small mb-1 fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Physical Sockets</p>
                              <div className="fw-bold text-primary mb-0">{station.totalSlots}</div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="bg-success bg-opacity-10 p-2 rounded-3 text-center">
                              <i className="fas fa-clock text-success mb-2" style={{ fontSize: '1.15rem' }}></i>
                              <p className="text-muted small mb-1 fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Time Slots</p>
                              <div className="fw-bold text-success mb-0">{station.availableSlots?.length || 0}</div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            {station.availableSlots && (
                              <div className="bg-white p-3 rounded-3 text-center shadow-sm">
                                <i className="fas fa-check-circle text-success mb-2" style={{ fontSize: '1.15rem' }}></i>
                                <p className="text-muted small mb-1 fw-semibold" style={{ fontSize: '0.7rem' }}>AVAILABLE NOW</p>
                                <div className="fw-bold text-success mb-0">
                                  {station.availableSlots.filter(s => s.isAvailable).length}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operator Section - Row 3 */}
                    <div>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="bg-purple bg-opacity-10 p-3 rounded-3" style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }}>
                          <i className="fas fa-user-cog fa-2x" style={{ color: '#6f42c1' }}></i>
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1">Station Operator</h5>
                          <small className="text-muted">Login Credentials</small>
                        </div>
                      </div>
                      
                      {station.assignedOperatorUsername ? (
                        <div className="bg-light p-4 rounded-3">
                          <div className="row g-3 align-items-center">
                            <div className="col-md-5">
                              <label className="text-muted small fw-semibold mb-2 d-block text-uppercase">Username</label>
                              <div className="d-flex align-items-center gap-2 bg-white p-3 rounded-3 shadow-sm">
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                  <p className="mb-0 fw-bold text-dark" style={{ fontSize: '1.1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                    {station.assignedOperatorUsername}
                                  </p>
                                </div>
                                <button 
                                  className="btn btn-outline-secondary border-2 px-3 py-2 flex-shrink-0" 
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(station.assignedOperatorUsername)}
                                  title="Copy username"
                                >
                                  <i className="fas fa-copy"></i>
                                </button>
                              </div>
                            </div>
                            
                            <div className="col-md-5">
                              <label className="text-muted small fw-semibold mb-2 d-block text-uppercase">Password</label>
                              <div className="d-flex align-items-center gap-2 bg-white p-3 rounded-3 shadow-sm">
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                  <p className="mb-0 fw-bold text-dark" style={{ fontSize: '1.1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                    {station.assignedOperatorPassword || 'Not Available'}
                                  </p>
                                </div>
                                <button 
                                  className="btn btn-outline-secondary border-2 px-3 py-2 flex-shrink-0" 
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(station.assignedOperatorPassword || '')}
                                  title="Copy password"
                                >
                                  <i className="fas fa-copy"></i>
                                </button>
                              </div>
                            </div>

                            <div className="col-md-2">
                              <button 
                                className="btn btn-warning w-100 py-3 fw-bold"
                                onClick={() => handleEditOperator(station)}
                              >
                                <i className="fas fa-edit d-block mb-1"></i>
                                <small>Edit</small>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-light p-5 rounded-3 text-center">
                          <i className="fas fa-user-slash fa-3x text-muted mb-3 opacity-50"></i>
                          <p className="text-muted mb-0 fw-semibold">No operator assigned</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Station Modal */}
      <Modal
        show={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingStation ? 'Edit Charging Station' : 'Add New Charging Station'}
        size="lg"
      >
        <div>
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
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => { setShowModal(false); resetForm(); }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              {editingStation ? 'Update' : 'Create'} Station
            </button>
          </div>
        </div>
      </Modal>

      {/* Operator Credentials Edit Modal */}
      <Modal
        show={showOperatorModal}
        onClose={resetOperatorForm}
        title="Edit Operator Credentials"
        size="md"
      >
        <div>
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
            <button 
              type="button" 
              className="btn btn-warning"
              onClick={handleOperatorSubmit}
            >
              <i className="fas fa-save me-2"></i>
              Update Credentials
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default BackofficeChargingStations