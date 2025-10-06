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

      // Create recent activities summary
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-tachometer-alt me-2 text-primary"></i>
          Backoffice Dashboard
        </h2>
        <div className="d-flex align-items-center">
          <span className="badge bg-primary fs-6 me-2">
            <i className="fas fa-user-tie me-1"></i>
            {user?.username}
          </span>
          <button className="btn btn-outline-primary btn-sm" onClick={loadBackofficeData}>
            <i className="fas fa-sync me-1"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.totalEVOwners || 0}</h4>
                  <p className="card-text">Total EV Owners</p>
                </div>
                <i className="fas fa-users fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.activeOperators || 0}</h4>
                  <p className="card-text">Active Operators</p>
                  <small className="opacity-75">Total: {stats.totalOperators || 0}</small>
                </div>
                <i className="fas fa-user-cog fa-2x opacity-50"></i>
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
                  <small className="opacity-75">Total: {stats.totalStations || 0}</small>
                </div>
                <i className="fas fa-charging-station fa-2x opacity-50"></i>
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
              <i className="fas fa-clock fa-2x text-warning opacity-50"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-info">
            <div className="card-body text-center">
              <h3 className="text-info">{stats.approvedBookings || 0}</h3>
              <p className="card-text">Approved Bookings</p>
              <i className="fas fa-check-circle fa-2x text-info opacity-50"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-success">
            <div className="card-body text-center">
              <h3 className="text-success">{stats.completedBookings || 0}</h3>
              <p className="card-text">Completed Bookings</p>
              <i className="fas fa-check-double fa-2x text-success opacity-50"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Management Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-tools me-2"></i>
                System Management
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 col-sm-6 mb-2">
                  <a href="/charging-stations" className="btn btn-primary w-100">
                    <i className="fas fa-plus me-2"></i>
                    Create New Station
                  </a>
                </div>
                <div className="col-md-3 col-sm-6 mb-2">
                  <a href="/station-operations" className="btn btn-success w-100">
                    <i className="fas fa-user-plus me-2"></i>
                    Manage Operators
                  </a>
                </div>
                <div className="col-md-3 col-sm-6 mb-2">
                  <a href="/ev-owners" className="btn btn-info w-100">
                    <i className="fas fa-users me-2"></i>
                    Manage EV Owners
                  </a>
                </div>
                <div className="col-md-3 col-sm-6 mb-2">
                  <a href="/bookings" className="btn btn-warning w-100">
                    <i className="fas fa-calendar me-2"></i>
                    All Bookings
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-history me-2"></i>
                Recent System Activities
              </h5>
            </div>
            <div className="card-body">
              {recentActivities.length > 0 ? (
                <div className="list-group list-group-flush">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <i className={`fas ${activity.type === 'station' ? 'fa-charging-station' : 'fa-calendar'} me-3 ${activity.type === 'station' ? 'text-primary' : 'text-success'}`}></i>
                        <div>
                          <strong>{activity.item}</strong> was {activity.action}
                          <br />
                          <small className="text-muted">
                            {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                          </small>
                        </div>
                      </div>
                      <span className={`badge ${activity.type === 'station' ? 'bg-primary' : 'bg-success'}`}>
                        {activity.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">No recent activities found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackofficeDashboard