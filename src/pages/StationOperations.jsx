import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import Swal from 'sweetalert2'
import LoadingSpinner from '../components/LoadingSpinner'

const StationOperations = () => {
  const { user, isStationOperator } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState([])
  const [bookings, setBookings] = useState([])
  const [qrScanning, setQrScanning] = useState(false)
  const [qrInput, setQrInput] = useState('')

  useEffect(() => {
    if (isStationOperator) {
      loadStationData()
    }
  }, [isStationOperator])

  const loadStationData = async () => {
    try {
      setLoading(true)
      const [stationsData, bookingsData] = await Promise.all([
        apiService.getChargingStations(),
        apiService.getBookings()
      ])
      
      setStations(stationsData.filter(station => station.isActive))
      setBookings(bookingsData.filter(booking => 
        booking.status === 'Approved' || booking.status === 'Pending'
      ))
    } catch {
      Swal.fire('Error', 'Failed to load station data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleQRVerification = async () => {
    if (!qrInput.trim()) {
      Swal.fire('Error', 'Please enter QR code data', 'error')
      return
    }

    try {
      setQrScanning(true)
      const response = await apiService.validateQRCode(qrInput)
      
      if (response.isValid) {
        await Swal.fire({
          title: 'QR Code Valid!',
          html: `
            <div class="text-start">
              <p><strong>Booking Reference:</strong> ${response.bookingReference}</p>
              <p><strong>EV Owner NIC:</strong> ${response.evOwnerNIC}</p>
              <p><strong>Reservation Time:</strong> ${new Date(response.reservationDateTime).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${response.durationMinutes} minutes</p>
              <p><strong>Status:</strong> <span class="badge bg-success">${response.status}</span></p>
            </div>
          `,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Complete Booking',
          cancelButtonText: 'Close'
        }).then(async (result) => {
          if (result.isConfirmed) {
            await completeBooking(response.bookingId, qrInput)
          }
        })
      } else {
        Swal.fire('Invalid QR Code', response.errorMessage || 'QR code is not valid', 'error')
      }
    } catch {
      Swal.fire('Error', 'Failed to verify QR code', 'error')
    } finally {
      setQrScanning(false)
      setQrInput('')
    }
  }

  const completeBooking = async (bookingId, qrData) => {
    try {
      await apiService.completeBooking(bookingId, { qrData })
      Swal.fire('Success', 'Booking completed successfully!', 'success')
      await loadStationData() // Refresh data
    } catch {
      Swal.fire('Error', 'Failed to complete booking', 'error')
    }
  }

  const approveBooking = async (bookingId) => {
    try {
      const result = await Swal.fire({
        title: 'Approve Booking?',
        text: 'This will approve the booking and allow QR code generation.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel'
      })

      if (result.isConfirmed) {
        const booking = bookings.find(b => b.id === bookingId)
        const updatedBooking = { ...booking, status: 'Approved' }
        
        await apiService.updateBooking(bookingId, updatedBooking)
        Swal.fire('Success', 'Booking approved successfully!', 'success')
        await loadStationData()
      }
    } catch {
      Swal.fire('Error', 'Failed to approve booking', 'error')
    }
  }

  if (!isStationOperator) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="fas fa-ban me-2"></i>
          Access denied. This page is only available for Station Operators.
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />

  const todaysBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.reservationDateTime)
    const today = new Date()
    return bookingDate.toDateString() === today.toDateString()
  })

  const upcomingBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.reservationDateTime)
    const today = new Date()
    return bookingDate > today
  })

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col">
          <h2>
            <i className="fas fa-tools me-2"></i>
            Station Operations Dashboard
          </h2>
          <p className="text-muted">
            Welcome, {user?.username}! Manage daily charging station operations.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title mb-0">Active Stations</h6>
                  <h3 className="mb-0">{stations.length}</h3>
                </div>
                <i className="fas fa-charging-station fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title mb-0">Today's Bookings</h6>
                  <h3 className="mb-0">{todaysBookings.length}</h3>
                </div>
                <i className="fas fa-calendar-day fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title mb-0">Pending Approvals</h6>
                  <h3 className="mb-0">{bookings.filter(b => b.status === 'Pending').length}</h3>
                </div>
                <i className="fas fa-clock fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title mb-0">Upcoming</h6>
                  <h3 className="mb-0">{upcomingBookings.length}</h3>
                </div>
                <i className="fas fa-arrow-up fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Scanner */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-qrcode me-2"></i>
                QR Code Verification
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Enter or Scan QR Code:</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Paste QR code data here or use mobile app to scan..."
                ></textarea>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleQRVerification}
                disabled={qrScanning || !qrInput.trim()}
              >
                {qrScanning ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle me-2"></i>
                    Verify QR Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={loadStationData}
                >
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh Data
                </button>
                <button
                  className="btn btn-outline-success"
                  onClick={() => window.open('/mobile-instructions', '_blank')}
                >
                  <i className="fas fa-mobile-alt me-2"></i>
                  Mobile App Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Bookings */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-calendar-check me-2"></i>
                Today's Bookings
              </h5>
            </div>
            <div className="card-body">
              {todaysBookings.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No bookings for today</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Booking Ref</th>
                        <th>EV Owner</th>
                        <th>Station</th>
                        <th>Time</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaysBookings.map(booking => {
                        const station = stations.find(s => s.id === booking.chargingStationId)
                        return (
                          <tr key={booking.id}>
                            <td className="fw-bold">{booking.bookingReference}</td>
                            <td>{booking.evOwnerNIC}</td>
                            <td>{station?.name || 'Unknown'}</td>
                            <td>{new Date(booking.reservationDateTime).toLocaleTimeString()}</td>
                            <td>{booking.durationMinutes}min</td>
                            <td>
                              <span className={`badge ${
                                booking.status === 'Approved' ? 'bg-success' :
                                booking.status === 'Pending' ? 'bg-warning' :
                                booking.status === 'Completed' ? 'bg-primary' :
                                'bg-secondary'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td>
                              {booking.status === 'Pending' && (
                                <button
                                  className="btn btn-sm btn-success me-1"
                                  onClick={() => approveBooking(booking.id)}
                                >
                                  <i className="fas fa-check"></i> Approve
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StationOperations