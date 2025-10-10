import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const OperatorDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [myStations, setMyStations] = useState([])
  const [, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOperatorData()
  }, [])

  
  const loadOperatorData = async () => {
    try {
      const [stations, allBookings] = await Promise.all([
        apiService.getMyStations(),
        apiService.getBookings()
      ])
      
      setMyStations(stations)
      
      // Filter bookings for operator's stations
      const stationIds = stations.map(s => s.id)
      const filteredBookings = allBookings.filter(b => stationIds.includes(b.chargingStationId))
      setMyBookings(filteredBookings)
      
      const pendingBookings = filteredBookings.filter(b => b.status === 'Pending')
      const approvedBookings = filteredBookings.filter(b => b.status === 'Approved')
      const completedBookings = filteredBookings.filter(b => b.status === 'Completed')
      const activeStations = stations.filter(s => s.isActive)

      setStats({
        myStations: stations.length,
        activeStations: activeStations.length,
        inactiveStations: stations.length - activeStations.length,
        totalBookings: filteredBookings.length,
        pendingBookings: pendingBookings.length,
        approvedBookings: approvedBookings.length,
        completedBookings: completedBookings.length,
        totalSlots: stations.reduce((sum, station) => sum + (station.totalSlots || 0), 0),
        availableSlots: stations.reduce((sum, station) => 
          sum + (station.availableSlots?.filter(slot => slot.isAvailable).length || 0), 0
        )
      })

    } catch (error) {
      console.error('Error loading operator data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStationToggle = async (stationId, currentStatus) => {
    try {
      await apiService.updateMyStation(stationId, { isActive: !currentStatus })
      await loadOperatorData() // Refresh data
    } catch (error) {
      console.error('Error updating station status:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading operator dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 p-md-6">
      <div className="container-fluid" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h1 className="h2 fw-bold text-dark d-flex align-items-center gap-3 mb-2">
              <span className="bg-success text-white p-3 rounded-3 shadow">
                <i className="fas fa-user-cog"></i>
              </span>
              Station Operator Dashboard
            </h1>
            <p className="text-muted mb-0 ms-1">Manage your charging stations and bookings</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="bg-white px-3 py-2 rounded-3 shadow-sm border d-flex align-items-center gap-2">
              <div className="bg-success bg-opacity-10 rounded-circle p-2" style={{ width: '32px', height: '32px' }}>
                <i className="fas fa-user text-success small"></i>
              </div>
              <span className="fw-medium text-dark">{user?.username}</span>
            </div>
            <button 
              onClick={loadOperatorData}
              className="btn btn-white border shadow-sm d-flex align-items-center gap-2"
            >
              <i className="fas fa-sync small"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="row g-3 g-md-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-white-50 small fw-medium mb-1">My Stations</p>
                    <h2 className="display-5 fw-bold mb-0">{stats.myStations || 0}</h2>
                  </div>
                  <div className="bg-white bg-opacity-25 p-3 rounded-3">
                    <i className="fas fa-charging-station fa-2x"></i>
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
                    <p className="text-white-50 small fw-medium mb-1">Active Stations</p>
                    <h2 className="display-5 fw-bold mb-0">{stats.activeStations || 0}</h2>
                  </div>
                  <div className="bg-white bg-opacity-25 p-3 rounded-3">
                    <i className="fas fa-check-circle fa-2x"></i>
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
                    <p className="text-secondary small fw-medium mb-1">Total Sockets</p>
                    <h2 className="display-5 fw-bold mb-0">{stats.totalSlots || 0}</h2>
                    <p className="small text-secondary mb-0">Available: {stats.availableSlots || 0}</p>
                  </div>
                  <div className="bg-white bg-opacity-50 p-3 rounded-3">
                    <i className="fas fa-plug fa-2x text-info"></i>
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
                  <i className="fas fa-check fa-2x text-success"></i>
                </div>
                <h2 className="display-5 fw-bold text-success mb-2">{stats.completedBookings || 0}</h2>
                <p className="fw-semibold text-dark mb-1">Completed Bookings</p>
                <small className="text-muted">Successfully finished</small>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="card-title fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="fas fa-bolt text-success"></i>
              Quick Actions
            </h5>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <a 
                  href="/bookings" 
                  className="d-flex align-items-center gap-3 p-3 text-decoration-none rounded-3 border-2 border-warning bg-warning bg-opacity-10 border h-100"
                  style={{ transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="bg-warning text-white p-3 rounded-3">
                    <i className="fas fa-calendar-check fa-lg"></i>
                  </div>
                  <div>
                    <p className="fw-semibold text-dark mb-0">Manage Bookings</p>
                    <small className="text-muted">Review and approve</small>
                  </div>
                </a>
              </div>

              <div className="col-12 col-md-4">
                <button 
                  onClick={loadOperatorData}
                  className="d-flex align-items-center gap-3 p-3 w-100 border-0 rounded-3 border-2 border-info bg-info bg-opacity-10 h-100"
                  style={{ transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="bg-info text-white p-3 rounded-3">
                    <i className="fas fa-sync fa-lg"></i>
                  </div>
                  <div className="text-start">
                    <p className="fw-semibold text-dark mb-0">Refresh Data</p>
                    <small className="text-muted">Update information</small>
                  </div>
                </button>
              </div>

              <div className="col-12 col-md-4">
                <a 
                  href="/charging-stations" 
                  className="d-flex align-items-center gap-3 p-3 text-decoration-none rounded-3 border-2 border-success bg-success bg-opacity-10 border h-100"
                  style={{ transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="bg-success text-white p-3 rounded-3">
                    <i className="fas fa-charging-station fa-lg"></i>
                  </div>
                  <div>
                    <p className="fw-semibold text-dark mb-0">View My Stations</p>
                    <small className="text-muted">See all locations</small>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* My Stations Management */}
        {myStations.length > 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4 d-flex align-items-center gap-2">
                <i className="fas fa-charging-station text-success"></i>
                My Assigned Stations
              </h5>
              <div className="row g-3 g-md-4">
                {myStations.map((station) => (
                  <div key={station.id} className="col-12 col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm h-100 overflow-hidden" style={{ transition: 'all 0.3s' }}>
                      <div className="card-header bg-gradient text-white p-3" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold">{station.name}</h6>
                          <div className="form-check form-switch mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`station-${station.id}`}
                              checked={station.isActive}
                              onChange={() => handleStationToggle(station.id, station.isActive)}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label" htmlFor={`station-${station.id}`}>
                              <span className={`badge ${station.isActive ? 'bg-white text-success' : 'bg-danger'} ms-2`}>
                                {station.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="card-body p-3">
                        <div className="mb-3">
                          <div className="d-flex align-items-start gap-2 mb-2">
                            <i className="fas fa-map-marker-alt text-danger mt-1"></i>
                            <div>
                              <small className="text-muted d-block">Location</small>
                              <small className="text-dark fw-medium">{station.location?.address}, {station.location?.city}</small>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="fas fa-bolt text-primary"></i>
                            <div>
                              <small className="text-muted d-block">Type</small>
                              <small className="text-dark fw-semibold">{station.stationType}</small>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-plug text-info"></i>
                            <div>
                              <small className="text-muted d-block">Slots</small>
                              <small className="text-dark">
                                <span className="fw-bold">{station.totalSlots}</span> total
                                {station.availableSlots && (
                                  <span className="text-success fw-semibold ms-1">
                                    • {station.availableSlots.filter(s => s.isAvailable).length} available
                                  </span>
                                )}
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex gap-2 mt-3">
                          <a 
                            href={`/charging-stations/${station.id}`} 
                            className="btn btn-success btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                          >
                            <i className="fas fa-edit small"></i>
                            Manage
                          </a>
                          <button className="btn btn-info btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                            <i className="fas fa-eye small"></i>
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-4" style={{ width: '96px', height: '96px' }}>
                <i className="fas fa-charging-station fa-3x text-muted"></i>
              </div>
              <h4 className="fw-bold text-dark mb-3">No Stations Assigned</h4>
              <p className="text-muted mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
                You don't have any charging stations assigned yet. 
                Please contact your backoffice team to get stations assigned.
              </p>
              <button className="btn btn-success px-4 py-2">
                <i className="fas fa-headset me-2"></i>
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OperatorDashboard