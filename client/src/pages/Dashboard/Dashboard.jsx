import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, AlertTriangle, TrendingUp, Activity,
  Zap, Clock, BarChart3, ArrowRight, BookOpen, Lightbulb,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { predictionService } from '../../services/predictionService';
import MainLayout from '../../layouts/MainLayout';
import StatCard from '../../components/StatCard/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import RiskTrendChart from '../../components/charts/RiskTrendChart';
import DelayProbabilityChart from '../../components/charts/DelayProbabilityChart';
import FeatureImportanceChart from '../../components/charts/FeatureImportanceChart';
import { greetUser, formatTimeAgo, getRiskClass } from '../../utils/helpers';
import '../../styles/dashboard.css';

/* ── reusable explanation block ─────────────────────────────── */
const ChartExplain = ({ title, children, verdict }) => (
  <div style={{
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-color)',
    borderLeft: '3px solid var(--primary-color)',
    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
    padding: '12px 16px',
    marginTop: -1,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <BookOpen size={13} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
        {title}
      </span>
    </div>
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
      {children}
    </div>
    {verdict && (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8,
        background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)',
        padding: '7px 10px', fontSize: 'var(--text-xs)',
        color: 'var(--primary-color)', lineHeight: 1.55,
      }}>
        <Lightbulb size={12} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{verdict}</span>
      </div>
    )}
  </div>
);

