import React from 'react'

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClass = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  }[size]

  return (
    <div className="d-flex justify-content-center align-items-center p-4">
      <div className={`spinner-border text-primary ${sizeClass}`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      <span className="ms-2 text-muted">{text}</span>
    </div>
  )
}

export default LoadingSpinner