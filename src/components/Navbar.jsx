import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout, isAuthenticated, isBackoffice, isStationOperator } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!isAuthenticated) return null

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-lg sticky-top" style={{ 
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      borderBottom: '3px solid rgba(255,255,255,0.1)'
    }}>
      <div className="container-fluid px-3 px-lg-4">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2 py-2" to="/dashboard" style={{ fontSize: '1.3rem' }}>
          <div className="bg-white bg-opacity-25 p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <i className="fas fa-charging-station" style={{ fontSize: '1.2rem' }}></i>
          </div>
          <span className="d-none d-md-inline">EV Charging System</span>
          <span className="d-inline d-md-none">EV Charge</span>
        </Link>
        
        <button 
          className="navbar-toggler border-0 shadow-sm" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto ms-lg-4">
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 py-2 rounded-3 d-flex align-items-center gap-2 ${isActive('/dashboard') ? 'fw-semibold' : ''}`} 
                to="/dashboard"
                style={isActive('/dashboard') ? { 
                  backgroundColor: 'rgba(255,255,255,0.25)', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                } : { transition: 'all 0.2s' }}
                onMouseEnter={(e) => {
                  if (!isActive('/dashboard')) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/dashboard')) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <i className="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
              </Link>
            </li>
            
            {/* Backoffice Only - System Administration */}
            {isBackoffice && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded-3 d-flex align-items-center gap-2 ${isActive('/ev-owners') ? 'fw-semibold' : ''}`} 
                    to="/ev-owners"
                    style={isActive('/ev-owners') ? { 
                      backgroundColor: 'rgba(255,255,255,0.25)', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                    } : { transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      if (!isActive('/ev-owners')) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/ev-owners')) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <i className="fas fa-users"></i>
                    <span>EV Owners</span>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded-3 d-flex align-items-center gap-2 ${isActive('/charging-stations') ? 'fw-semibold' : ''}`} 
                    to="/charging-stations"
                    style={isActive('/charging-stations') ? { 
                      backgroundColor: 'rgba(255,255,255,0.25)', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                    } : { transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      if (!isActive('/charging-stations')) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/charging-stations')) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <i className="fas fa-map-marker-alt"></i>
                    <span>Manage Stations</span>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded-3 d-flex align-items-center gap-2 ${isActive('/users') ? 'fw-semibold' : ''}`} 
                    to="/users"
                    style={isActive('/users') ? { 
                      backgroundColor: 'rgba(255,255,255,0.25)', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                    } : { transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      if (!isActive('/users')) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/users')) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <i className="fas fa-user-cog"></i>
                    <span>User Management</span>
                  </Link>
                </li>
              </>
            )}
            
            {/* Station Operator Only - Operations */}
            {isStationOperator && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded-3 d-flex align-items-center gap-2 ${isActive('/charging-stations') ? 'fw-semibold' : ''}`} 
                    to="/charging-stations"
                    style={isActive('/charging-stations') ? { 
                      backgroundColor: 'rgba(255,255,255,0.25)', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                    } : { transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      if (!isActive('/charging-stations')) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/charging-stations')) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <i className="fas fa-charging-station"></i>
                    <span>My Stations</span>
                  </Link>
                </li>
              </>
            )}
            
            {/* Common Access - Booking Management */}
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 py-2 rounded-3 d-flex align-items-center gap-2 ${isActive('/bookings') ? 'fw-semibold' : ''}`} 
                to="/bookings"
                style={isActive('/bookings') ? { 
                  backgroundColor: 'rgba(255,255,255,0.25)', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                } : { transition: 'all 0.2s' }}
                onMouseEnter={(e) => {
                  if (!isActive('/bookings')) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/bookings')) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <i className="fas fa-calendar-alt"></i>
                <span>{isBackoffice ? 'Booking Management' : 'Booking Operations'}</span>
              </Link>
            </li>
          </ul>
          
          <div className="navbar-nav ms-auto">
            <li className="nav-item dropdown">
              <a 
                className="nav-link dropdown-toggle px-3 py-2 rounded-3 d-flex align-items-center gap-2" 
                href="#" 
                role="button" 
                data-bs-toggle="dropdown"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-center" style={{ width: '32px', height: '32px' }}>
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="d-none d-lg-block text-start">
                    <div className="fw-semibold" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>{user?.username}</div>
                    <div style={{ fontSize: '0.75rem', opacity: '0.9' }}>{user?.role}</div>
                  </div>
                  <div className="d-lg-none">
                    <span className="fw-semibold">{user?.username}</span>
                  </div>
                </div>
              </a>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" style={{ minWidth: '200px' }}>
                <li className="px-3 py-2 border-bottom d-lg-none">
                  <div className="text-muted small">Signed in as</div>
                  <div className="fw-semibold">{user?.username}</div>
                  <div className="text-muted small">{user?.role}</div>
                </li>
                <li>
                  <button 
                    className="dropdown-item d-flex align-items-center gap-2 py-2" 
                    onClick={handleLogout}
                    style={{ transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <i className="fas fa-sign-out-alt text-danger"></i>
                    <span className="fw-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </li>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar