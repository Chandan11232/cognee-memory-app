import { useState, useEffect } from 'react'

export default function Recall({ callApi, loading, result, lastSessionId }) {
  const [query, setQuery] = useState('')
  const [dataset, setDataset] = useState('main_dataset')
  const [sessionId, setSessionId] = useState('')
  const [topK, setTopK] = useState(5)

  useEffect(() => {
    if (lastSessionId) setSessionId(lastSessionId)
  }, [lastSessionId])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    callApi('recall', {
      query: query.trim(),
      dataset_name: dataset,
      session_id: sessionId || null,
      top_k: topK,
    })
  }

  return (
    <div className="pillar">
      <div className="pillar-header">
        <span className="pillar-icon">🔍</span>
        <div>
          <h2>Recall</h2>
          <p className="pillar-desc">Query stored memory with natural language</p>
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
            <label>Dataset name</label>
            <input
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
              placeholder="main_dataset"
            />
          </div>
          <div className="field">
            <label>Session ID (required to find session memory)</label>
            <input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste session ID from Remember"
            />
          </div>
          <div className="field field-sm">
            <label>Top K results</label>
            <input
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
            />
          </div>
        </div>

        <button type="submit" className="btn primary" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Recall'}
        </button>
      </form>

      {result && (
        <div className={`result ${result.status === 'error' ? 'error' : 'success'}`}>
          <div className="result-header">
            <span className="result-icon">
              {result.status === 'error' ? '❌' : result.count > 0 ? '🎯' : '📭'}
            </span>
            <span className="result-status">
              {result.status === 'error' ? result.message : `${result.count} result(s) found`}
            </span>
          </div>
          {result.results?.length > 0 && (
            <div className="results-list">
              {result.results.map((r, i) => (
                <div key={i} className="result-item">
                  <div className="result-item-header">
                    <span className="result-item-num">#{i + 1}</span>
                    <span className="result-item-score">Score: {r.score?.toFixed(4) ?? 'N/A'}</span>
                  </div>
                  <div className="result-item-text">{r.text}</div>
                </div>
              ))}
            </div>
          )}
          {result.count === 0 && result.status === 'empty' && (
            <p className="empty-msg">{result.message}</p>
          )}
          {result.count === 0 && !result.status?.includes('empty') && !sessionId && (
            <div className="tip" style={{ margin: '12px', border: '1px solid var(--border)' }}>
              <strong>💡 Tip:</strong> Session data needs the same <code>session_id</code> used during
              Remember. If you just stored data, the session ID was auto-filled above. Try searching with it.
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
