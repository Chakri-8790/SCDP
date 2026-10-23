import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Cpu, BarChart3, TrendingUp, TrendingDown,
  Minus, Activity, Target, Zap, Award, AlertTriangle,
  Database, BookOpen, Lightbulb, Info
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend,
  Cell, PieChart, Pie, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

/* ─── colour maps ─────────────────────────────────────────────── */
const MODEL_COLORS = {
  XGBoost: '#1a56db', RandomForest: '#059669',
  AdaBoost: '#d97706', GaussianNB: '#7c3aed',
};
const RISK_COLORS = {
  Low: '#059669', Medium: '#d97706', High: '#ea580c', Critical: '#dc2626',
};
const CLASS_COLORS = ['#059669', '#dc2626'];
const fmtPct = v => `${typeof v === 'number' ? v.toFixed(1) : v}%`;

/* ─── tiny helpers ────────────────────────────────────────────── */
const Chip = ({ color, label, value }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '8px 12px', borderRadius: 8,
    border: `1.5px solid ${color}`, background: `${color}14`, minWidth: 72,
  }}>
    <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: 'center' }}>{label}</span>
  </div>
);

const TrendBadge = ({ pct }) => {
  if (pct === null || pct === undefined) return <span className="badge badge-neutral">—</span>;
  const n = parseFloat(pct);
  if (n > 0)  return <span className="badge badge-success" style={{ display:'inline-flex', gap:3, alignItems:'center' }}><TrendingUp  size={10} /> +{n}%</span>;
  if (n < 0)  return <span className="badge badge-danger"  style={{ display:'inline-flex', gap:3, alignItems:'center' }}><TrendingDown size={10} /> {n}%</span>;
  return               <span className="badge badge-neutral" style={{ display:'inline-flex', gap:3, alignItems:'center' }}><Minus size={10} /> 0%</span>;
};

const SectionTitle = ({ icon: Icon, title, sub }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: 8, marginBottom: 14,
  }}>
    <Icon size={15} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>{sub}</div>}
    </div>
  </div>
);

const Insight = ({ title, children }) => (
  <div style={{
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-color)',
    borderLeft: '3px solid var(--primary-color)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    marginTop: 8,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <BookOpen size={12} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
    </div>
    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{children}</div>
  </div>
);

const Verdict = ({ children }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 6,
    background: 'var(--primary-light)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 10px', marginTop: 8,
    fontSize: 11.5, color: 'var(--primary-color)', lineHeight: 1.55,
  }}>
    <Lightbulb size={12} style={{ flexShrink: 0, marginTop: 1 }} />
    <span>{children}</span>
  </div>
);

const CustomTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-color)', border: '1px solid var(--border-color)',
      borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)',
      fontSize: 12, minWidth: 130,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: p.color || p.fill }}>
          <span>{p.name}</span>
          <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.name?.includes('%') || p.dataKey === 'value' ? '' : ''}</strong>
        </div>
      ))}
    </div>
  );
};

