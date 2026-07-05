import { useState, useEffect } from 'react'

export default function Forget({ callApi, loading, result, datasets, lastDataset, setLastDataset, refreshDatasets }) {
  const [dataset, setDataset] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (lastDataset) {
      setDataset(lastDataset)
    } else if (datasets.length > 0 && !dataset) {
      setDataset(datasets[0].name)
    }
  }, [datasets, lastDataset])

  useEffect(() => {
    if (result?.status === 'deleted') {
      refreshDatasets()
      if (dataset === lastDataset) {
        setLastDataset('')
        localStorage.removeItem('cognee_last_dataset')
      }
    }
  }, [result])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!confirmed || !dataset) return
    callApi('forget', {
      dataset_name: dataset,
    })
  }

  return (
    <div className="pillar">
      <div className="pillar-header">
        <span className="pillar-icon">X</span>
        <div>
          <h2>Forget</h2>
          <p className="pillar-desc">Remove data from Cognee memory</p>
        </div>
      </div>

      <div className="info-card warning">
        <p>
          <strong>Warning:</strong> This action permanently removes the dataset
          and all its associated graph data, embeddings, and metadata.
        </p>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Dataset to delete</label>
          {datasets.length === 0 ? (
            <p className="empty-msg">No datasets available</p>
          ) : (
            <div className="radio-group">
              {datasets.map(d => (
                <label key={d.id} className="radio-item">
                  <input
                    type="radio"
                    name="forget-dataset"
                    value={d.name}
                    checked={dataset === d.name}
                    onChange={(e) => setDataset(e.target.value)}
                  />
                  <span>{d.name}</span>
                </label>
              ))}
            </div>
          )}
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
            <span className="result-icon"></span>
            <span className="result-status">{result.message}</span>
          </div>
          <pre className="result-body">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
