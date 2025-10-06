import axios from 'axios'

const API_BASE_URL = 'https://evwebserverapi.onrender.com/api'

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken')
        const userData = localStorage.getItem('userData')
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        if (userData) {
          const user = JSON.parse(userData)
          config.headers['User-Role'] = user.role
          config.headers['User-Id'] = user.id
        }
        
        return config
      },
      (error) => Promise.reject(error)
    )

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken')
          localStorage.removeItem('userData')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Authentication API
  async login(username, password) {
    const response = await this.api.post('/auth/login', { username, password })
    return response.data
  }



  // EV Owners API
  async getEVOwners() {
    const response = await this.api.get('/evowners')
    return response.data
  }

  async getEVOwnerByNIC(nic) {
    const response = await this.api.get(`/evowners/${nic}`)
    return response.data
  }

  async createEVOwner(evOwner) {
    const response = await this.api.post('/evowners', evOwner)
    return response.data
  }

  async updateEVOwner(nic, evOwner) {
    const response = await this.api.put(`/evowners/${nic}`, evOwner)
    return response.data
  }

  async deleteEVOwner(nic) {
    const response = await this.api.delete(`/evowners/${nic}`)
    return response.data
  }

  async updateEVOwnerStatus(nic, isActive) {
    const response = await this.api.patch(`/evowners/${nic}/status`, { isActive })
    return response.data
  }

  // Bookings API
  async getBookings() {
    const response = await this.api.get('/bookings')
    return response.data
  }

  async getBookingById(id) {
    const response = await this.api.get(`/bookings/${id}`)
    return response.data
  }

  async getUpcomingBookings(nic) {
    const response = await this.api.get(`/bookings/upcoming/${nic}`)
    return response.data
  }

  async createBooking(booking) {
    const response = await this.api.post('/bookings', booking)
    return response.data
  }

  async updateBooking(id, booking) {
    const response = await this.api.put(`/bookings/${id}`, booking)
    return response.data
  }

  async cancelBooking(id) {
    const response = await this.api.delete(`/bookings/${id}`)
    return response.data
  }

  async canModifyBooking(id) {
    const response = await this.api.get(`/bookings/${id}/can-modify`)
    return response.data
  }

  async validateQRCode(qrData) {
    const response = await this.api.post('/bookings/validate-qr', { QRData: qrData })
    return response.data
  }

  async completeBooking(id, qrData) {
    const response = await this.api.post(`/bookings/${id}/complete`, qrData)
    return response.data
  }

  // Charging Stations API
  async getChargingStations() {
    const response = await this.api.get('/chargingstations')
    return response.data
  }

  async getChargingStationById(id) {
    const response = await this.api.get(`/chargingstations/${id}`)
    return response.data
  }

  async getActiveStations() {
    const response = await this.api.get('/chargingstations/active')
    return response.data
  }

  async getStationsByType(stationType) {
    const response = await this.api.get(`/chargingstations/type/${stationType}`)
    return response.data
  }

  async createChargingStation(station) {
    const response = await this.api.post('/chargingstations', station)
    return response.data
  }

  async updateChargingStation(id, station) {
    const response = await this.api.put(`/chargingstations/${id}`, station)
    return response.data
  }

  async deactivateStation(id) {
    const response = await this.api.patch(`/chargingstations/${id}/deactivate`)
    return response.data
  }

  async deleteStation(id) {
    const response = await this.api.delete(`/chargingstations/${id}`)
    return response.data
  }

  // Users API
  async getUsers() {
    const response = await this.api.get('/users')
    return response.data
  }

  async getUserById(id) {
    const response = await this.api.get(`/users/${id}`)
    return response.data
  }

  async createUser(userData) {
    const response = await this.api.post('/users', userData)
    return response.data
  }

  async updateUser(id, user) {
    const response = await this.api.put(`/users/${id}`, user)
    return response.data
  }

  async deleteUser(id) {
    const response = await this.api.delete(`/users/${id}`)
    return response.data
  }

  async authenticateUser(credentials) {
    const response = await this.api.post('/users/authenticate', credentials)
    return response.data
  }

  async changePassword(userId, passwordData) {
    const response = await this.api.post(`/users/${userId}/change-password`, passwordData)
    return response.data
  }

  // ============ ROLE-BASED API METHODS ============
  
  // Backoffice methods
  async createStationWithOperator(stationData) {
    const response = await this.api.post('/chargingstations/with-operator', stationData)
    return response.data
  }

  async updateOperatorCredentials(stationId, credentialsData) {
    const response = await this.api.put(`/chargingstations/${stationId}/operator-credentials`, credentialsData)
    return response.data
  }

  async getAllOperators() {
    const response = await this.api.get('/chargingstations/operators')
    return response.data
  }

  async assignOperatorToStation(stationId, operatorId) {
    const response = await this.api.post(`/chargingstations/${stationId}/assign-operator/${operatorId}`)
    return response.data
  }

  async deactivateOperator(operatorId) {
    const response = await this.api.patch(`/chargingstations/operators/${operatorId}/deactivate`)
    return response.data
  }

  async createBackofficeUser(userData) {
    const response = await this.api.post('/auth/create-backoffice', userData)
    return response.data
  }

  // Station Operator methods
  async getMyStations() {
    const response = await this.api.get('/chargingstations/my-stations')
    return response.data
  }

  async updateMyStation(stationId, updateData) {
    const response = await this.api.put(`/chargingstations/${stationId}/operator-update`, updateData)
    return response.data
  }
}

export default new ApiService()