const KpiExplain = ({ items }) => (
  <div style={{
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '12px 16px',
    marginBottom: 'var(--space-6)',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 10,
  }}>
    {items.map(({ label, desc, color }) => (
      <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />
        <div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>
    ))}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [trends,  setTrends]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [dashRes, trendRes] = await Promise.all([
        predictionService.getDashboard(),
        predictionService.getTrends({ days: 30 }),
      ]);
      setData(dashRes.data);
      setTrends(trendRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const kpis  = data?.kpis || {};
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <MainLayout>
      <div className="dashboard-header">
        <h1 className="dashboard-greeting">{greetUser(user?.name)}</h1>
        <p className="dashboard-subtitle">Construction Risk Overview</p>
        <p className="dashboard-date">{today}</p>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* ── KPI Cards ──────────────────────────────────────── */}
          <div className="kpi-grid">
            <StatCard icon={<FolderOpen  size={22} />} value={kpis.totalProjects    ?? 0} label="Total Projects"
              iconBg="var(--primary-light)"   iconColor="var(--primary-color)" />
            <StatCard icon={<Activity    size={22} />} value={kpis.activeProjects   ?? 0} label="Active Projects"
              iconBg="var(--success-bg)"      iconColor="var(--success-color)" />
            <StatCard icon={<Clock       size={22} />} value={kpis.delayedProjects  ?? 0} label="Delayed Projects"
              iconBg="var(--danger-bg)"       iconColor="var(--danger-color)" />
            <StatCard icon={<AlertTriangle size={22}/>} value={kpis.highRiskProjects ?? 0} label="High Risk Projects"
              iconBg="var(--warning-bg)"      iconColor="var(--warning-color)" />
            <StatCard icon={<TrendingUp  size={22} />} value={`${kpis.averageRiskScore ?? 0}`} label="Avg. Risk Score"
              iconBg="var(--secondary-light)" iconColor="var(--secondary-color)" />
            <StatCard icon={<BarChart3   size={22} />} value={`${kpis.averageProgress ?? 0}%`} label="Avg. Progress"
              iconBg="var(--accent-light)"    iconColor="var(--accent-color)" />
          </div>

          {/* KPI explanations */}
          <KpiExplain items={[
            { label: 'Total Projects',    color: 'var(--primary-color)',   desc: 'All construction projects in your account.' },
            { label: 'Active Projects',   color: 'var(--success-color)',   desc: 'Projects with status "In Progress" or "At Risk".' },
            { label: 'Delayed Projects',  color: 'var(--danger-color)',    desc: 'Projects currently marked as Delayed.' },
            { label: 'High Risk',         color: 'var(--warning-color)',   desc: 'Projects with a High or Critical ML risk prediction.' },
            { label: 'Avg. Risk Score',   color: 'var(--secondary-color)', desc: 'Mean predicted risk score (0–100) across all predictions.' },
            { label: 'Avg. Progress',     color: 'var(--accent-color)',    desc: 'Average task completion % across all active projects.' },
          ]} />

          {/* ── Charts ─────────────────────────────────────────── */}
          <div className="dashboard-body">

            {/* Risk Distribution */}
            <div>
              <div className="chart-card" style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', borderBottom: 'none' }}>
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Risk Distribution</div>
                    <div className="chart-card-subtitle">All-time predictions by risk level</div>
                  </div>
                </div>
                <RiskDistributionChart data={data?.riskDistribution || []} />
              </div>
              <ChartExplain
                title="What this chart shows"
                verdict={
                  (data?.riskDistribution?.find(d => d._id === 'Critical')?.count ?? 0) > 0
                    ? `You have projects in the Critical zone — these need immediate attention.`
                    : `No Critical-risk predictions yet. Keep monitoring to stay ahead of delays.`
                }
              >
                Every prediction the model has made is bucketed into one of four risk levels:{' '}
                <strong style={{ color: '#059669' }}>Low (0–25)</strong>,{' '}
                <strong style={{ color: '#d97706' }}>Medium (26–50)</strong>,{' '}
                <strong style={{ color: '#ea580c' }}>High (51–75)</strong>, and{' '}
                <strong style={{ color: '#dc2626' }}>Critical (76–100)</strong>.
                A healthy portfolio has most predictions in Low and Medium.
                Any growth in the High or Critical slices signals systemic issues that need intervention.
              </ChartExplain>
            </div>

            {/* Delay Categories */}
            <div>
              <div className="chart-card" style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', borderBottom: 'none' }}>
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Delay Categories</div>
                    <div className="chart-card-subtitle">Prediction outcome breakdown</div>
                  </div>
                </div>
                <DelayProbabilityChart data={trends?.delayTrend || []} />
              </div>
              <ChartExplain
                title="Delay vs No Delay split"
                verdict="If the Delay bar is growing over time, the ML model is detecting worsening conditions across your projects."
              >
                The AI model outputs a binary decision for each prediction run:{' '}
                <strong>No Delay</strong> (the project is on track) or <strong>Delay</strong> (the project is at risk of slipping).
                This chart counts how many of your predictions fell into each category.
                A rising Delay count is an early warning to review project inputs and take corrective action.
              </ChartExplain>
            </div>

            {/* Risk Trend */}
            <div className="dashboard-body-full">
              <div className="chart-card" style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', borderBottom: 'none' }}>
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Risk Score Trend</div>
                    <div className="chart-card-subtitle">Last 30 days — avg risk per day</div>
                  </div>
                </div>
                <RiskTrendChart data={trends?.riskTrend || []} />
              </div>
              <ChartExplain
                title="Reading the risk trend line"
                verdict="A downward trend means your interventions are working. An upward trend means conditions are deteriorating — run a new prediction and check the top risk factors."
              >
                Each point on this chart is the <strong>average predicted risk score</strong> across all predictions run on that day (0 = perfectly safe, 100 = critical).
                The shaded area behind the line is the spread between the minimum and maximum risk scores on that day.
                A rising trend over multiple days indicates that the construction conditions feeding into the model are getting worse.
                Spikes on individual days often correspond to equipment breakdowns, material shortages, or safety incidents entered as inputs.
              </ChartExplain>
            </div>

            {/* Feature Importance */}
            <div className="dashboard-body-full">
              <div className="chart-card" style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', borderBottom: 'none' }}>
                <div className="chart-card-header">
                  <div>
                    <div className="chart-card-title">Feature Importance</div>
                    <div className="chart-card-subtitle">Average signal contributions across your predictions</div>
                  </div>
                </div>
                <FeatureImportanceChart data={trends?.featureImportance || []} />
              </div>
              <ChartExplain
                title="What the model uses to make decisions"
                verdict="Focus management effort on the top 3 features — improving those inputs will have the biggest impact on reducing predicted delay risk."
              >
                Feature importance shows <strong>which of the 19 input signals the AI model relies on most</strong> when predicting delays across your projects.
                Values are averaged across all your recent predictions.
                <br /><br />
                <strong>Risk Score</strong> — your existing project risk score is the strongest signal; it encodes historical patterns the model can leverage.<br />
                <strong>Material Shortage</strong> — supply disruptions directly halt construction work and are a leading indicator of delays.<br />
                <strong>Cost Deviation</strong> — budget overruns almost always accompany schedule slippage.<br />
                <strong>Equipment Utilization</strong> — low utilisation means machines are idle, signalling stalled progress.<br />
                <strong>Safety Risk</strong> — safety incidents cause work stoppages and inspections that directly impact timelines.
              </ChartExplain>
            </div>

          </div>

          {/* ── Recent Predictions ─────────────────────────────── */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">Recent Predictions</div>
              <Link to="/predictions" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--primary-color)', textDecoration: 'none' }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {!data?.recentPredictions?.length ? (
              <div className="empty-state">
                <Zap className="empty-state-icon" />
                <h3>No predictions yet</h3>
                <p>Run your first analysis to see results here.</p>
                <Link to="/prediction"><button className="btn btn-primary btn-md">New Prediction</button></Link>
              </div>
            ) : (
              <>
                <div className="activity-list">
                  {data.recentPredictions.map(p => (
                    <Link key={p._id} to={`/predictions/${p._id}`} style={{ textDecoration: 'none' }}>
                      <div className="activity-item">
                        <div className="activity-icon" style={{
                          background: `var(--risk-${getRiskClass(p.riskLevel)}-bg)`,
                          color: `var(--risk-${getRiskClass(p.riskLevel)})`,
                        }}>
                          <AlertTriangle size={16} />
                        </div>
                        <div className="activity-body">
                          <div className="activity-title">{p.projectId?.projectName || 'Project'}</div>
                          <div className="activity-meta">
                            {p.delayPrediction} · Risk {p.predictedRiskScore}/100 · {formatTimeAgo(p.createdAt)}
                          </div>
                        </div>
                        <span className={`badge badge-risk-${getRiskClass(p.riskLevel)}`}>{p.riskLevel}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                {/* mini legend */}
                <div style={{
                  display: 'flex', gap: 12, flexWrap: 'wrap',
                  padding: '10px 16px', borderTop: '1px solid var(--border-color)',
                  background: 'var(--surface-sunken)',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Risk levels:</span>
                  {[['Low','var(--risk-low)'],['Medium','var(--risk-medium)'],['High','var(--risk-high)'],['Critical','var(--risk-critical)']].map(([l, c]) => (
                    <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} /> {l}
                    </span>
                  ))}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                    <Info size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    Click any row to see full prediction details
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default Dashboard;
