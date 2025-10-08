import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import Swal from 'sweetalert2'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'

const Bookings = () => {
  const { isBackoffice } = useAuth()
  const [bookings, setBookings] = useState([])
  const [evOwners, setEvOwners] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState(null)
  const [formData, setFormData] = useState({
    evOwnerNIC: '',
    chargingStationId: '',
    slotId: '',
    reservationDateTime: '',
    durationMinutes: 60,
    status: 'Pending'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [bookingsData, ownersData, stationsData] = await Promise.all([
        apiService.getBookings(),
        apiService.getEVOwners(),
        apiService.getActiveStations()
      ])
      
      setBookings(bookingsData)
      setEvOwners(ownersData.filter(owner => owner.isActive))
      setStations(stationsData)
    } catch {
      Swal.fire('Error', 'Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Validate reservation date rules
    try {
      const reservationDt = new Date(formData.reservationDateTime)
      const now = new Date()
      const maxAllowed = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

      if (!formData.reservationDateTime || isNaN(reservationDt.getTime())) {
        Swal.fire('Validation Error', 'Reservation date/time is required and must be valid', 'error')
        return
      }

      if (reservationDt < now) {
        Swal.fire('Validation Error', 'Reservation must be in the future', 'error')
        return
      }

      if (reservationDt > maxAllowed) {
        Swal.fire('Validation Error', 'Reservation must be within 7 days from now', 'error')
        return
      }
    } catch {
      Swal.fire('Validation Error', 'Invalid reservation date/time', 'error')
      return
    }
    try {
      if (editingBooking) {
        // Prevent updates within 12 hours of reservation
        const reservationDt = new Date(editingBooking.reservationDateTime)
        const twelveHoursBefore = new Date(reservationDt.getTime() - 12 * 60 * 60 * 1000)
        const now = new Date()

        if (now > twelveHoursBefore) {
          Swal.fire('Too Late', 'Bookings can only be updated at least 12 hours before the reservation', 'warning')
          return
        }

        // Optionally consult server if available
        const canModify = await apiService.canModifyBooking(editingBooking.id).catch(() => ({ canModify: false }))
        if (canModify && canModify.canModify === false) {
          Swal.fire('Cannot Modify', canModify.message || 'Booking cannot be modified', 'warning')
          return
        }
        await apiService.updateBooking(editingBooking.id, formData)
        Swal.fire('Success', 'Booking updated successfully', 'success')
      } else {
        await apiService.createBooking(formData)
        Swal.fire('Success', 'Booking created successfully', 'success')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      Swal.fire('Error', error.response?.data || 'Operation failed', 'error')
    }
  }

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to cancel this booking?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!'
    })

    if (result.isConfirmed) {
      try {
        // Check reservation time to enforce 12 hour rule
        const booking = bookings.find(b => b.id === id)
        if (booking) {
          const reservationDt = new Date(booking.reservationDateTime)
          const twelveHoursBefore = new Date(reservationDt.getTime() - 12 * 60 * 60 * 1000)
          const now = new Date()
          if (now > twelveHoursBefore) {
            Swal.fire('Too Late', 'Bookings can only be cancelled at least 12 hours before the reservation', 'warning')
            return
          }
        }

        // Optionally ask server whether cancellation is allowed
        const canModify = await apiService.canModifyBooking(id).catch(() => ({ canModify: true }))
        if (canModify && canModify.canModify === false) {
          Swal.fire('Cannot Cancel', canModify.message || 'Booking cannot be cancelled', 'warning')
          return
        }

        await apiService.cancelBooking(id)
        Swal.fire('Cancelled!', 'Booking has been cancelled.', 'success')
        loadData()
      } catch (error) {
        Swal.fire('Error', error.response?.data || 'Cancellation failed', 'error')
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: 'bg-warning',
      Approved: 'bg-success',
      Completed: 'bg-info',
      Cancelled: 'bg-danger'
    }
    return statusConfig[status] || 'bg-secondary'
  }

  const resetForm = () => {
    setFormData({
      evOwnerNIC: '',
      chargingStationId: '',
      slotId: '',
      reservationDateTime: '',
      durationMinutes: 60,
      status: 'Pending'
    })
    setEditingBooking(null)
  }

  if (loading) return <LoadingSpinner text="Loading bookings..." />

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-calendar-alt me-2 text-primary"></i>
          {isBackoffice ? 'Bookings Management' : 'Booking Operations'}
        </h2>
        {isBackoffice && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>
            New Booking
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>EV Owner</th>
                  <th>Station</th>
                  <th>Reservation Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      <small className="text-muted">{booking.bookingReference}</small>
                    </td>
                    <td>{booking.evOwnerNIC}</td>
                    <td>
                      {stations.find(s => s.id === booking.chargingStationId)?.name || 'N/A'}
                    </td>
                    <td>
                      {new Date(booking.reservationDateTime).toLocaleString()}
                    </td>
                    <td>{booking.durationMinutes} min</td>
                    <td>
                      <span className={`badge ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        {booking.status === 'Pending' && (
                          <>
                            <button className="btn btn-outline-success">
                              <i className="fas fa-check"></i>
                            </button>
                            <button 
                              className="btn btn-outline-danger"
                              onClick={() => handleCancel(booking.id)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                        {booking.status === 'Approved' && (
                          <button className="btn btn-outline-info">
                            <i className="fas fa-qrcode"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        show={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingBooking ? 'Edit Booking' : 'Create New Booking'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">EV Owner *</label>
                <select
                  className="form-select"
                  value={formData.evOwnerNIC}
                  onChange={(e) => setFormData({ ...formData, evOwnerNIC: e.target.value })}
                  required
                >
                  <option value="">Select EV Owner</option>
                  {evOwners.map(owner => (
                    <option key={owner.nic} value={owner.nic}>
                      {owner.firstName} {owner.lastName} ({owner.nic})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Charging Station *</label>
                <select
                  className="form-select"
                  value={formData.chargingStationId}
                  onChange={(e) => setFormData({ ...formData, chargingStationId: e.target.value })}
                  required
                >
                  <option value="">Select Station</option>
                  {stations.map(station => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.stationType})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Reservation Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.reservationDateTime}
                  onChange={(e) => setFormData({ ...formData, reservationDateTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Duration (minutes) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                  min="30"
                  max="240"
                  step="30"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Slot ID</label>
            <input
              type="text"
              className="form-control"
              value={formData.slotId}
              onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
              placeholder="Optional - will be auto-generated if empty"
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingBooking ? 'Update' : 'Create'} Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Bookings