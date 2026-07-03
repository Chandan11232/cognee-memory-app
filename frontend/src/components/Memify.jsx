import { useState } from 'react'

export default function Memify({ callApi, loading, result }) {
  const [dataset, setDataset] = useState('main_dataset')
  const [background, setBackground] = useState(true)

  const handleSubmit = (e) => {
    e.preventDefault()
    callApi('memify', {
      dataset_name: dataset,
      run_in_background: background,
    })
  }

  return (
    <div className="pillar">
      <div className="pillar-header">
        <span className="pillar-icon">⚡</span>
        <div>
          <h2>Memify</h2>
          <p className="pillar-desc">Enrich and improve the knowledge graph</p>
        </div>
      </div>

      <div className="info-card">
        <p>
          <strong>Memify</strong> runs enrichment passes on your existing knowledge graph.
          It extracts deeper entities, relationships, and consolidates information
          for better recall quality.
        </p>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Dataset to enrich</label>
          <input
            value={dataset}
            onChange={(e) => setDataset(e.target.value)}
            placeholder="main_dataset"
          />
        </div>

        <div className="field checkbox-row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={background}
              onChange={(e) => setBackground(e.target.checked)}
            />
            <span>Run in background</span>
          </label>
          <span className="hint">Recommended — enrichment can take time on large graphs</span>
        </div>

        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Processing...' : 'Run Memify'}
        </button>
      </form>

      {result && (
        <div className={`result ${result.status === 'error' ? 'error' : 'success'}`}>
          <div className="result-header">
            <span className="result-icon">{result.status === 'error' ? '❌' : '✅'}</span>
            <span className="result-status">{result.message}</span>
          </div>
          <pre className="result-body">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
