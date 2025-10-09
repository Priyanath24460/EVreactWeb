import React, { useState } from 'react'
import Toast from './Toast'

const ToastManager = () => {
  const [toasts, setToasts] = useState([])

  const push = (message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev, { id, message, type, duration }])
    return id
  }

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  // expose a small API on window so pages can push without prop-drilling
  if (typeof window !== 'undefined') window.__toast = { push: push, remove }

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1060 }}>
      {toasts.map(t => (
        <div key={t.id} className="mb-2">
          <Toast id={t.id} message={t.message} type={t.type} duration={t.duration} onClose={() => remove(t.id)} />
        </div>
      ))}
    </div>
  )
}

export default ToastManager
