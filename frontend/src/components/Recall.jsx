import { useState, useEffect } from 'react'

export default function Recall({ callApi, loading, result, lastSessionId, datasets, lastDataset, setLastDataset, sessions, removeSession }) {
  const [query, setQuery] = useState('')
  const [dataset, setDataset] = useState(lastDataset || '')
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    if (lastSessionId) setSessionId(lastSessionId)
  }, [lastSessionId])

  useEffect(() => {
    if (lastDataset) {
      setDataset(lastDataset)
    } else if (datasets.length > 0 && !dataset) {
      setDataset(datasets[0].name)
    }
  }, [datasets, lastDataset])

  const handleDatasetChange = (e) => {
    const val = e.target.value
    setDataset(val)
    setLastDataset(val)
    localStorage.setItem('cognee_last_dataset', val)
  }

  const handleSessionSelect = (sid) => {
    setSessionId(sid === sessionId ? '' : sid)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    callApi('recall', {
      query: query.trim(),
      dataset_name: dataset || 'main_dataset',
      session_id: sessionId || null,
      top_k: 5,
    })
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="pillar">
      <div className="pillar-header">
        <span className="pillar-icon">🔍</span>
        <div>
          <h2>Recall</h2>
          <p className="pillar-desc">Ask questions about your stored data</p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Your question</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about the data you've stored..."
            rows={3}
          />
        </div>

        <div className="field">
          <label>Dataset</label>
          <select value={dataset} onChange={handleDatasetChange}>
            {datasets.length === 0 && <option value="">No datasets (use Remember first)</option>}
            {datasets.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {sessions.length > 0 && (
          <div className="field">
            <label>Sessions (click to select for instant recall)</label>
            <div className="session-list">
              {sessions.map(s => (
                <div
                  key={s.session_id}
                  className={`session-item ${sessionId === s.session_id ? 'active' : ''}`}
                  onClick={() => handleSessionSelect(s.session_id)}
                >
                  <div className="session-item-header">
                    <span className="session-item-id">{s.session_id}</span>
                    <span className="session-item-time">{formatTime(s.timestamp)}</span>
                  </div>
                  <div className="session-item-meta">
                    <span className="session-item-dataset">{s.dataset_name}</span>
                    {s.preview && <span className="session-item-preview">{s.preview}...</span>}
                  </div>
                  <button
                    type="button"
                    className="session-item-remove"
                    onClick={(e) => { e.stopPropagation(); removeSession(s.session_id) }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="field">
            <label>Session ID (optional)</label>
            <input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Use Remember with a session ID first"
              disabled
            />
          </div>
        )}

        <button type="submit" className="btn primary" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Ask'}
        </button>
      </form>

      {result && (
        <div className={`result ${result.status === 'error' ? 'error' : 'success'}`}>
          <div className="result-header">
            <span className="result-icon">
              {result.status === 'error' ? '❌' : result.answer ? '🎯' : '📭'}
            </span>
            <span className="result-status">
              {result.status === 'error' ? (result.message || result.answer) : result.source === 'graph' ? 'Answer (knowledge graph)' : result.source === 'session' ? 'Answer (session)' : ''}
            </span>
          </div>
          {result.answer && (
            <div className="answer-box">{result.answer}</div>
          )}
          {result.detail && (
            <p className="empty-msg" style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '8px' }}>{result.detail}</p>
          )}
          {!result.answer && result.status === 'empty' && (
            <p className="empty-msg">{result.answer || result.message}</p>
          )}
          {result.source === 'session' && result.count > 0 && (
            <div className="tip" style={{ margin: '12px', border: '1px solid var(--border)' }}>
              <strong>⚡ Session recall:</strong> Using "{sessionId}". Data is in session cache.
              Run Memify to enrich it into the knowledge graph for improved answers.
            </div>
          )}
          <details>
            <summary>Raw response</summary>
            <pre className="result-body">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  )
}