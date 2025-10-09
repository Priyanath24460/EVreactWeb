import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const CreateStationWithOperator = () => {
  const { isBackoffice } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Station details
    name: '',
    stationType: 'AC',
    totalSlots: 1,
    slotsPerDay: 10,
    address: '',
    city: '',
    latitude: '',
    longitude: ''
  })

  const [generatedCredentials, setGeneratedCredentials] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')

  const [errors, setErrors] = useState({})
  const [, setSuccessMessage] = useState('')

  if (!isBackoffice) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Access Denied. Only Backoffice users can create stations.
        </div>
      </div>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
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
          latitude: String(latitude),
          longitude: String(longitude)
        }))
        // Clear coordinate validation errors if any
        setErrors(prev => ({ ...prev, latitude: '', longitude: '' }))
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
    // Use city only for geocoding (user requested lookup from city)
    const city = `${formData.city}`.trim()
    if (!city) {
      setGeocodeError('Please enter a city to lookup')
      return
    }

    setGeocodeError('')
    setGeocoding(true)

    try {
      // Use OpenStreetMap Nominatim public API for geocoding (suitable for testing).
      // Note: Nominatim has usage limits and requires identifying info for heavy use.
      const q = encodeURIComponent(city)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`
      const res = await fetch(url, { method: 'GET' })
      if (!res.ok) throw new Error('Geocoding request failed')
      const data = await res.json()
      if (!data || data.length === 0) {
        setGeocodeError('No coordinates found for the given city')
        return
      }

      const place = data[0]
      setFormData(prev => ({ ...prev, latitude: String(place.lat), longitude: String(place.lon) }))
      // clear any coordinate validation errors
      setErrors(prev => ({ ...prev, latitude: '', longitude: '' }))
    } catch (err) {
      console.error('Geocoding error', err)
      setGeocodeError(err.message || 'Failed to lookup coordinates')
    } finally {
      setGeocoding(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Station validation
    if (!formData.name.trim()) newErrors.name = 'Station name is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (formData.totalSlots < 1) newErrors.totalSlots = 'Must have at least 1 slot'
    if (isNaN(parseInt(formData.slotsPerDay)) || parseInt(formData.slotsPerDay) < 1) newErrors.slotsPerDay = 'Must have at least 1 slot per day'
    if (formData.latitude && isNaN(parseFloat(formData.latitude))) {
      newErrors.latitude = 'Invalid latitude format'
    }
    if (formData.longitude && isNaN(parseFloat(formData.longitude))) {
      newErrors.longitude = 'Invalid longitude format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccessMessage('')

    try {
      const stationData = {
        name: formData.name,
        location: {
          address: formData.address,
          city: formData.city,
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0
        },
        stationType: formData.stationType,
        totalSlots: parseInt(formData.totalSlots),
        slotsPerDay: parseInt(formData.slotsPerDay) || 10
      }

      const response = await apiService.createStationWithOperator(stationData)

      // Store generated credentials to display
      setGeneratedCredentials({
        username: response.generatedUsername,
        password: response.generatedPassword,
        stationName: formData.name
      })

      setSuccessMessage(`Station "${formData.name}" created successfully with auto-generated operator credentials!`)

      // Reset form
      setFormData({
        name: '',
        stationType: 'AC',
        totalSlots: 1,
        slotsPerDay: 10,
        address: '',
        city: '',
        latitude: '',
        longitude: ''
      })

      // Clear any previous errors
      setErrors({})

    } catch (error) {
      console.error('Error creating station:', error)
      setErrors({ submit: error.response?.data?.message || 'Failed to create station. Please try again.' })
      setGeneratedCredentials(null) // Clear credentials on error
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Creating station and operator..." />
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-plus me-2 text-primary"></i>
                Create New Charging Station with Operator
              </h4>
            </div>
            <div className="card-body">
              {generatedCredentials && (
                <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm">
                  <h5 className="alert-heading text-success">
                    <i className="fas fa-key me-2"></i>
                    Station Operator Credentials Generated Successfully!
                  </h5>
                  <div className="bg-white p-3 rounded border border-success-subtle mb-3">
                    <p className="mb-3">
                      <strong className="text-dark">Station:</strong>
                      <span className="ms-2 badge bg-primary">{generatedCredentials.stationName}</span>
                    </p>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold text-dark">Username:</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control bg-light border-success"
                            value={generatedCredentials.username}
                            readOnly
                          />
                          <button
                            className="btn btn-success"
                            type="button"
                            onClick={() => navigator.clipboard.writeText(generatedCredentials.username)}
                            title="Copy username to clipboard"
                          >
                            <i className="fas fa-copy me-1"></i>
                            Copy
                          </button>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold text-dark">Password:</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control bg-light border-success"
                            value={generatedCredentials.password}
                            readOnly
                          />
                          <button
                            className="btn btn-success"
                            type="button"
                            onClick={() => navigator.clipboard.writeText(generatedCredentials.password)}
                            title="Copy password to clipboard"
                          >
                            <i className="fas fa-copy me-1"></i>
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="d-grid gap-2 d-md-flex justify-content-md-start mt-3">
                      <button
                        className="btn btn-outline-success btn-sm"
                        onClick={() => {
                          const credentials = `Username: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`
                          navigator.clipboard.writeText(credentials)
                        }}
                        title="Copy both credentials"
                      >
                        <i className="fas fa-clipboard me-1"></i>
                        Copy Both Credentials
                      </button>
                    </div>

                    <div className="d-flex align-items-start mt-3">
                      <i className="fas fa-info-circle text-success me-2 mt-1"></i>
                      <div>
                        <small className="text-dark">
                          <strong>Important:</strong> Save these credentials securely and share them with the Station Operator.
                          They will need these credentials to access their operator dashboard and manage this charging station.
                        </small>
                      </div>
                    </div>
                  </div>

                  <button type="button" className="btn-close" onClick={() => setGeneratedCredentials(null)}></button>
                </div>
              )}

              {errors.submit && (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Station Information Section */}
                <div className="mb-4">
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-charging-station me-2"></i>
                    Station Information
                  </h5>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Station Name *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Central Mall Charging Hub"
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Station Type *</label>
                      <select
                        className="form-select"
                        name="stationType"
                        value={formData.stationType}
                        onChange={handleInputChange}
                      >
                        <option value="AC">AC Charging</option>
                        <option value="DC">DC Fast Charging</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Address *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address"
                      />
                      {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">City *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City name"
                      />
                      {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                    </div>
                    <div className="col-12 mb-3">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleGeocodeAddress}
                        disabled={geocoding}
                      >
                        {geocoding ? (
                          <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : (
                          <i className="fas fa-search-location me-2"></i>
                        )}
                        Lookup coordinates from city
                      </button>
                      {geocodeError && <div className="text-danger small mt-1">{geocodeError}</div>}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Sockets (physical chargers) *</label>
                      <input
                        type="number"
                        className={`form-control ${errors.totalSlots ? 'is-invalid' : ''}`}
                        name="totalSlots"
                        value={formData.totalSlots}
                        onChange={handleInputChange}
                        min="1"
                        max="50"
                      />
                      {errors.totalSlots && <div className="invalid-feedback">{errors.totalSlots}</div>}
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Slots Per Day *</label>
                      <input
                        type="number"
                        className={`form-control ${errors.slotsPerDay ? 'is-invalid' : ''}`}
                        name="slotsPerDay"
                        value={formData.slotsPerDay}
                        onChange={handleInputChange}
                        min="1"
                        max="48"
                      />
                      {errors.slotsPerDay && <div className="invalid-feedback">{errors.slotsPerDay}</div>}
                      <div className="form-text">Number of time slots generated per day (default 10)</div>
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Latitude (optional)</label>
                      <input
                        type="text"
                        className={`form-control ${errors.latitude ? 'is-invalid' : ''}`}
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        placeholder="e.g., 6.9271"
                      />
                      {errors.latitude && <div className="invalid-feedback">{errors.latitude}</div>}
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Longitude (optional)</label>
                      <input
                        type="text"
                        className={`form-control ${errors.longitude ? 'is-invalid' : ''}`}
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        placeholder="e.g., 79.8612"
                      />
                      {errors.longitude && <div className="invalid-feedback">{errors.longitude}</div>}
                    </div>

                    <div className="col-12 mb-3">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={handleUseCurrentLocation}
                        disabled={locating}
                      >
                        {locating ? (
                          <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : (
                          <i className="fas fa-map-marker-alt me-2"></i>
                        )}
                        Use current location
                      </button>
                      <div className="form-text mt-2">Or enter latitude and longitude manually</div>
                      {locationError && <div className="text-danger small mt-1">{locationError}</div>}
                    </div>
                  </div>
                </div>

                {/* Operator Assignment Section */}
                <div className="mb-4">
                  <h5 className="text-success mb-3">
                    <i className="fas fa-user-cog me-2"></i>
                    Station Operator Assignment
                  </h5>

                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Automatic Operator Creation:</strong> A Station Operator account will be automatically created with secure,
                    randomly generated credentials when you submit this form. You'll receive the username and password to share with the operator.
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="d-flex justify-content-between">
                  <a href="/charging-stations" className="btn btn-outline-secondary">
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to Stations
                  </a>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus me-2"></i>
                        Create Station & Operator
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateStationWithOperator