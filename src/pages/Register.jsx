import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiService from '../services/api'
import Swal from 'sweetalert2'

const Register = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid'
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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

    try {
      await apiService.createBackofficeUser(formData)
      
      await Swal.fire({
        title: 'Registration Successful!',
        text: 'Your Backoffice account has been created successfully. You can now login and manage the EV charging system.',
        icon: 'success',
        confirmButtonText: 'Go to Login'
      })

      navigate('/login')
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data) {
        errorMessage = error.response.data
      } else if (error.message) {
        errorMessage = error.message
      }

      Swal.fire({
        title: 'Registration Failed',
        text: errorMessage,
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      backgroundImage: 'linear-gradient(rgba(17, 153, 142, 0.4), rgba(56, 239, 125, 0.4)), url("https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1920&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-10 col-lg-8 col-xl-7">
            <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              {/* Header Section */}
              <div className="text-white text-center py-5" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                <div className="d-inline-flex align-items-center justify-content-center bg-white bg-opacity-25 rounded-circle mb-3" style={{ width: '100px', height: '100px' }}>
                  <i className="fas fa-user-tie fa-3x"></i>
                </div>
                <h2 className="fw-bold mb-2">Backoffice Registration</h2>
                <p className="mb-0 opacity-75">Create your administrator account</p>
              </div>

              {/* Body Section */}
              <div className="card-body p-4 p-md-5">
                <div className="mb-4 p-3 rounded-3" style={{ backgroundColor: '#e8f5e9' }}>
                  <div className="d-flex align-items-start gap-2">
                    <i className="fas fa-info-circle text-success mt-1"></i>
                    <small className="text-dark">
                      <strong>Backoffice Access:</strong> Create stations, manage operators, and oversee the entire EV charging system.
                    </small>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="firstName" className="form-label fw-medium">
                          <i className="fas fa-user text-success me-2"></i>
                          First Name <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-success bg-opacity-10 border-success" style={{ borderRadius: '10px 0 0 10px' }}>
                            <i className="fas fa-user text-success"></i>
                          </span>
                          <input
                            type="text"
                            className={`form-control border-success ${errors.firstName ? 'is-invalid' : ''}`}
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="Enter first name"
                            style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                          />
                          {errors.firstName && (
                            <div className="invalid-feedback">{errors.firstName}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="lastName" className="form-label fw-medium">
                          <i className="fas fa-user text-success me-2"></i>
                          Last Name <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-success bg-opacity-10 border-success" style={{ borderRadius: '10px 0 0 10px' }}>
                            <i className="fas fa-user text-success"></i>
                          </span>
                          <input
                            type="text"
                            className={`form-control border-success ${errors.lastName ? 'is-invalid' : ''}`}
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Enter last name"
                            style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                          />
                          {errors.lastName && (
                            <div className="invalid-feedback">{errors.lastName}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-medium">
                      <i className="fas fa-at text-success me-2"></i>
                      Username <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-success bg-opacity-10 border-success" style={{ borderRadius: '10px 0 0 10px' }}>
                        <i className="fas fa-at text-success"></i>
                      </span>
                      <input
                        type="text"
                        className={`form-control border-success ${errors.username ? 'is-invalid' : ''}`}
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Choose a username"
                        style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                      />
                      {errors.username && (
                        <div className="invalid-feedback">{errors.username}</div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium">
                      <i className="fas fa-envelope text-success me-2"></i>
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-success bg-opacity-10 border-success" style={{ borderRadius: '10px 0 0 10px' }}>
                        <i className="fas fa-envelope text-success"></i>
                      </span>
                      <input
                        type="email"
                        className={`form-control border-success ${errors.email ? 'is-invalid' : ''}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email address"
                        style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label fw-medium">
                      <i className="fas fa-phone text-success me-2"></i>
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-success bg-opacity-10 border-success" style={{ borderRadius: '10px 0 0 10px' }}>
                        <i className="fas fa-phone text-success"></i>
                      </span>
                      <input
                        type="tel"
                        className={`form-control border-success ${errors.phoneNumber ? 'is-invalid' : ''}`}
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                      />
                      {errors.phoneNumber && (
                        <div className="invalid-feedback">{errors.phoneNumber}</div>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-4">
                        <label htmlFor="password" className="form-label fw-medium">
                          <i className="fas fa-lock text-success me-2"></i>
                          Password <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-success bg-opacity-10 border-success" style={{ borderRadius: '10px 0 0 10px' }}>
                            <i className="fas fa-lock text-success"></i>
                          </span>
                          <input
                            type="password"
                            className={`form-control border-success ${errors.password ? 'is-invalid' : ''}`}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Create a password"
                            style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                          />
                          {errors.password && (
                            <div className="invalid-feedback">{errors.password}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-4">
                        <label htmlFor="confirmPassword" className="form-label fw-medium">
                          <i className="fas fa-lock text-success me-2"></i>
                          Confirm Password <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-success bg-opacity-10 border-success" style={{ borderRadius: '10px 0 0 10px' }}>
                            <i className="fas fa-lock text-success"></i>
                          </span>
                          <input
                            type="password"
                            className={`form-control border-success ${errors.confirmPassword ? 'is-invalid' : ''}`}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm your password"
                            style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                          />
                          {errors.confirmPassword && (
                            <div className="invalid-feedback">{errors.confirmPassword}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-lg w-100 text-white fw-semibold mb-4"
                    disabled={loading}
                    style={{ 
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '14px'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus me-2"></i>
                        Register as Backoffice User
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Already have an account?{' '}
                      <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: '#11998e' }}>
                        Login here
                      </Link>
                    </p>
                  </div>
                </form>

                {/* Footer Info */}
                <div className="text-center mt-4 pt-3 border-top">
                  <p className="text-muted small mb-0">
                    <i className="fas fa-user-cog text-success me-1"></i>
                    Station Operator accounts are created by Backoffice users when setting up new charging stations
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="text-center mt-4">
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                <div className="card-body p-3">
                  <small className="text-muted">
                    <i className="fas fa-shield-alt text-success me-2"></i>
                    Secure administrator access to the EV charging management system
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register