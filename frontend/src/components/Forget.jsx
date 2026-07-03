import { useState, useEffect } from 'react'

export default function Forget({ callApi, loading, result, datasets }) {
  const [dataset, setDataset] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (datasets.length > 0 && !dataset) setDataset(datasets[0].name)
  }, [datasets, dataset])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!confirmed) return
    callApi('forget', {
      dataset_name: dataset || 'main_dataset',
    })
  }

  return (
    <div className="pillar">
      <div className="pillar-header">
        <span className="pillar-icon">🗑️</span>
        <div>
          <h2>Forget</h2>
          <p className="pillar-desc">Remove data from Cognee memory</p>
        </div>
      </div>

      <div className="info-card warning">
        <p>
          <strong>⚠️ Warning:</strong> This action permanently removes the dataset
          and all its associated graph data, embeddings, and metadata.
        </p>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Dataset to delete</label>
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
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>I understand this will permanently delete the dataset</span>
          </label>
        </div>

        <button
          type="submit"
          className="btn danger"
          disabled={loading || !confirmed}
        >
          {loading ? 'Deleting...' : 'Forget Dataset'}
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