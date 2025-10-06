import React from 'react'
import { useAuth } from '../context/AuthContext'
import BackofficeDashboard from './BackofficeDashboard'
import OperatorDashboard from './OperatorDashboard'

const Dashboard = () => {
  const { isBackoffice, isStationOperator } = useAuth()

  // Route to appropriate dashboard based on user role
  if (isBackoffice) {
    return <BackofficeDashboard />
  }
  
  if (isStationOperator) {
    return <OperatorDashboard />
  }

  // Fallback for unknown roles or unauthenticated users
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
              <h5>Access Denied</h5>
              <p className="text-muted">
                Your account doesn't have permission to access the dashboard. 
                Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard