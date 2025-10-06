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
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    
    // Operator details
    operatorUsername: '',
    operatorPassword: '',
    operatorEmail: ''
  })

  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

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

  const validateForm = () => {
    const newErrors = {}

    // Station validation
    if (!formData.name.trim()) newErrors.name = 'Station name is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (formData.totalSlots < 1) newErrors.totalSlots = 'Must have at least 1 slot'
    if (formData.latitude && isNaN(parseFloat(formData.latitude))) {
      newErrors.latitude = 'Invalid latitude format'
    }
    if (formData.longitude && isNaN(parseFloat(formData.longitude))) {
      newErrors.longitude = 'Invalid longitude format'
    }

    // Operator validation
    if (!formData.operatorUsername.trim()) {
      newErrors.operatorUsername = 'Operator username is required'
    }
    if (!formData.operatorPassword.trim()) {
      newErrors.operatorPassword = 'Operator password is required'
    }
    if (formData.operatorPassword.length < 6) {
      newErrors.operatorPassword = 'Password must be at least 6 characters'
    }
    if (!formData.operatorEmail.trim()) {
      newErrors.operatorEmail = 'Operator email is required'
    }
    if (!/\S+@\S+\.\S+/.test(formData.operatorEmail)) {
      newErrors.operatorEmail = 'Invalid email format'
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
        operatorUsername: formData.operatorUsername,
        operatorPassword: formData.operatorPassword,
        operatorEmail: formData.operatorEmail
      }

      const response = await apiService.createStationWithOperator(stationData)
      
      setSuccessMessage(`Station "${formData.name}" created successfully with operator "${formData.operatorUsername}"!`)
      
      // Reset form
      setFormData({
        name: '',
        stationType: 'AC',
        totalSlots: 1,
        address: '',
        city: '',
        latitude: '',
        longitude: '',
        operatorUsername: '',
        operatorPassword: '',
        operatorEmail: ''
      })
      
    } catch (error) {
      console.error('Error creating station:', error)
      setErrors({ submit: error.response?.data?.message || 'Failed to create station. Please try again.' })
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
              {successMessage && (
                <div className="alert alert-success alert-dismissible fade show">
                  <i className="fas fa-check-circle me-2"></i>
                  {successMessage}
                  <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
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
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Total Slots *</label>
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
                  </div>
                </div>

                {/* Operator Assignment Section */}
                <div className="mb-4">
                  <h5 className="text-success mb-3">
                    <i className="fas fa-user-cog me-2"></i>
                    Station Operator Assignment
                  </h5>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Operator Username *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.operatorUsername ? 'is-invalid' : ''}`}
                        name="operatorUsername"
                        value={formData.operatorUsername}
                        onChange={handleInputChange}
                        placeholder="operator.username"
                      />
                      {errors.operatorUsername && <div className="invalid-feedback">{errors.operatorUsername}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Operator Email *</label>
                      <input
                        type="email"
                        className={`form-control ${errors.operatorEmail ? 'is-invalid' : ''}`}
                        name="operatorEmail"
                        value={formData.operatorEmail}
                        onChange={handleInputChange}
                        placeholder="operator@company.com"
                      />
                      {errors.operatorEmail && <div className="invalid-feedback">{errors.operatorEmail}</div>}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Operator Password *</label>
                      <input
                        type="password"
                        className={`form-control ${errors.operatorPassword ? 'is-invalid' : ''}`}
                        name="operatorPassword"
                        value={formData.operatorPassword}
                        onChange={handleInputChange}
                        placeholder="Minimum 6 characters"
                      />
                      {errors.operatorPassword && <div className="invalid-feedback">{errors.operatorPassword}</div>}
                    </div>
                  </div>

                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Note:</strong> The operator will receive these credentials to manage this specific charging station. 
                    They will only have access to this station and cannot create new stations or manage other operators.
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