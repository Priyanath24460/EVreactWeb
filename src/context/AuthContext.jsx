import React, { createContext, useState, useContext, useEffect } from 'react'
import apiService from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      // Use actual API authentication
      const response = await apiService.login(username, password)
      
      if (response.success) {
        setUser(response.user)
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('userData', JSON.stringify(response.user))
        return { success: true }
      } else {
        return { success: false, error: 'Invalid credentials' }
      }
    } catch {
      return { success: false, error: 'Login failed' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isBackoffice: user?.role === 'Backoffice',
    isStationOperator: user?.role === 'StationOperator'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
