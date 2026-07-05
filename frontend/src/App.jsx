import { useState, useEffect } from 'react'
import Remember from './components/Remember'
import Recall from './components/Recall'
import Memify from './components/Memify'
import Forget from './components/Forget'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const PILLARS = [
  { key: 'remember', label: 'Remember', icon: 'R', color: '#7c6aef' },
  { key: 'recall', label: 'Recall', icon: 'Q', color: '#a78bfa' },
  { key: 'memify', label: 'Memify', icon: 'M', color: '#22d3ee' },
  { key: 'forget', label: 'Forget', icon: 'X', color: '#e05252' },
]

export default function App() {
  const [active, setActive] = useState('remember')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastSessionId, setLastSessionId] = useState('')
  const [datasets, setDatasets] = useState([])
  const [lastDataset, setLastDataset] = useState(() => localStorage.getItem('cognee_last_dataset') || '')
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cognee_sessions') || '[]') } catch { return [] }
  })

  const refreshDatasets = () => {
    fetch(`${API_BASE}/datasets`)
      .then(r => r.json())
      .then(d => { if (d.datasets) setDatasets(d.datasets) })
      .catch(() => {})
  }

  const addSession = (session) => {
    setSessions(prev => {
      const updated = [session, ...prev.filter(s => s.session_id !== session.session_id)]
      localStorage.setItem('cognee_sessions', JSON.stringify(updated))
      return updated
    })
  }

  const removeSession = (sessionId) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.session_id !== sessionId)
      localStorage.setItem('cognee_sessions', JSON.stringify(updated))
      return updated
    })
  }

  const removeSessionsByDataset = (datasetName) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.dataset_name !== datasetName)
      localStorage.setItem('cognee_sessions', JSON.stringify(updated))
      return updated
    })
  }

  useEffect(() => {
    refreshDatasets()
  }, [])

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
      if (endpoint === 'remember' && data.status === 'stored' && data.dataset_name) {
        setLastDataset(data.dataset_name)
        localStorage.setItem('cognee_last_dataset', data.dataset_name)
        refreshDatasets()
      }
      if (endpoint === 'recall' && data.status === 'success' && body.dataset_name) {
        setLastDataset(body.dataset_name)
        localStorage.setItem('cognee_last_dataset', body.dataset_name)
      }
      if (endpoint === 'forget' && data.status === 'deleted') {
        refreshDatasets()
        removeSessionsByDataset(body.dataset_name)
        if (body.dataset_name === lastDataset) {
          setLastDataset('')
          localStorage.removeItem('cognee_last_dataset')
        }
      }
      setResult(data)
    } catch (err) {
      setResult({ status: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const renderPillar = () => {
    const props = { callApi, loading, result, setResult, lastSessionId, datasets, lastDataset, setLastDataset, refreshDatasets, sessions, addSession, removeSession }
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
        <h1 className="title">Cognee Memory Hub</h1>
        <p className="subtitle">Persistent AI memory — remember, recall, enrich, forget</p>
      </header>

      <nav className="nav">
        {PILLARS.map((p) => (
          <button
            key={p.key}
            className={`nav-btn ${active === p.key ? 'active' : ''}`}
            style={{
              '--accent': p.color,
            }}
            onClick={() => { setActive(p.key); setResult(null) }}
          >
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
