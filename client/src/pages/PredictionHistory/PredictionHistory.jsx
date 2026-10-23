import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Trash2, Filter, Zap } from 'lucide-react';
import { predictionService } from '../../services/predictionService';
import MainLayout from '../../layouts/MainLayout';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import { formatDateTime, getRiskClass, debounce } from '../../utils/helpers';
import '../../styles/tables.css';

const RISK_OPTIONS = ['', 'Low', 'Medium', 'High', 'Critical'];
const DELAY_OPTIONS = ['', 'On Schedule', 'Potential Delay', 'Likely Delayed', 'Severe Delay Risk'];

const PredictionHistory = () => {
  const [predictions, setPredictions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPredictions = useCallback(async (page = 1, risk = riskFilter) => {
    setLoading(true);
    setError('');
    try {
      const res = await predictionService.getAll({ page, limit: 15, riskLevel: risk });
      setPredictions(res.data.predictions);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load predictions.');
    } finally {
      setLoading(false);
    }
  }, [riskFilter]);

  useEffect(() => { fetchPredictions(); }, []);

  const handleRiskFilter = (e) => {
    setRiskFilter(e.target.value);
    fetchPredictions(1, e.target.value);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await predictionService.delete(deleteTarget._id);
      setDeleteTarget(null);
      fetchPredictions(pagination.page);
    } catch (err) {
      setError(err.message || 'Failed to delete.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = search
    ? predictions.filter(p =>
        p.projectId?.projectName?.toLowerCase().includes(search.toLowerCase()) ||
        p.delayPrediction?.toLowerCase().includes(search.toLowerCase())
      )
    : predictions;

  return (
    <MainLayout>
      <div className="page-header">
        <h1>Prediction History</h1>
        <p>All AI risk analyses run on your projects</p>
      </div>

      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="table-search">
            <Search size={14} className="table-search-icon" />
            <input className="table-search-input" placeholder="Search predictions..." value={search}
              onChange={(e) => setSearch(e.target.value)} aria-label="Search predictions" />
          </div>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <select className="filter-select" value={riskFilter} onChange={handleRiskFilter} aria-label="Filter by risk level">
            {RISK_OPTIONS.map(r => <option key={r} value={r}>{r || 'All Risk Levels'}</option>)}
          </select>
        </div>
        <div className="text-muted text-sm">{pagination.total} total</div>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading predictions..." /> :
       error ? <ErrorMessage message={error} onRetry={() => fetchPredictions()} /> :
       !filtered.length ? (
        <div className="empty-state">
          <Zap className="empty-state-icon" />
          <h3>No predictions found</h3>
          <p>{search || riskFilter ? 'Try adjusting your filters.' : 'Run your first prediction to see results here.'}</p>
          {!search && !riskFilter && <Link to="/prediction"><Button icon={<Zap size={15} />}>New Prediction</Button></Link>}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Prediction</th>
                  <th>Delay %</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{formatDateTime(p.createdAt)}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      <Link to={`/projects/${p.projectId?._id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                        {p.projectId?.projectName || '—'}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge badge-${p.delayPrediction === 'On Schedule' ? 'success' : p.delayPrediction === 'Potential Delay' ? 'warning' : 'danger'}`}>
                        {p.delayPrediction}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.delayProbability}%</td>
                    <td style={{ fontWeight: 600 }}>{p.predictedRiskScore}/100</td>
                    <td><span className={`badge badge-risk-${getRiskClass(p.riskLevel)}`}>{p.riskLevel}</span></td>
                    <td>{p.isMock ? <span className="badge badge-warning">Demo</span> : <span className="badge badge-success">AI</span>}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/predictions/${p._id}`}><button className="table-action-btn" title="View details"><Eye size={14} /></button></Link>
                        <button className="table-action-btn danger" title="Delete" onClick={() => setDeleteTarget(p)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchPredictions(pagination.page - 1)}>←</button>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map(n => (
                  <button key={n} className={`page-btn ${n === pagination.page ? 'active' : ''}`} onClick={() => fetchPredictions(n)}>{n}</button>
                ))}
                <button className="page-btn" disabled={pagination.page >= pagination.pages} onClick={() => fetchPredictions(pagination.page + 1)}>→</button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Prediction" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button></>}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Delete this prediction record from <strong>{deleteTarget?.projectId?.projectName}</strong>? This cannot be undone.
        </p>
      </Modal>
    </MainLayout>
  );
};

export default PredictionHistory;
