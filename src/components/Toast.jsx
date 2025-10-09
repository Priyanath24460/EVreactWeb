import React, { useEffect } from 'react'

const Toast = ({ id, message, type = 'info', duration = 4000, onClose }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(id), duration)
    return () => clearTimeout(t)
  }, [id, duration, onClose])

  const bg = type === 'success' ? 'bg-success text-white' : type === 'error' ? 'bg-danger text-white' : 'bg-secondary text-white'

  return (
    <div className={`toast show ${bg}`} role="alert" aria-live="assertive" aria-atomic="true" style={{ minWidth: 200 }}>
      <div className="toast-body py-2 px-3">
        {message}
      </div>
    </div>
  )
}

export default Toast
