import React from 'react'

const LoadingSpinner = ({ size = 'md', text = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    sm: { spinner: 'spinner-border-sm', icon: 'fa-2x', container: 'p-3' },
    md: { spinner: '', icon: 'fa-3x', container: 'p-4' },
    lg: { spinner: 'spinner-border-lg', icon: 'fa-4x', container: 'p-5' }
  }[size]

  const content = (
    <div className={`d-flex flex-column justify-content-center align-items-center ${sizeClasses.container}`}>
      <div className="position-relative mb-4">
        {/* Outer rotating ring */}
        <div 
          className={`spinner-border ${sizeClasses.spinner}`} 
          role="status"
          style={{ 
            width: size === 'lg' ? '4rem' : size === 'md' ? '3rem' : '2rem',
            height: size === 'lg' ? '4rem' : size === 'md' ? '3rem' : '2rem',
            color: '#11998e',
            borderWidth: '3px'
          }}
        >
          <span className="visually-hidden">{text}</span>
        </div>
        {/* Inner icon */}
        <div 
          className="position-absolute top-50 start-50 translate-middle"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        >
          <i 
            className={`fas fa-charging-station ${sizeClasses.icon === 'fa-2x' ? 'fa-lg' : sizeClasses.icon === 'fa-3x' ? 'fa-xl' : 'fa-2x'}`}
            style={{ color: '#38ef7d' }}
          ></i>
        </div>
      </div>
      <div className="text-center">
        <h5 className="fw-semibold mb-2" style={{ color: '#11998e' }}>{text}</h5>
        <p className="text-muted small mb-0">Please wait a moment...</p>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.7; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )

  if (fullScreen) {
    return (
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
        style={{ 
          background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.05) 0%, rgba(56, 239, 125, 0.05) 100%)',
          zIndex: 9999,
          backdropFilter: 'blur(8px)'
        }}
      >
        <div 
          className="card border-0 shadow-lg p-4" 
          style={{ 
            minWidth: '300px',
            background: 'white',
            borderTop: '4px solid #11998e'
          }}
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="card border-0 shadow-sm bg-white" 
      style={{ borderTop: '3px solid #11998e' }}
    >
      {content}
    </div>
  )
}

export default LoadingSpinner