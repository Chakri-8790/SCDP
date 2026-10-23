import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, TrendingUp, BarChart3, Target, Activity } from 'lucide-react';
import { predictionService } from '../../services/predictionService';
import { projectService } from '../../services/projectService';
import MainLayout from '../../layouts/MainLayout';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import RiskTrendChart from '../../components/charts/RiskTrendChart';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import DelayProbabilityChart from '../../components/charts/DelayProbabilityChart';
import FeatureImportanceChart from '../../components/charts/FeatureImportanceChart';
import '../../styles/dashboard.css';
import '../../styles/charts.css';

/* ── reusable explanation block ─────────────────────────────── */
const Explain = ({ icon: Icon = BookOpen, title, children, verdict }) => (
  <div style={{
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-color)',
    borderLeft: '3px solid var(--primary-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    marginTop: 12,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <Icon size={13} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{title}</span>
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

/* ── chart wrapper with title + explanation ──────────────────── */
const ChartSection = ({ title, subtitle, children, explainTitle, explainContent, verdict, fullWidth }) => (
  <div className={fullWidth ? 'dashboard-body-full' : ''} style={{ display: 'flex', flexDirection: 'column' }}>
    <div className="chart-card" style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', borderBottom: 'none', marginBottom: 0 }}>
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title">{title}</div>
          {subtitle && <div className="chart-card-subtitle">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
    <Explain title={explainTitle} verdict={verdict}>
      {explainContent}
    </Explain>
  </div>
);

const Analytics = () => {
  const [trends,    setTrends]    = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [filters,   setFilters]   = useState({ days: '30', projectId: '' });

  const fetchData = async (f = filters) => {
    setLoading(true); setError('');
    try {
      const [trendRes, dashRes] = await Promise.all([
        predictionService.getTrends({ days: f.days, projectId: f.projectId || undefined }),
        predictionService.getDashboard(),
      ]);
      setTrends(trendRes.data);
      setDashboard(dashRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    projectService.getAll({ limit: 100 }).then(res => setProjects(res.data.projects)).catch(() => {});
  }, []);

  const setFilter = (key) => (e) => {
    const nf = { ...filters, [key]: e.target.value };
    setFilters(nf);
    fetchData(nf);
  };

  const days = parseInt(filters.days);

  return (
    <MainLayout>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, width: '100%' }}>
          <div>
            <h1>Analytics</h1>
            <p>Risk trends, delay patterns, and feature analysis across your projects</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="filter-select" value={filters.days} onChange={setFilter('days')} aria-label="Date range">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <select className="filter-select" value={filters.projectId} onChange={setFilter('projectId')} aria-label="Project filter">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Overview strip ──────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        marginBottom: 24,
        display: 'flex', alignItems: 'flex-start', gap: 8,
        fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        <Activity size={13} style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: 2 }} />
        <span>
          Showing data for the <strong>last {filters.days} days</strong>
          {filters.projectId ? ` · filtered to one project` : ` · all projects`}.
          Each chart below includes an explanation of what it means for your construction portfolio.
          Use the filters above to drill into a specific time window or project.
        </span>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading analytics..." /> :
       error   ? <ErrorMessage message={error} onRetry={() => fetchData()} /> : (
        <div className="dashboard-body" style={{ marginBottom: 24 }}>

          {/* ── Risk Score Trend ─────────────────────────────── */}
          <ChartSection
            fullWidth
            title="Risk Score Trend"
            subtitle={`Average predicted risk per day — last ${filters.days} days`}
            explainTitle="How to read this trend"
            verdict={
              (() => {
                const t = trends?.riskTrend || [];
                if (t.length < 2) return 'Run more predictions over time to see a meaningful trend.';
                const first = t[0]?.avgRisk || 0;
                const last  = t[t.length - 1]?.avgRisk || 0;
                if (last > first + 5)  return `Risk is trending UP (+${(last - first).toFixed(1)} pts). Investigate recent inputs and run fresh predictions on your highest-risk projects.`;
                if (last < first - 5)  return `Risk is trending DOWN (${(last - first).toFixed(1)} pts). Your interventions appear to be working — keep monitoring.`;
                return 'Risk score is relatively stable. Continue regular monitoring.';
              })()
            }
            explainContent={
              <>
                Each point represents the <strong>average predicted risk score</strong> of all predictions run on that day (0 = safe, 100 = critical).
                If you filtered to a single project, you are seeing only that project's daily risk.
                <br /><br />
                <strong>Rising trend</strong> — construction conditions are deteriorating. Check equipment status, material supply, and safety incidents.{' '}
                <strong>Falling trend</strong> — corrective actions are having a positive effect.{' '}
                <strong>Flat</strong> — conditions are stable; maintain current monitoring frequency.{' '}
                <strong>Sharp spikes</strong> — usually caused by a single bad prediction entry (e.g. machinery breakdown day or material shortage).
              </>
            }
          >
            <RiskTrendChart data={trends?.riskTrend || []} />
          </ChartSection>

          {/* ── Risk Distribution ────────────────────────────── */}
          <ChartSection
            title="Risk Distribution"
            subtitle="Predictions grouped by risk level"
            explainTitle="Understanding the four risk levels"
            verdict="A portfolio dominated by Low and Medium risk is healthy. Any slice of High or Critical demands immediate project review."
            explainContent={
              <>
                The AI model assigns every prediction a <strong>risk level</strong> based on the predicted risk score (0–100):
                <br />
                <strong style={{ color: '#059669' }}>Low (0–25)</strong> — project is on track; standard monitoring is sufficient.<br />
                <strong style={{ color: '#d97706' }}>Medium (26–50)</strong> — some risk indicators present; schedule a review within the week.<br />
                <strong style={{ color: '#ea580c' }}>High (51–75)</strong> — significant risk; intervention recommended within 24–48 hours.<br />
                <strong style={{ color: '#dc2626' }}>Critical (76–100)</strong> — severe risk; escalate to senior management immediately.
              </>
            }
          >
            <RiskDistributionChart data={dashboard?.riskDistribution || []} />
          </ChartSection>

          {/* ── Delay Categories ─────────────────────────────── */}
          <ChartSection
            title="Delay Categories"
            subtitle="Prediction outcomes — No Delay vs Delay"
            explainTitle="What No Delay vs Delay means"
            verdict="A growing Delay bar signals that your project conditions are deteriorating. Address the top risk factors shown in Feature Importance to reverse the trend."
            explainContent={
              <>
                The AI model makes a binary decision for every prediction: <strong>No Delay</strong> (on track) or <strong>Delay</strong> (at risk of slipping).
                This bar chart counts how many predictions fell into each category during the selected period.
                <br /><br />
                If filtered to a single project, you can see the prediction history for that project specifically — a useful way to track whether corrective actions between predictions are improving the outlook.
              </>
            }
          >
            <DelayProbabilityChart data={trends?.delayTrend || []} />
          </ChartSection>

          {/* ── Feature Importance ───────────────────────────── */}
          <ChartSection
            fullWidth
            title="Feature Importance"
            subtitle="Average signal contributions to the AI model — your projects only"
            explainTitle="Which inputs drive your predictions"
            verdict="Improve the top 2–3 features and re-run predictions. You will see the predicted risk score drop immediately."
            explainContent={
              <>
                This chart shows how much each of the 19 project signals <strong>contributed to the predictions for your projects</strong> during the selected period.
                Unlike the model-wide importance on the Performance page, this reflects your actual input patterns.
                <br /><br />
                <strong>Risk Score</strong> — your existing risk score is the most powerful input; the model amplifies whatever you already know about a project's risk.<br />
                <strong>Material Shortage Alert</strong> — supply disruptions directly halt work and are a leading delay indicator.<br />
                <strong>Cost Deviation</strong> — over-budget projects are almost always behind schedule too.<br />
                <strong>Equipment Utilization Rate</strong> — low utilisation means idle machines and stalled progress.<br />
                <strong>Safety Risk</strong> — the product of safety incidents × risk score; captures compound danger.<br />
                <strong>Worker Productivity</strong> — task progress per worker; low productivity is an early warning of labour issues.<br />
                <strong>Vibration Level</strong> — high vibration can indicate equipment stress or problematic site conditions.
              </>
            }
          >
            <FeatureImportanceChart data={trends?.featureImportance || []} />
          </ChartSection>

          {/* ── Cost & Time Deviation ────────────────────────── */}
          {trends?.costTrend?.length > 0 && (
            <ChartSection
              fullWidth
              title="Cost & Time Deviation Over Time"
              subtitle={`Budget and schedule slippage trends — last ${filters.days} days`}
              explainTitle="Reading the deviation chart"
              verdict="If both lines are rising together, the project is in a classic 'triple constraint' squeeze — time, cost, and scope are all under pressure simultaneously."
              explainContent={
                <>
                  This chart overlays two deviation metrics as separate lines:
                  <br />
                  <strong style={{ color: 'var(--danger-color)' }}>Cost Deviation %</strong> — how far over (positive) or under (negative) budget the project is running. Positive = over budget.<br />
                  <strong style={{ color: 'var(--primary-color)' }}>Time Deviation %</strong> — how far behind (positive) or ahead (negative) of schedule. Positive = behind schedule.
                  <br /><br />
                  Construction projects almost always experience correlated cost and time deviations — when one rises, the other typically follows within days or weeks.
                  Use this chart to spot that correlation early and intervene before costs spiral.
                </>
              }
            >
              <RiskTrendChart
                data={trends.costTrend.map(d => ({
                  _id: d._id,
                  avgRisk: d.avgCostDev,
                  avgProbability: d.avgTimeDev,
                }))}
              />
              <div className="chart-legend" style={{ marginTop: 8, paddingBottom: 8, paddingLeft: 16 }}>
                <div className="legend-item">
                  <span className="legend-line" style={{ background: 'var(--danger-color)' }} />
                  Cost Deviation %
                </div>
                <div className="legend-item">
                  <span className="legend-line" style={{ background: 'var(--primary-color)' }} />
                  Time Deviation %
                </div>
              </div>
            </ChartSection>
          )}

        </div>
      )}
    </MainLayout>
  );
};

export default Analytics;
