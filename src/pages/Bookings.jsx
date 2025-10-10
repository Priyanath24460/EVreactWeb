import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/api'
import Swal from 'sweetalert2'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'

const Bookings = () => {
  const { isBackoffice, isStationOperator } = useAuth()
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

  const loadData = useCallback(async () => {
    try {
      // Station operators should only see bookings for their assigned stations
      const stationsPromise = isStationOperator ? apiService.getMyStations() : apiService.getActiveStations()

      const [bookingsData, ownersData, stationsData] = await Promise.all([
        apiService.getBookings(),
        apiService.getEVOwners(),
        stationsPromise
      ])

      // If operator, filter bookings to only those belonging to assigned stations
      if (isStationOperator) {
        const stationIds = stationsData.map(s => s.id)
        const filteredBookings = bookingsData.filter(b => stationIds.includes(b.chargingStationId))
        setBookings(filteredBookings)
      } else {
        setBookings(bookingsData)
      }

      setEvOwners(ownersData.filter(owner => owner.isActive))
      setStations(stationsData)
    } catch (err) {
      console.error('Failed to load bookings data', err)
      Swal.fire('Error', 'Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }, [isStationOperator])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const handleConfirm = async (id) => {
    const booking = bookings.find(b => b.id === id)
    if (!booking) return

    const result = await Swal.fire({
      title: 'Confirm booking?',
      text: 'Mark this booking as Approved?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, confirm',
    })

    if (!result.isConfirmed) return

    try {
      // update status to Approved; backend may support a specific endpoint instead
      await apiService.updateBooking(id, { ...booking, status: 'Approved' })
      Swal.fire('Confirmed', 'Booking marked as Approved', 'success')
      loadData()
    } catch (err) {
      console.error(err)
      Swal.fire('Error', err.response?.data || 'Could not confirm booking', 'error')
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
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="h2 fw-bold text-dark d-flex align-items-center gap-3 mb-2">
              <span className="bg-primary bg-opacity-10 text-primary p-3 rounded-3">
                <i className="fas fa-calendar-alt"></i>
              </span>
              {isBackoffice ? 'Bookings Management' : 'Booking Operations'}
            </h2>
            <p className="text-muted mb-0 ms-1">Manage and monitor all booking reservations</p>
          </div>
          {isBackoffice && (
            <button 
              className="btn btn-primary btn-lg shadow-sm d-flex align-items-center gap-2"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus-circle"></i>
              <span>New Booking</span>
            </button>
          )}
        </div>

        {/* Bookings Table Card */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-dark">Reference</th>
                    <th className="px-4 py-3 fw-semibold text-dark">EV Owner</th>
                    <th className="px-4 py-3 fw-semibold text-dark">Station</th>
                    <th className="px-4 py-3 fw-semibold text-dark">Reservation Date</th>
                    <th className="px-4 py-3 fw-semibold text-dark">Duration</th>
                    <th className="px-4 py-3 fw-semibold text-dark">Status</th>
                    {!isBackoffice && <th className="px-4 py-3 fw-semibold text-dark">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={!isBackoffice ? 7 : 6} className="text-center py-5">
                        <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                          <i className="fas fa-calendar-times fa-2x text-muted"></i>
                        </div>
                        <h5 className="text-muted mb-2">No Bookings Found</h5>
                        <p className="text-muted mb-0">There are no bookings to display.</p>
                      </td>
                    </tr>
                  ) : (
                    bookings.map(booking => (
                      <tr key={booking.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td className="px-4 py-3">
                          <code className="text-primary small bg-primary bg-opacity-10 px-2 py-1 rounded">
                            {booking.bookingReference}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-user text-success"></i>
                            <span className="fw-medium">{booking.evOwnerNIC}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-charging-station text-info"></i>
                            <span>{stations.find(s => s.id === booking.chargingStationId)?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="fas fa-clock text-warning"></i>
                            <span>{new Date(booking.reservationDateTime).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-secondary bg-opacity-10 text-dark px-3 py-2">
                            <i className="fas fa-hourglass-half me-1"></i>
                            {booking.durationMinutes} min
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getStatusBadge(booking.status)} px-3 py-2`}>
                            {booking.status === 'Pending' && <i className="fas fa-clock me-1"></i>}
                            {booking.status === 'Approved' && <i className="fas fa-check-circle me-1"></i>}
                            {booking.status === 'Completed' && <i className="fas fa-flag-checkered me-1"></i>}
                            {booking.status === 'Cancelled' && <i className="fas fa-ban me-1"></i>}
                            {booking.status}
                          </span>
                        </td>
                        {!isBackoffice && (
                          <td className="px-4 py-3">
                            <div className="d-flex gap-2">
                              {booking.status === 'Pending' && (
                                <>
                                  <button
                                    className="btn btn-success btn-sm d-flex align-items-center gap-1"
                                    onClick={() => handleConfirm(booking.id)}
                                    title="Approve Booking"
                                  >
                                    <i className="fas fa-check"></i>
                                    <span className="d-none d-lg-inline">Approve</span>
                                  </button>
                                  <button 
                                    className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                                    onClick={() => handleCancel(booking.id)}
                                    title="Cancel Booking"
                                  >
                                    <i className="fas fa-times"></i>
                                    <span className="d-none d-lg-inline">Cancel</span>
                                  </button>
                                </>
                              )}
                              {booking.status === 'Approved' && (
                                <button 
                                  className="btn btn-info btn-sm d-flex align-items-center gap-1"
                                  title="View QR Code"
                                >
                                  <i className="fas fa-qrcode"></i>
                                  <span className="d-none d-lg-inline">QR Code</span>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Table Footer with Stats */}
          {bookings.length > 0 && (
            <div className="card-footer bg-light border-0 py-3">
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="fw-bold text-dark h4 mb-1">{bookings.length}</div>
                    <small className="text-muted">Total Bookings</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="fw-bold text-warning h4 mb-1">
                      {bookings.filter(b => b.status === 'Pending').length}
                    </div>
                    <small className="text-muted">Pending</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="fw-bold text-success h4 mb-1">
                      {bookings.filter(b => b.status === 'Approved').length}
                    </div>
                    <small className="text-muted">Approved</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="fw-bold text-info h4 mb-1">
                      {bookings.filter(b => b.status === 'Completed').length}
                    </div>
                    <small className="text-muted">Completed</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Booking Modal */}
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
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium">
                <i className="fas fa-user text-success me-2"></i>
                EV Owner *
              </label>
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
            <div className="col-md-6">
              <label className="form-label fw-medium">
                <i className="fas fa-charging-station text-primary me-2"></i>
                Charging Station *
              </label>
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

            <div className="col-md-6">
              <label className="form-label fw-medium">
                <i className="fas fa-calendar text-warning me-2"></i>
                Reservation Date & Time *
              </label>
              <input
                type="datetime-local"
                className="form-control"
                value={formData.reservationDateTime}
                onChange={(e) => setFormData({ ...formData, reservationDateTime: e.target.value })}
                required
              />
              <small className="form-text text-muted">Must be within 7 days from now</small>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">
                <i className="fas fa-hourglass-half text-info me-2"></i>
                Duration (minutes) *
              </label>
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
              <small className="form-text text-muted">Between 30 and 240 minutes</small>
            </div>

            <div className="col-12">
              <label className="form-label fw-medium">
                <i className="fas fa-tag text-secondary me-2"></i>
                Slot ID
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.slotId}
                onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
                placeholder="Optional - will be auto-generated if empty"
              />
            </div>
          </div>

          <div className="alert alert-info d-flex align-items-start gap-2 mt-4">
            <i className="fas fa-info-circle mt-1"></i>
            <div>
              <strong>Note:</strong> Bookings can only be modified or cancelled at least 12 hours before the reservation time.
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4">
              <i className="fas fa-save me-2"></i>
              {editingBooking ? 'Update' : 'Create'} Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Bookings