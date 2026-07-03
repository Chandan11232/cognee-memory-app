import { useState } from 'react'
import Remember from './components/Remember'
import Recall from './components/Recall'
import Memify from './components/Memify'
import Forget from './components/Forget'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const PILLARS = [
  { key: 'remember', label: 'Remember', icon: '💾', color: '#6366f1' },
  { key: 'recall', label: 'Recall', icon: '🔍', color: '#8b5cf6' },
  { key: 'memify', label: 'Memify', icon: '⚡', color: '#06b6d4' },
  { key: 'forget', label: 'Forget', icon: '🗑️', color: '#ef4444' },
]

export default function App() {
  const [active, setActive] = useState('remember')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastSessionId, setLastSessionId] = useState('')

  const callApi = async (endpoint, body) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (endpoint === 'remember' && data.session_id) {
        setLastSessionId(data.session_id)
      }
      setResult(data)
    } catch (err) {
      setResult({ status: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const renderPillar = () => {
    const props = { callApi, loading, result, setResult, lastSessionId }
    switch (active) {
      case 'remember': return <Remember {...props} />
      case 'recall': return <Recall {...props} />
      case 'memify': return <Memify {...props} />
      case 'forget': return <Forget {...props} />
      default: return null
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">
          <span className="title-icon">🧠</span>
          Cognee Memory Hub
        </h1>
        <p className="subtitle">
          Persistent AI memory — remember, recall, enrich, forget
        </p>
      </header>

      <nav className="nav">
        {PILLARS.map((p) => (
          <button
            key={p.key}
            className={`nav-btn ${active === p.key ? 'active' : ''}`}
            style={{
              '--accent': p.color,
              borderColor: active === p.key ? p.color : 'transparent',
            }}
            onClick={() => { setActive(p.key); setResult(null) }}
          >
            <span className="nav-icon">{p.icon}</span>
            <span className="nav-label">{p.label}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        {renderPillar()}
      </main>
    </div>
  )
}
