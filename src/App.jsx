import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import EVOwners from './pages/EVOwners'
import ChargingStations from './pages/ChargingStations'
import CreateStationWithOperator from './pages/CreateStationWithOperator'
import Bookings from './pages/Bookings'
import Users from './pages/Users'
import StationOperations from './pages/StationOperations'
import './styles/App.css'
import ToastManager from './components/ToastManager'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="fas fa-ban me-2"></i>
          Access denied. You don't have permission to view this page.
        </div>
      </div>
    )
  }
  
  return (
    <>
      <Navbar />
      <main className="container-fluid px-4 py-4">
        {children}
      </main>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <ToastManager />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ev-owners" 
              element={
                <ProtectedRoute requiredRole="Backoffice">
                  <EVOwners />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/charging-stations" 
              element={
                // Allow both Backoffice and StationOperator to reach this page
                // Page itself will render role-appropriate UI
                <ProtectedRoute>
                  <ChargingStations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-station-with-operator" 
              element={
                <ProtectedRoute requiredRole="Backoffice">
                  <CreateStationWithOperator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bookings" 
              element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredRole="Backoffice">
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/station-operations" 
              element={
                <ProtectedRoute requiredRole="StationOperator">
                  <StationOperations />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App