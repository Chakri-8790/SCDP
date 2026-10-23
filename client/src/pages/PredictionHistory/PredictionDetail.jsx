import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { predictionService } from '../../services/predictionService';
import MainLayout from '../../layouts/MainLayout';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import RecommendationCard from '../../components/RecommendationCard/RecommendationCard';
import { formatDateTime, getRiskClass, featureDisplayName } from '../../utils/helpers';
import '../../styles/cards.css';

const INPUT_FEATURES = [
  'timestamp','temperature','humidity','vibration_level','material_usage','machinery_status',
  'worker_count','energy_consumption','task_progress','cost_deviation','time_deviation',
  'safety_incidents','equipment_utilization_rate','material_shortage_alert','risk_score',
  'simulation_deviation','update_frequency','optimization_suggestion','performance_score'
];

const PredictionDetail = () => {
  const { id } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    predictionService.getById(id)
      .then(res => setPrediction(res.data.prediction))
      .catch(err => setError(err.message || 'Prediction not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <MainLayout><LoadingSpinner size="lg" text="Loading prediction..." /></MainLayout>;
  if (error) return <MainLayout><ErrorMessage message={error} /></MainLayout>;

  const p = prediction;
  const riskCls = getRiskClass(p.riskLevel);

  return (
    <MainLayout>
      <Link to="/predictions" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to History
      </Link>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>Prediction Detail</h1>
            <p>{p.projectId?.projectName} · {formatDateTime(p.createdAt)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {p.isMock && <span className="mock-notice">⚠ Demo mode</span>}
            <span className={`badge badge-risk-${riskCls}`} style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }}>{p.riskLevel} Risk</span>
          </div>
        </div>
      </div>

      {/* Hero Result */}
      <div className="result-card" style={{ marginBottom: 24 }}>
        <div className={`result-card-hero result-hero-${riskCls}`}>
          <div className="result-hero-label">Delay Probability</div>
          <div className="result-hero-value">{p.delayProbability}<span className="result-hero-unit">%</span></div>
          <div className="result-hero-title">{p.delayPrediction}</div>
        </div>
        <div className="result-metrics">
          <div className="result-metric">
            <div className="result-metric-value" style={{ color: `var(--risk-${riskCls})` }}>{p.predictedRiskScore}</div>
            <div className="result-metric-label">Predicted Risk Score</div>
          </div>
          <div className="result-metric">
            <div className="result-metric-value">{p.riskLevel}</div>
            <div className="result-metric-label">Risk Level</div>
          </div>
          <div className="result-metric">
            <div className="result-metric-value">{p.confidence}%</div>
            <div className="result-metric-label">Confidence</div>
          </div>
        </div>
      </div>

      {/* Risk Score Comparison */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', padding: '20px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--text-primary)' }}>{p.risk_score}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Current Risk Score (Input)</div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', background: `var(--risk-${riskCls}-bg)`, borderRadius: 'var(--radius-lg)', border: `2px solid var(--risk-${riskCls})` }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: `var(--risk-${riskCls})` }}>{p.predictedRiskScore}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: `var(--risk-${riskCls})`, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Predicted Risk Score (ML Output)</div>
        </div>
      </div>

      {/* 19 Input Features */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><div className="card-title">19 Input Features</div></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {INPUT_FEATURES.map(f => (
              <div key={f} style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 3 }}>{featureDisplayName(f)}</div>
                <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 500 }}>{String(p[f] ?? '—')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {p.majorRiskFactors?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">Why is this project at risk?</div></div>
          <div className="card-body">
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 16 }}>
              Feature contributions from the model. Higher values indicate stronger association with the prediction outcome. Association does not imply causation.
            </p>
            {p.majorRiskFactors.map(f => (
              <div key={f.feature} className="feature-bar-item">
                <span className="feature-bar-name">{featureDisplayName(f.feature)}</span>
                <div className="feature-bar-track">
                  <div className="feature-bar-fill" style={{ width: `${Math.min(100, f.importance * 4)}%` }} />
                </div>
                <span className="feature-bar-pct">{f.importance}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {p.recommendations?.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">Recommendations</div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>
              These recommendations support decision-making and do not guarantee delay elimination.
            </p>
            {p.recommendations.map((r, i) => <RecommendationCard key={i} recommendation={r} index={i} />)}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default PredictionDetail;
