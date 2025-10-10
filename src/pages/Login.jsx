import React, { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2'

const Login = () => {
  const { login, isAuthenticated } = useAuth()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(credentials.username, credentials.password)
    
    if (!result.success) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: result.error
      })
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
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
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              {/* Header Section */}
              <div className="text-white text-center py-5" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                <div className="d-inline-flex align-items-center justify-content-center bg-white bg-opacity-25 rounded-circle mb-3" style={{ width: '100px', height: '100px' }}>
                  <i className="fas fa-charging-station fa-3x"></i>
                </div>
                <h2 className="fw-bold mb-2">EV Charging System</h2>
                <p className="mb-0 opacity-75">Sign in to your account</p>
              </div>

              {/* Body Section */}
              <div className="card-body p-4 p-md-5">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="username" className="form-label fw-medium">
                      <i className="fas fa-user text-success me-2"></i>
                      Username
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-success bg-opacity-10 border-success" style={{ borderRadius: '10px 0 0 10px' }}>
                        <i className="fas fa-user text-success"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-success"
                        id="username"
                        name="username"
                        value={credentials.username}
                        onChange={handleChange}
                        placeholder="Enter your username"
                        required
                        style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label fw-medium">
                      <i className="fas fa-lock text-success me-2"></i>
                      Password
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-success bg-opacity-10 border-success" style={{ borderRadius: '10px 0 0 10px' }}>
                        <i className="fas fa-lock text-success"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control border-success"
                        id="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-lg w-100 text-white fw-semibold"
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
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                {/* Info Section */}
                <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: '#e8f5e9' }}>
                  <div className="d-flex align-items-start gap-2">
                    <i className="fas fa-info-circle text-success mt-1"></i>
                    <small className="text-dark">
                      <strong>EV Owners:</strong> please register using the mobile application.
                    </small>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="text-center mt-4 pt-3 border-top">
                  <p className="text-muted small mb-0">
                    <i className="fas fa-user-cog text-success me-1"></i>
                    Station Operators receive login credentials from Backoffice
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
                    Secure access to the EV charging management system
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

export default Login