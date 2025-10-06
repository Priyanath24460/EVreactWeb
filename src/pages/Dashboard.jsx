import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Dashboard = () => {
  const { user, isBackoffice } = useAuth()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [evOwners, stations, bookings] = await Promise.all([
        isBackoffice ? apiService.getEVOwners() : Promise.resolve([]),
        apiService.getActiveStations(),
        apiService.getBookings()
      ])

      const pendingBookings = bookings.filter(b => b.status === 'Pending')
      const approvedBookings = bookings.filter(b => b.status === 'Approved')

      setStats({
        totalEVOwners: evOwners.length,
        totalStations: stations.length,
        totalBookings: bookings.length,
        pendingBookings: pendingBookings.length,
        approvedBookings: approvedBookings.length
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="fas fa-tachometer-alt me-2 text-primary"></i>
          Dashboard
        </h2>
        <span className="badge bg-primary fs-6">
          Welcome, {user?.username} ({user?.role})
        </span>
      </div>

      <div className="row mb-4">
        {isBackoffice && (
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h4 className="card-title">{stats.totalEVOwners || 0}</h4>
                    <p className="card-text">EV Owners</p>
                  </div>
                  <i className="fas fa-users fa-2x opacity-50"></i>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.totalStations || 0}</h4>
                  <p className="card-text">Active Stations</p>
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
                  <h4 className="card-title">{stats.pendingBookings || 0}</h4>
                  <p className="card-text">Pending Bookings</p>
                </div>
                <i className="fas fa-clock fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.approvedBookings || 0}</h4>
                  <p className="card-text">Approved Bookings</p>
                </div>
                <i className="fas fa-check-circle fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 col-sm-6 mb-2">
                  <a href="/charging-stations" className="btn btn-outline-primary w-100">
                    <i className="fas fa-plus me-2"></i>
                    Add Station
                  </a>
                </div>
                <div className="col-md-3 col-sm-6 mb-2">
                  <a href="/bookings" className="btn btn-outline-success w-100">
                    <i className="fas fa-calendar-plus me-2"></i>
                    New Booking
                  </a>
                </div>
                {isBackoffice && (
                  <>
                    <div className="col-md-3 col-sm-6 mb-2">
                      <a href="/ev-owners" className="btn btn-outline-info w-100">
                        <i className="fas fa-user-plus me-2"></i>
                        Add EV Owner
                      </a>
                    </div>
                    <div className="col-md-3 col-sm-6 mb-2">
                      <a href="/users" className="btn btn-outline-secondary w-100">
                        <i className="fas fa-user-cog me-2"></i>
                        Manage Users
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard