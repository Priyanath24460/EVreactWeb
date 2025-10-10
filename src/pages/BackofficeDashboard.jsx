import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const BackofficeDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBackofficeData()
  }, [])

  const loadBackofficeData = async () => {
    try {
      const [evOwners, stations, bookings, operators] = await Promise.all([
        apiService.getEVOwners(),
        apiService.getChargingStations(),
        apiService.getBookings(),
        apiService.getAllOperators()
      ])

      const activeStations = stations.filter(s => s.isActive)
      const pendingBookings = bookings.filter(b => b.status === 'Pending')
      const approvedBookings = bookings.filter(b => b.status === 'Approved')
      const completedBookings = bookings.filter(b => b.status === 'Completed')
      const activeOperators = operators.filter(o => o.isActive)

      setStats({
        totalEVOwners: evOwners.length,
        totalStations: stations.length,
        activeStations: activeStations.length,
        totalOperators: operators.length,
        activeOperators: activeOperators.length,
        totalBookings: bookings.length,
        pendingBookings: pendingBookings.length,
        approvedBookings: approvedBookings.length,
        completedBookings: completedBookings.length
      })

      const activities = [
        ...stations.slice(-5).map(s => ({
          type: 'station',
          action: 'created',
          item: s.name,
          date: s.createdAt
        })),
        ...bookings.slice(-5).map(b => ({
          type: 'booking',
          action: b.status.toLowerCase(),
          item: `Booking #${b.id?.substring(0, 8)}`,
          date: b.createdAt || b.updatedAt
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)

      setRecentActivities(activities)

    } catch (error) {
      console.error('Error loading backoffice data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading backoffice dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 p-md-6">
      <div className="container-fluid" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h1 className="h2 fw-bold text-dark d-flex align-items-center gap-3 mb-2">
              <span className="bg-success text-white p-3 rounded-3 shadow">
                <i className="fas fa-tachometer-alt"></i>
              </span>
              Backoffice Dashboard
            </h1>
            <p className="text-muted mb-0 ms-1">Comprehensive system overview and management</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="bg-white px-3 py-2 rounded-3 shadow-sm border d-flex align-items-center gap-2">
              <div className="bg-success bg-opacity-10 rounded-circle p-2" style={{ width: '32px', height: '32px' }}>
                <i className="fas fa-user-tie text-success small"></i>
              </div>
              <span className="fw-medium text-dark">{user?.username}</span>
            </div>
            <button 
              onClick={loadBackofficeData}
              className="btn btn-white border shadow-sm d-flex align-items-center gap-2"
            >
              <i className="fas fa-sync small"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Primary Stats */}
        <div className="row g-3 g-md-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-white-50 small fw-medium mb-1">Total EV Owners</p>
                    <h2 className="display-5 fw-bold mb-0">{stats.totalEVOwners || 0}</h2>
                  </div>
                  <div className="bg-white bg-opacity-25 p-3 rounded-3">
                    <i className="fas fa-users fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-white-50 small fw-medium mb-1">Active Operators</p>
                    <h2 className="display-5 fw-bold mb-0">{stats.activeOperators || 0}</h2>
                    <p className="text-white-50 small mb-0">Total: {stats.totalOperators || 0}</p>
                  </div>
                  <div className="bg-white bg-opacity-25 p-3 rounded-3">
                    <i className="fas fa-user-cog fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
              <div className="card-body text-dark">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-secondary small fw-medium mb-1">Active Stations</p>
                    <h2 className="display-5 fw-bold mb-0">{stats.activeStations || 0}</h2>
                    <p className="small text-secondary mb-0">Total: {stats.totalStations || 0}</p>
                  </div>
                  <div className="bg-white bg-opacity-50 p-3 rounded-3">
                    <i className="fas fa-charging-station fa-2x text-info"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-white-50 small fw-medium mb-1">Total Bookings</p>
                    <h2 className="display-5 fw-bold mb-0">{stats.totalBookings || 0}</h2>
                  </div>
                  <div className="bg-white bg-opacity-25 p-3 rounded-3">
                    <i className="fas fa-calendar fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Status Overview */}
        <div className="row g-3 g-md-4 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm border-start border-warning border-4">
              <div className="card-body text-center py-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                  <i className="fas fa-clock fa-2x text-warning"></i>
                </div>
                <h2 className="display-5 fw-bold text-warning mb-2">{stats.pendingBookings || 0}</h2>
                <p className="fw-semibold text-dark mb-1">Pending Bookings</p>
                <small className="text-muted">Awaiting confirmation</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm border-start border-info border-4">
              <div className="card-body text-center py-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-info bg-opacity-10 rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                  <i className="fas fa-check-circle fa-2x text-info"></i>
                </div>
                <h2 className="display-5 fw-bold text-info mb-2">{stats.approvedBookings || 0}</h2>
                <p className="fw-semibold text-dark mb-1">Approved Bookings</p>
                <small className="text-muted">Ready for charging</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm border-start border-success border-4">
              <div className="card-body text-center py-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                  <i className="fas fa-check-double fa-2x text-success"></i>
                </div>
                <h2 className="display-5 fw-bold text-success mb-2">{stats.completedBookings || 0}</h2>
                <p className="fw-semibold text-dark mb-1">Completed Bookings</p>
                <small className="text-muted">Successfully finished</small>
              </div>
            </div>
          </div>
        </div>

        {/* Management Actions */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="card-title fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="fas fa-tools text-success"></i>
              System Management
            </h5>
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <a 
                  href="/charging-stations" 
                  className="d-flex align-items-center gap-3 p-3 text-decoration-none rounded-3 border-2 border-success bg-success bg-opacity-10 border h-100"
                  style={{ transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="bg-success text-white p-3 rounded-3">
                    <i className="fas fa-plus fa-lg"></i>
                  </div>
                  <div>
                    <p className="fw-semibold text-dark mb-0">Create New Station</p>
                    <small className="text-muted">Add charging points</small>
                  </div>
                </a>
              </div>

              <div className="col-12 col-md-3">
                <a 
                  href="/station-operations" 
                  className="d-flex align-items-center gap-3 p-3 text-decoration-none rounded-3 border-2 border-info bg-info bg-opacity-10 border h-100"
                  style={{ transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="bg-info text-white p-3 rounded-3">
                    <i className="fas fa-user-plus fa-lg"></i>
                  </div>
                  <div>
                    <p className="fw-semibold text-dark mb-0">Manage Operators</p>
                    <small className="text-muted">Station operators</small>
                  </div>
                </a>
              </div>

              <div className="col-12 col-md-3">
                <a 
                  href="/ev-owners" 
                  className="d-flex align-items-center gap-3 p-3 text-decoration-none rounded-3 border-2 border-warning bg-warning bg-opacity-10 border h-100"
                  style={{ transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="bg-warning text-white p-3 rounded-3">
                    <i className="fas fa-users fa-lg"></i>
                  </div>
                  <div>
                    <p className="fw-semibold text-dark mb-0">Manage EV Owners</p>
                    <small className="text-muted">Customer accounts</small>
                  </div>
                </a>
              </div>

              <div className="col-12 col-md-3">
                <a 
                  href="/bookings" 
                  className="d-flex align-items-center gap-3 p-3 text-decoration-none rounded-3 border-2 border-primary bg-primary bg-opacity-10 border h-100"
                  style={{ transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="bg-primary text-white p-3 rounded-3">
                    <i className="fas fa-calendar fa-lg"></i>
                  </div>
                  <div>
                    <p className="fw-semibold text-dark mb-0">All Bookings</p>
                    <small className="text-muted">View reservations</small>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h5 className="card-title fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="fas fa-history text-success"></i>
              Recent System Activities
            </h5>
            {recentActivities.length > 0 ? (
              <div className="row g-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="col-12">
                    <div className="border rounded-3 p-3 bg-light bg-opacity-50" style={{ transition: 'all 0.2s' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className={`d-inline-flex align-items-center justify-content-center rounded-circle ${
                              activity.type === 'station' ? 'bg-success bg-opacity-10' : 'bg-info bg-opacity-10'
                            }`} 
                            style={{ width: '48px', height: '48px' }}
                          >
                            <i className={`fas ${activity.type === 'station' ? 'fa-charging-station text-success' : 'fa-calendar text-info'} fa-lg`}></i>
                          </div>
                          <div>
                            <p className="fw-semibold text-dark mb-1">
                              {activity.item} <span className="fw-normal text-muted">was {activity.action}</span>
                            </p>
                            <small className="text-muted">
                              {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                            </small>
                          </div>
                        </div>
                        <span className={`badge ${activity.type === 'station' ? 'bg-success' : 'bg-info'} px-3 py-2`}>
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-4" style={{ width: '96px', height: '96px' }}>
                  <i className="fas fa-inbox fa-3x text-muted"></i>
                </div>
                <h4 className="fw-bold text-dark mb-3">No Recent Activities</h4>
                <p className="text-muted mb-0" style={{ maxWidth: '500px', margin: '0 auto' }}>
                  No recent system activities found. Activities will appear here as users interact with the system.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackofficeDashboard

