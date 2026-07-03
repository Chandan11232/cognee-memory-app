import { useState } from 'react'

export default function Forget({ callApi, loading, result }) {
  const [dataset, setDataset] = useState('main_dataset')
  const [confirmed, setConfirmed] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!confirmed) return
    callApi('forget', {
      dataset_name: dataset,
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
