import { useState, useEffect } from 'react'

export default function Recall({ callApi, loading, result, lastSessionId, datasets }) {
  const [query, setQuery] = useState('')
  const [dataset, setDataset] = useState('')
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    if (lastSessionId) setSessionId(lastSessionId)
  }, [lastSessionId])

  useEffect(() => {
    if (datasets.length > 0 && !dataset) setDataset(datasets[0].name)
  }, [datasets, dataset])

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

        <div className="row">
          <div className="field">
            <label>Dataset</label>
            <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
              {datasets.length === 0 && <option value="">No datasets (use Remember first)</option>}
              {datasets.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Session ID (optional)</label>
            <input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste session ID for instant recall"
            />
          </div>
        </div>

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
              {result.status === 'error' ? result.message : result.source === 'graph' ? 'Answer (knowledge graph)' : result.source === 'session' ? 'Answer (session)' : ''}
            </span>
          </div>
          {result.answer && (
            <div className="answer-box">{result.answer}</div>
          )}
          {!result.answer && result.status === 'empty' && (
            <p className="empty-msg">{result.message}</p>
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