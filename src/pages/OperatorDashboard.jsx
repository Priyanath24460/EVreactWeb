import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const OperatorDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [myStations, setMyStations] = useState([])
  const [myBookings, setMyBookings] = useState([])
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-user-cog me-2 text-success"></i>
          Station Operator Dashboard
        </h2>
        <div className="d-flex align-items-center">
          <span className="badge bg-success fs-6 me-2">
            <i className="fas fa-user me-1"></i>
            {user?.username}
          </span>
          <button className="btn btn-outline-success btn-sm" onClick={loadOperatorData}>
            <i className="fas fa-sync me-1"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Operator Stats */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.myStations || 0}</h4>
                  <p className="card-text">My Stations</p>
                </div>
                <i className="fas fa-charging-station fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.activeStations || 0}</h4>
                  <p className="card-text">Active Stations</p>
                </div>
                <i className="fas fa-power-off fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.totalSlots || 0}</h4>
                  <p className="card-text">Total Slots</p>
                  <small className="opacity-75">Available: {stats.availableSlots || 0}</small>
                </div>
                <i className="fas fa-plug fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.totalBookings || 0}</h4>
                  <p className="card-text">Total Bookings</p>
                </div>
                <i className="fas fa-calendar fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Overview */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border-warning">
            <div className="card-body text-center">
              <h3 className="text-warning">{stats.pendingBookings || 0}</h3>
              <p className="card-text">Pending Bookings</p>
              <small className="text-muted">Awaiting confirmation</small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-info">
            <div className="card-body text-center">
              <h3 className="text-info">{stats.approvedBookings || 0}</h3>
              <p className="card-text">Approved Bookings</p>
              <small className="text-muted">Ready for charging</small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-success">
            <div className="card-body text-center">
              <h3 className="text-success">{stats.completedBookings || 0}</h3>
              <p className="card-text">Completed Bookings</p>
              <small className="text-muted">Successfully finished</small>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 col-sm-6 mb-2">
                  <a href="/bookings" className="btn btn-warning w-100">
                    <i className="fas fa-calendar-check me-2"></i>
                    Manage Bookings
                  </a>
                </div>
                <div className="col-md-3 col-sm-6 mb-2">
                  <button className="btn btn-info w-100" onClick={loadOperatorData}>
                    <i className="fas fa-sync me-2"></i>
                    Refresh Data
                  </button>
                </div>
                <div className="col-md-3 col-sm-6 mb-2">
                  <a href="/charging-stations" className="btn btn-primary w-100">
                    <i className="fas fa-charging-station me-2"></i>
                    View My Stations
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Stations Management */}
      {myStations.length > 0 ? (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-charging-station me-2"></i>
                  My Assigned Stations
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {myStations.map((station) => (
                    <div key={station.id} className="col-md-6 col-lg-4 mb-3">
                      <div className="card border">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">{station.name}</h6>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={station.isActive}
                              onChange={() => handleStationToggle(station.id, station.isActive)}
                            />
                            <label className="form-check-label">
                              <span className={`badge ${station.isActive ? 'bg-success' : 'bg-danger'}`}>
                                {station.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="card-body">
                          <p className="card-text small mb-2">
                            <i className="fas fa-map-marker-alt me-1 text-danger"></i>
                            <strong>Location:</strong> {station.location?.address}, {station.location?.city}
                          </p>
                          <p className="card-text small mb-2">
                            <i className="fas fa-plug me-1 text-primary"></i>
                            <strong>Type:</strong> {station.stationType}
                          </p>
                          <p className="card-text small mb-3">
                            <i className="fas fa-list me-1 text-info"></i>
                            <strong>Slots:</strong> {station.totalSlots} total
                            {station.availableSlots && (
                              <span className="text-success">
                                , {station.availableSlots.filter(s => s.isAvailable).length} available
                              </span>
                            )}
                          </p>
                          
                          <div className="btn-group w-100" role="group">
                            <a 
                              href={`/charging-stations/${station.id}`} 
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="fas fa-edit me-1"></i>
                              Manage
                            </a>
                            <button className="btn btn-sm btn-outline-info">
                              <i className="fas fa-eye me-1"></i>
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
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-charging-station fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No Stations Assigned</h5>
                <p className="text-muted">
                  You don't have any charging stations assigned yet. 
                  Please contact your backoffice team to get stations assigned.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OperatorDashboard