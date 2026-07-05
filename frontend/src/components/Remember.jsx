import { useState, useEffect } from 'react'

export default function Remember({ callApi, loading, result, lastDataset, refreshDatasets, addSession }) {
  const [text, setText] = useState('')
  const [dataset, setDataset] = useState(lastDataset || 'main_dataset')
  const [sessionId, setSessionId] = useState('')
  const [background, setBackground] = useState(false)

  useEffect(() => {
    if (lastDataset) setDataset(lastDataset)
  }, [lastDataset])

  useEffect(() => {
    if (result?.status === 'stored' && result.session_id) {
      addSession({
        session_id: result.session_id,
        dataset_name: dataset,
        preview: text.trim().slice(0, 80),
        timestamp: Date.now(),
      })
    }
  }, [result])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const id = sessionId.trim() || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setSessionId(id)
    callApi('remember', {
      text: text.trim(),
      dataset_name: dataset,
      session_id: id,
      run_in_background: background,
    })
  }

  return (
    <div className="pillar">
      <div className="pillar-header">
        <span className="pillar-icon">💾</span>
        <div>
          <h2>Remember</h2>
          <p className="pillar-desc">Store data in Cognee's persistent memory</p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Content to remember</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text, notes, document content, or any information you want Cognee to remember..."
            rows={6}
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
            <label>Session ID (auto-generated if empty)</label>
            <input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Leave empty for auto-generate"
            />
          </div>
        </div>

        <div className="field checkbox-row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={background}
              onChange={(e) => setBackground(e.target.checked)}
            />
            <span>Run in background (recommended for large content)</span>
          </label>
          <span className="hint">Background mode returns instantly and processes asynchronously</span>
        </div>

        <button type="submit" className="btn primary" disabled={loading || !text.trim()}>
          {loading ? 'Storing...' : 'Remember'}
        </button>
      </form>

      {result && (
        <div className={`result ${result.status === 'error' ? 'error' : 'success'}`}>
          <div className="result-header">
            <span className="result-icon">{result.status === 'error' ? '❌' : '✅'}</span>
            <span className="result-status">{result.status}</span>
          </div>
          {result.session_id && (
            <div className="session-id-banner">
              <strong>Session ID:</strong> <code>{result.session_id}</code>
              <span className="hint">Use this in Recall to query immediately</span>
            </div>
          )}
          <pre className="result-body">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div className="tip">
        <strong>⚡ Speed tip:</strong> Data is stored in <strong>session memory</strong> (instant).
        Switch to <strong>Recall</strong> — the session ID is already filled in for you.
        Data also bridges to permanent memory in the background.
      </div>
    </div>
  )
}
