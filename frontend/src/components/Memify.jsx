import { useState, useEffect } from 'react'

export default function Memify({ callApi, loading, result, datasets, lastDataset }) {
  const [dataset, setDataset] = useState(lastDataset || '')
  const [background, setBackground] = useState(true)

  useEffect(() => {
    if (lastDataset) {
      setDataset(lastDataset)
    } else if (datasets.length > 0 && !dataset) {
      setDataset(datasets[0].name)
    }
  }, [datasets, lastDataset])

  const handleSubmit = (e) => {
    e.preventDefault()
    callApi('memify', {
      dataset_name: dataset || 'main_dataset',
      run_in_background: background,
    })
  }

  return (
    <div className="pillar">
      <div className="pillar-header">
        <span className="pillar-icon">M</span>
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
          <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
            {datasets.length === 0 && <option value="">No datasets available</option>}
            {datasets.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
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
            <span className="result-icon"></span>
            <span className="result-status">{result.message}</span>
          </div>
          <pre className="result-body">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
