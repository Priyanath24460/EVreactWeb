import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout, isAuthenticated, isBackoffice } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!isAuthenticated) return null

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/dashboard">
          <i className="fas fa-charging-station me-2"></i>
          EV Charging System
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} 
                to="/dashboard"
              >
                <i className="fas fa-tachometer-alt me-1"></i>
                Dashboard
              </Link>
            </li>
            
            {/* Backoffice Only - System Administration */}
            {isBackoffice && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/ev-owners') ? 'active' : ''}`} 
                    to="/ev-owners"
                  >
                    <i className="fas fa-users me-1"></i>
                    EV Owners
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/charging-stations') ? 'active' : ''}`} 
                    to="/charging-stations"
                  >
                    <i className="fas fa-map-marker-alt me-1"></i>
                    Manage Stations
                  </Link>
                </li>

                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/users') ? 'active' : ''}`} 
                    to="/users"
                  >
                    <i className="fas fa-user-cog me-1"></i>
                    User Management
                  </Link>
                </li>
              </>
            )}
            
            {/* Station Operator Only - Operations */}
            {user?.role === 'StationOperator' && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/station-operations') ? 'active' : ''}`} 
                    to="/station-operations"
                  >
                    <i className="fas fa-tools me-1"></i>
                    Station Operations
                  </Link>
                </li>
              </>
            )}
            
            {/* Common Access - Booking Management */}
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/bookings') ? 'active' : ''}`} 
                to="/bookings"
              >
                <i className="fas fa-calendar-alt me-1"></i>
                {isBackoffice ? 'Booking Management' : 'Booking Operations'}
              </Link>
            </li>
          </ul>
          
          <div className="navbar-nav">
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i className="fas fa-user-circle me-1"></i>
                {user?.username} ({user?.role})
              </a>
              <ul className="dropdown-menu">
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
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