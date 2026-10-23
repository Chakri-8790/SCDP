import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Eye, AlertTriangle } from 'lucide-react';
import { predictionService } from '../../services/predictionService';
import MainLayout from '../../layouts/MainLayout';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import RecommendationCard from '../../components/RecommendationCard/RecommendationCard';
import { formatDateTime, formatDate, getRiskClass, featureDisplayName } from '../../utils/helpers';
import '../../styles/tables.css';
import '../../styles/cards.css';

const Reports = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewPrediction, setViewPrediction] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    predictionService.getAll({ limit: 50 }).then(res => {
      setPredictions(res.data.predictions);
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const openReport = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await predictionService.getById(id);
      setViewPrediction(res.data.prediction);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePrint = () => window.print();

  const p = viewPrediction;
  const INPUT_FEATURES = [
    'timestamp','temperature','humidity','vibration_level','material_usage','machinery_status',
    'worker_count','energy_consumption','task_progress','cost_deviation','time_deviation',
    'safety_incidents','equipment_utilization_rate','material_shortage_alert','risk_score',
    'simulation_deviation','update_frequency','optimization_suggestion','performance_score'
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <h1>Reports</h1>
        <p>Generate and download detailed prediction reports</p>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading reports..." /> :
       error ? <ErrorMessage message={error} /> :
       !predictions.length ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" />
          <h3>No reports available</h3>
          <p>Run a prediction to generate your first report.</p>
          <Link to="/prediction"><Button icon={<AlertTriangle size={15} />}>Run Prediction</Button></Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Project</th><th>Prediction</th><th>Risk Level</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map(pred => (
                <tr key={pred._id}>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{formatDateTime(pred.createdAt)}</td>
                  <td style={{ fontWeight: 500 }}>{pred.projectId?.projectName || '—'}</td>
                  <td><span className={`badge badge-${pred.delayPrediction === 'On Schedule' ? 'success' : 'danger'}`}>{pred.delayPrediction}</span></td>
                  <td><span className={`badge badge-risk-${getRiskClass(pred.riskLevel)}`}>{pred.riskLevel}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="table-action-btn" title="View Report" onClick={() => openReport(pred._id)}>
                        {loadingDetail ? '...' : <Eye size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Modal */}
      <Modal isOpen={!!viewPrediction} onClose={() => setViewPrediction(null)} title="Prediction Report" size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewPrediction(null)}>Close</Button>
            <Button icon={<Download size={15} />} onClick={handlePrint}>Download / Print</Button>
          </>
        }>
        {p && (
          <div className="print-report">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, padding: '16px 0', borderBottom: '2px solid var(--border-color)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 4 }}>{p.projectId?.projectName}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Generated: {formatDateTime(p.createdAt)}</div>
              </div>
              <span className={`badge badge-risk-${getRiskClass(p.riskLevel)}`} style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}>{p.riskLevel} Risk</span>
            </div>

            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Delay Prediction', value: p.delayPrediction },
                { label: 'Delay Probability', value: `${p.delayProbability}%` },
                { label: 'Predicted Risk Score', value: `${p.predictedRiskScore}/100` },
                { label: 'Current Risk Score (Input)', value: `${p.risk_score}/100` },
                { label: 'Confidence', value: `${p.confidence}%` },
                { label: 'Risk Level', value: p.riskLevel },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: 12, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Input Features */}
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 12 }}>19 Input Features</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 24 }}>
              {INPUT_FEATURES.map(f => (
                <div key={f} style={{ padding: '8px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{featureDisplayName(f)}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{String(p[f] ?? '—')}</div>
                </div>
              ))}
            </div>

            {/* Risk Factors */}
            {p.majorRiskFactors?.length > 0 && (
              <>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 12 }}>Top Risk Factors</h3>
                <div style={{ marginBottom: 24 }}>
                  {p.majorRiskFactors.map(f => (
                    <div key={f.feature} className="feature-bar-item">
                      <span className="feature-bar-name">{featureDisplayName(f.feature)}</span>
                      <div className="feature-bar-track"><div className="feature-bar-fill" style={{ width: `${Math.min(100, f.importance * 4)}%` }} /></div>
                      <span className="feature-bar-pct">{f.importance}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Recommendations */}
            {p.recommendations?.length > 0 && (
              <>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 12 }}>Recommendations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.recommendations.map((r, i) => <RecommendationCard key={i} recommendation={r} index={i} />)}
                </div>
              </>
            )}

            <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              This report is a decision-support document. The system provides risk indicators and recommendations to assist project managers. It does not guarantee construction delay outcomes.
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default Reports;
