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
    <div className="container-fluid vh-100 bg-light">
      <div className="row h-100 justify-content-center align-items-center">
        <div className="col-md-4 col-sm-8">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <i className="fas fa-charging-station fa-3x text-primary mb-3"></i>
                <h2 className="card-title fw-bold">EV Charging System</h2>
                <p className="text-muted">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-user"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={credentials.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2"
                  disabled={loading}
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

              <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                  <strong>Demo Accounts:</strong><br/>
                  <span className="text-primary">Backoffice:</span> admin / admin123 <i className="fas fa-user-tie ms-1"></i><br/>
                  <span className="text-success">Station Operator:</span> (Created by Backoffice) <i className="fas fa-user-cog ms-1"></i>
                </small>
              </div>

              <div className="text-center mt-3">
                <p className="mb-0">
                  Need a Backoffice account?{' '}
                  <Link to="/register" className="text-decoration-none">
                    Register here
                  </Link>
                </p>
                <p className="mt-2 text-muted small">
                  <i className="fas fa-info-circle me-1"></i>
                  Station Operators receive login credentials from Backoffice
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login