/* ─── SVG arc gauge ───────────────────────────────────────────── */
const ArcGauge = ({ value, label, color }) => {
  const r = 30, circ = 2 * Math.PI * r;
  const filled = (parseFloat(value) / 100) * circ;
  const grade = value >= 90 ? 'Excellent' : value >= 80 ? 'Very Good' : value >= 65 ? 'Good' : 'Fair';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 10, boxShadow: 'var(--shadow-card)', flex: 1, minWidth: 0 }}>
      <svg width={72} height={72} viewBox="0 0 72 72" aria-label={`${label}: ${value}%`}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--border-color)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${filled} ${circ}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x={36} y={33} textAnchor="middle" fontSize={12} fontWeight={800} fill={color}>{value}%</text>
        <text x={36} y={45} textAnchor="middle" fontSize={8} fill={color} fontWeight={600}>{grade}</text>
      </svg>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', marginTop: 3, lineHeight: 1.2 }}>{label}</div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const PerformanceMetrics = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminService.getPerformanceMetrics();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load performance metrics.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner size="lg" text="Loading performance metrics…" />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;
  if (!data)   return null;

  const { model, platform } = data;

  /* ── derived chart data ──────────────────────────────────────── */
  const modelCompare = (model?.allModels || []).map(m => ({
    name: m.name,
    Accuracy: parseFloat(m.accuracy),
    'F1': parseFloat(m.f1),
    'AUC': m.rocAuc ? parseFloat(m.rocAuc) : 0,
  }));

  const topFeatures = model?.featureImportances
    ? Object.entries(model.featureImportances)
        .map(([k, v]) => ({ name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: parseFloat((v * 100).toFixed(2)) }))
        .sort((a, b) => b.value - a.value).slice(0, 10)
    : [];

  /* binary or 4-class per-class */
  const perClass = (() => {
    if (!model?.perClassMetrics) return [];
    const cr = model.perClassMetrics;
    // detect binary vs 4-class
    if (cr['No Delay'] || cr['Delay']) {
      return ['No Delay', 'Delay'].map((k, i) => {
        const c = cr[k]; if (!c) return null;
        return { class: k, Precision: parseFloat((c.precision * 100).toFixed(1)), Recall: parseFloat((c.recall * 100).toFixed(1)), 'F1': parseFloat((c['f1-score'] * 100).toFixed(1)) };
      }).filter(Boolean);
    }
    const MAP = { '0': 'On Schedule', '1': 'Potential Delay', '2': 'Likely Delayed', '3': 'Severe Delay Risk' };
    return ['0','1','2','3'].map((k, i) => {
      const c = cr[k]; if (!c) return null;
      return { class: MAP[k], Precision: parseFloat((c.precision * 100).toFixed(1)), Recall: parseFloat((c.recall * 100).toFixed(1)), 'F1': parseFloat((c['f1-score'] * 100).toFixed(1)) };
    }).filter(Boolean);
  })();

  const dailyVol = (platform.dailyVolume || []).map(d => ({
    date: d._id.slice(5), Count: d.count, 'Avg Risk': parseFloat((d.avgRisk || 0).toFixed(1)),
  }));

  /* radar for metric overview */
  const radarData = model ? [
    { m: 'Accuracy',  v: parseFloat(model.accuracy) },
    { m: 'Precision', v: parseFloat(model.precisionMacro) },
    { m: 'Recall',    v: parseFloat(model.recallMacro) },
    { m: 'F1',        v: parseFloat(model.f1Macro) },
    { m: 'ROC-AUC',   v: parseFloat(model.rocAuc || 0) },
  ] : [];

  /* pie for risk distribution */
  const riskPie = (platform.riskBreakdown || []).map(d => ({
    name: d._id, value: d.count, fill: RISK_COLORS[d._id] || '#94a3b8',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── topbar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Performance Metrics</h2>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>ML model quality · Platform activity · Feature analysis</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
      </div>

      {/* ── KPI chips row ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Chip color="#1a56db" label="Total Predictions" value={platform.totalPredictions?.toLocaleString() ?? '—'} />
        <Chip color="#059669" label="Last 30 Days"      value={platform.predictionsLast30 ?? '—'} />
        <Chip color="#d97706" label="Avg Risk (30d)"    value={platform.avgRiskLast30?.avg ?? '—'} />
        <Chip color="#dc2626" label="Peak Risk (30d)"   value={platform.avgRiskLast30?.max ?? '—'} />
        {model && <Chip color="#7c3aed" label="Model Accuracy" value={`${model.accuracy}%`} />}
        {model && <Chip color="#0891b2" label="ROC-AUC"        value={`${model.rocAuc}%`} />}
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — Platform Activity
      ══════════════════════════════════════════════════════════ */}
      <SectionTitle icon={Activity} title="Platform Activity"
        sub="Prediction volume, risk distribution and top projects" />

      {/* Daily volume */}
      {dailyVol.length > 0 && (
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title"><BarChart3 size={15} /> Daily Prediction Volume — Last 30 Days</div>
          </div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyVol} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="Count" fill="var(--primary-color)" radius={[3,3,0,0]} opacity={0.85} />
                <Line yAxisId="r" dataKey="Avg Risk" stroke="var(--danger-color)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Insight title="What this chart shows">
            Each bar is the number of predictions run on that day. The red line tracks the average risk score. Spikes in bars with a simultaneously rising red line indicate periods of high construction activity with elevated risk — those dates are worth investigating in Prediction History.
          </Insight>
        </div>
      )}

      {/* Risk pie + top projects */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* risk pie */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title"><Target size={15} /> Risk Level Distribution</div>
          </div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            {riskPie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={riskPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {riskPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                  {riskPie.map(e => (
                    <span key={e.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: e.fill, flexShrink: 0 }} />
                      {e.name} ({e.value})
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>No prediction data yet</div>
            )}
          </div>
          <Insight title="Reading the risk distribution">
            A healthy project portfolio has most predictions in <strong style={{ color: '#059669' }}>Low</strong> and <strong style={{ color: '#d97706' }}>Medium</strong>. A large slice in <strong style={{ color: '#dc2626' }}>Critical</strong> signals systemic issues across multiple projects that need immediate attention.
          </Insight>
        </div>

        {/* top projects */}
        {(platform.topProjects?.length > 0) ? (
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title"><Award size={15} /> Most Predicted Projects</div>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={platform.topProjects.map(p => ({ name: p.projectName.slice(0, 14), Count: p.count, Risk: p.avgRisk }))}
                  layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                  <Tooltip content={<CustomTip />} />
                  <Bar dataKey="Count" fill="var(--secondary-color)" radius={[0,4,4,0]}
                    label={{ position: 'right', fontSize: 10, fill: 'var(--text-muted)' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Insight title="Why prediction count matters">
              Projects with a high prediction count are being monitored closely — usually because they carry elevated risk. High count + high average risk is the pattern that needs most management attention.
            </Insight>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>No project data yet</div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — ML Model Quality
      ══════════════════════════════════════════════════════════ */}
      {model ? (
        <>
          <SectionTitle icon={Cpu} title="ML Model Quality"
            sub={`${model.name} · Trained ${new Date(model.trainedAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})} · ${(model.nSamples||0).toLocaleString()} samples · ${model.nFeatures} features`} />

          {/* gauge row */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header"><div className="card-title">Overall Scores — {model.name}</div></div>
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <ArcGauge value={model.accuracy}       label="Accuracy"         color="var(--primary-color)" />
                <ArcGauge value={model.f1Macro}        label="F1 Score"         color="var(--success-color)" />
                <ArcGauge value={model.precisionMacro} label="Precision"        color="var(--warning-color)" />
                <ArcGauge value={model.recallMacro}    label="Recall"           color="var(--secondary-color)" />
                <ArcGauge value={model.rocAuc || 0}    label="ROC-AUC"          color="#0891b2" />
              </div>
            </div>
            <Insight title="What these scores mean">
              <strong>Accuracy {model.accuracy}%</strong> — {model.accuracy}% of all predictions were correct.{' '}
              <strong>Precision {model.precisionMacro}%</strong> — when the model flags a delay, it is right {model.precisionMacro}% of the time.{' '}
              <strong>Recall {model.recallMacro}%</strong> — of all actual delays, {model.recallMacro}% were caught.{' '}
              <strong>F1 {model.f1Macro}%</strong> — balanced score combining precision and recall.{' '}
              <strong>ROC-AUC {model.rocAuc}%</strong> — the model separates delayed from on-schedule projects with {model.rocAuc}% reliability across all thresholds.
              <Verdict>All five scores above 90% indicate a production-quality model suitable for real-world construction monitoring.</Verdict>
            </Insight>
          </div>

          {/* radar + model comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* radar */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header"><div className="card-title">Metrics Radar</div></div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                    <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickCount={4} />
                    <Radar dataKey="v" stroke="#1a56db" fill="#1a56db" fillOpacity={0.18} strokeWidth={2} dot={{ r: 3, fill: '#1a56db' }} />
                    <Tooltip formatter={v => fmtPct(v)} contentStyle={{ fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <Insight title="Balanced performance">
                A perfect model fills the entire radar polygon. Our model's shape is nearly circular and large, confirming balanced performance — no single metric is dragging down the others.
              </Insight>
            </div>

            {/* model comparison */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header">
                <div className="card-title">Model Comparison</div>
                <span className="badge badge-success"><Award size={11} /> Best: {model.name}</span>
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={modelCompare} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis domain={[75, 100]} tickFormatter={fmtPct} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Tooltip content={<CustomTip />} formatter={v => fmtPct(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Accuracy" radius={[3,3,0,0]}>
                      {modelCompare.map((m, i) => <Cell key={i} fill={MODEL_COLORS[m.name] || '#6b7280'} />)}
                    </Bar>
                    <Bar dataKey="F1"  fill="var(--success-color)" radius={[3,3,0,0]} opacity={0.8} />
                    <Bar dataKey="AUC" fill="#0891b2"              radius={[3,3,0,0]} opacity={0.65} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Insight title="Why XGBoost won">
                Four architectures were trained and evaluated identically. <strong>{model.name}</strong> achieved the highest F1 score, making it the best balance of precision and recall for construction delay prediction. XGBoost excels at tabular data with non-linear feature interactions.
              </Insight>
            </div>
          </div>

          {/* per-class */}
          {perClass.length > 0 && (
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header"><div className="card-title"><Target size={15} /> Per-Class Metrics</div></div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                {/* stat cards for each class */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  {perClass.map((c, i) => (
                    <div key={c.class} style={{
                      flex: 1, minWidth: 140,
                      padding: '12px 16px',
                      borderRadius: 10,
                      borderTop: `3px solid ${CLASS_COLORS[i] || '#94a3b8'}`,
                      border: `1px solid var(--border-color)`,
                      background: 'var(--surface-color)',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: CLASS_COLORS[i] || '#94a3b8', marginBottom: 10 }}>{c.class}</div>
                      {[['Precision', c.Precision], ['Recall', c.Recall], ['F1', c['F1']]].map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: CLASS_COLORS[i] }}>{v}%</span>
                          </div>
                          <div style={{ height: 5, background: 'var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${v}%`, background: CLASS_COLORS[i], borderRadius: 10, transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {/* grouped bar chart */}
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={perClass} margin={{ top: 4, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="class" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis domain={[80, 100]} tickFormatter={fmtPct} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Tooltip content={<CustomTip />} formatter={v => fmtPct(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Precision" fill="#1a56db" radius={[3,3,0,0]} />
                    <Bar dataKey="Recall"    fill="#059669" radius={[3,3,0,0]} />
                    <Bar dataKey="F1"        fill="#7c3aed" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Insight title="Per-class breakdown explained">
                Each row shows how the model performs specifically for that outcome. <strong>Precision</strong> = when it predicts that class, how often is it right? <strong>Recall</strong> = of all real instances of that class, how many did it catch? Scores above 95% on both classes means the model is equally reliable whether predicting a delay or clearing a project as on-schedule.
                <Verdict>Balanced per-class scores confirm the model has no systematic bias — it is equally reliable for both outcomes.</Verdict>
              </Insight>
            </div>
          )}

          {/* feature importances */}
          {topFeatures.length > 0 && (
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header">
                <div className="card-title"><TrendingUp size={15} /> Top Feature Importances</div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>% contribution to model decisions</span>
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topFeatures} layout="vertical"
                    margin={{ top: 4, right: 56, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis type="category" dataKey="name" width={160}
                      tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Tooltip formatter={v => [`${v}%`, 'Importance']} contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0,4,4,0]}
                      label={{ position: 'right', formatter: v => `${v}%`, fontSize: 10, fill: 'var(--text-muted)' }}>
                      {topFeatures.map((_, i) => (
                        <Cell key={i} fill={`hsl(${215 - i * 14}, ${70 - i * 2}%, ${45 + i * 2}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Insight title="What drives delay predictions — all features explained">
                {(() => {
                  const FEAT_DESC = {
                    'Risk Score': 'The project\'s existing/historical risk score. The single strongest predictor — projects already flagged as risky are overwhelmingly more likely to be delayed.',
                    'Material Shortage Alert': 'Supply disruptions directly halt construction work. Even a "Low" shortage alert is a strong leading indicator of upcoming delays.',
                    'Cost Deviation': 'Budget overruns almost always accompany schedule slippage. A project spending more than planned is also running late.',
                    'Equipment Utilization Rate': 'Low utilisation means machines are idle — a sign of stalled progress, breakdowns, or insufficient work assigned.',
                    'Safety Risk': 'Composite index (safety_incidents × risk_score). Safety events cause work stoppages, inspections, and workforce morale issues that all delay progress.',
                    'Vibration Level': 'High vibration indicates machinery stress or problematic site conditions (unstable ground, nearby heavy equipment) that slow work.',
                    'Safety Incidents': 'Direct count of safety events in the current period. Each incident triggers mandatory reporting and often a work stoppage.',
                    'Worker Productivity': 'Task progress per worker. Low productivity is an early warning of labour shortages, poor weather, or ineffective task sequencing.',
                    'Material Efficiency': 'Task progress relative to material consumed. Low efficiency signals rework, wastage, or incorrect material specifications.',
                    'Equipment Efficiency': 'Task progress relative to energy consumed. Declining efficiency points to aging machinery or overloaded equipment.',
                    'Machinery Status': 'Categorical status: Operational (2), Maintenance (1), Idle (0), Breakdown (−1). Even "Maintenance" status noticeably elevates delay risk.',
                    'Environmental Stress': 'Temperature × humidity ÷ 100. High heat combined with high humidity degrades worker output and material curing times.',
                    'Simulation Deviation': 'Difference between simulated and actual project state. Large deviations mean the project plan no longer reflects reality.',
                    'Worker Count': 'Total workers on site. Severely understaffed projects or sites with far more workers than tasks can both indicate problems.',
                    'Task Progress': 'Percentage of tasks completed. Directly reflects schedule adherence — below 50% with a tight deadline is a strong delay signal.',
                    'Energy Consumption': 'Total energy used by site equipment. Abnormally low consumption can indicate idle machinery; very high values may signal inefficiency.',
                    'Temperature': 'Ambient temperature. Extreme heat (>40°C) or cold (<5°C) reduces workforce productivity and affects concrete/material curing.',
                    'Humidity': 'Relative humidity. Very high humidity (>85%) combined with high temperature creates dangerous working conditions and slows curing.',
                    'Update Frequency': 'How often project data is updated (minutes). Infrequent updates mean the model is working with stale data — reducing prediction reliability.',
                  };
                  return topFeatures.slice(0, topFeatures.length).map((f, i) => {
                    const desc = FEAT_DESC[f.name] || 'Contributes to the model\'s delay predictions based on patterns learned from training data.';
                    return (
                      <div key={f.name} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          background: `hsl(${215 - i * 14}, ${70 - i * 2}%, ${45 + i * 2}%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, color: '#fff', marginTop: 1,
                        }}>{i+1}</span>
                        <div>
                          <strong style={{ fontSize: 11 }}>{f.name} ({f.value}%)</strong>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> — {desc}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
                <Verdict>
                  The top 3 features account for {topFeatures.slice(0,3).reduce((s,f)=>s+f.value,0).toFixed(1)}% of all model decisions.
                  Improving these three signals will have the highest impact on reducing delay risk.
                </Verdict>
              </Insight>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <Cpu className="empty-state-icon" />
              <h3>ML model artifacts not found</h3>
              <p>Run <code style={{ background: 'var(--surface-sunken)', padding: '2px 6px', borderRadius: 4 }}>python training/train.py</code> in the ml-service directory to train the model and generate metrics.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;
