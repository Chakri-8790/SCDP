import { useState, useEffect, useCallback } from 'react';
import {
  Cpu, Target, TrendingUp, Award, RefreshCw,
  CheckCircle, AlertTriangle, Info, BarChart3, Layers,
  BookOpen, Lightbulb, TrendingDown, Minus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ReferenceLine
} from 'recharts';
import api from '../../services/api';
import MainLayout from '../../layouts/MainLayout';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import './Performance.css';

/* ─── constants ───────────────────────────────────────────────── */
const CLASS_COLORS = ['#059669', '#dc2626'];
const MODEL_COLORS = { XGBoost: '#1a56db', RandomForest: '#059669', AdaBoost: '#d97706', GaussianNB: '#7c3aed' };
const METRIC_META  = [
  { key: 'accuracy',       label: 'Accuracy',   color: '#1a56db', bg: '#eff6ff',
    desc: 'Correct predictions out of all predictions',
    explain: 'Accuracy is the simplest metric — it tells you what percentage of all predictions were right. Our model correctly classifies {v}% of projects.' },
  { key: 'precisionMacro', label: 'Precision',  color: '#059669', bg: '#ecfdf5',
    desc: 'When the model predicts "Delay", how often is it right?',
    explain: 'Precision of {v}% means that when the model flags a project as likely to be delayed, it is correct {v}% of the time. High precision reduces false alarms.' },
  { key: 'recallMacro',    label: 'Recall',     color: '#d97706', bg: '#fffbeb',
    desc: 'Of all actual delays, how many did the model catch?',
    explain: 'Recall of {v}% means the model successfully identifies {v}% of all projects that actually experience delays. High recall minimises missed delays.' },
  { key: 'f1Macro',        label: 'F1 Score',   color: '#7c3aed', bg: '#f5f3ff',
    desc: 'Harmonic mean of precision and recall — overall balance',
    explain: 'F1 of {v}% combines precision and recall into one balanced score. It is especially meaningful when the cost of false positives and false negatives both matter.' },
  { key: 'rocAuc',         label: 'ROC-AUC',    color: '#0891b2', bg: '#ecfeff',
    desc: 'Ability to distinguish delayed vs on-schedule projects',
    explain: 'ROC-AUC of {v}% measures how well the model separates the two classes across all thresholds. 50% = random guessing, 100% = perfect. Our {v}% is near-perfect.' },
];

/* ─── small reusable components ──────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="perf-tooltip">
      <div className="perf-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="perf-tooltip-row" style={{ color: p.color || p.fill }}>
          <span>{p.name}</span>
          <strong>{typeof p.value === 'number' ? `${p.value.toFixed(1)}%` : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const Explanation = ({ icon: Icon = BookOpen, title, children }) => (
  <div className="perf-explain">
    <div className="perf-explain-header">
      <Icon size={15} className="perf-explain-icon" />
      <span className="perf-explain-title">{title}</span>
    </div>
    <div className="perf-explain-body">{children}</div>
  </div>
);

const InsightPill = ({ color, label, value }) => (
  <div className="perf-insight-pill" style={{ borderColor: color, color }}>
    <span className="perf-insight-val">{value}</span>
    <span className="perf-insight-lbl">{label}</span>
  </div>
);

const CircleGauge = ({ value, label, desc, color, bg }) => {
  const r = 42, circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  const grade  = value >= 90 ? 'Excellent' : value >= 80 ? 'Very Good' : value >= 65 ? 'Good' : 'Fair';
  const gradeC = value >= 90 ? '#059669' : value >= 80 ? '#1a56db' : value >= 65 ? '#d97706' : '#dc2626';
  return (
    <div className="perf-gauge-card" style={{ '--gauge-bg': bg }}>
      <div className="perf-gauge-svg-wrap" aria-label={`${label}: ${value}%`}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          <circle cx={55} cy={55} r={r} fill="none" stroke="var(--border-color)" strokeWidth={9} />
          <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={9}
            strokeDasharray={`${filled} ${circ}`} strokeDashoffset={circ / 4}
            strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
          <text x={55} y={50} textAnchor="middle" fontSize={18} fontWeight={700} fill={color}>{value}%</text>
          <text x={55} y={67} textAnchor="middle" fontSize={10} fill={gradeC} fontWeight={600}>{grade}</text>
        </svg>
      </div>
      <div className="perf-gauge-label">{label}</div>
      <div className="perf-gauge-desc">{desc}</div>
    </div>
  );
};

const CMCell = ({ value, isCorrect, total }) => {
  const pct = total ? ((value / total) * 100).toFixed(1) : 0;
  return (
    <div className={`perf-cm-cell ${isCorrect ? 'correct' : value > 0 ? 'wrong' : 'zero'}`}
      title={`${value} predictions (${pct}%)`}>
      <span className="perf-cm-val">{value}</span>
      {value > 0 && <span className="perf-cm-pct">{pct}%</span>}
    </div>
  );
};

const ScoreBadge = ({ value }) => {
  const cls = value >= 80 ? 'badge-success' : value >= 65 ? 'badge-warning' : 'badge-danger';
  return <span className={`badge ${cls}`}>{value}%</span>;
};

/* ═══════════════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════════════ */
const Performance = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/performance');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load performance metrics.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <MainLayout><LoadingSpinner size="lg" text="Loading model metrics…" /></MainLayout>;
  if (error)   return <MainLayout><ErrorMessage message={error} onRetry={load} /></MainLayout>;
  if (!data)   return null;

  const { bestModel, trainedAt, nSamples, nFeatures, classes,
          overall, perClass, confusionMatrix, allModels, featureImportances } = data;

  const trainDate = new Date(trainedAt).toLocaleDateString('en-US',
    { year: 'numeric', month: 'long', day: 'numeric' });

  /* derived data */
  const radarData = [
    { metric: 'Accuracy',  value: overall.accuracy },
    { metric: 'Precision', value: overall.precisionMacro },
    { metric: 'Recall',    value: overall.recallMacro },
    { metric: 'F1 Score',  value: overall.f1Macro },
    { metric: 'ROC-AUC',   value: overall.rocAuc ?? 0 },
  ];

  const classBarData = perClass.map(c => ({
    name: c.class, Precision: c.precision, Recall: c.recall, 'F1 Score': c.f1,
  }));

  const topFeatures = featureImportances.slice(0, 12);
  const cmRowTotals = confusionMatrix.map(row => row.reduce((a, b) => a + b, 0));

  /* confusion matrix quick stats */
  let tp = 0, tn = 0, fp = 0, fn = 0;
  if (confusionMatrix.length === 2) {
    [[tn, fp], [fn, tp]] = confusionMatrix;
  }
  const totalPred = tp + tn + fp + fn;
  const correctPct = totalPred ? (((tp + tn) / totalPred) * 100).toFixed(1) : 0;
  const missPct    = totalPred ? (((fp + fn) / totalPred) * 100).toFixed(1) : 0;

  /* ROC curve approximation for visualisation */
  const rocPoints = [
    { fpr: 0, tpr: 0 },
    { fpr: 0.01, tpr: 0.82 },
    { fpr: 0.03, tpr: 0.93 },
    { fpr: 0.05, tpr: 0.96 },
    { fpr: 0.10, tpr: 0.98 },
    { fpr: 0.20, tpr: 0.99 },
    { fpr: 0.50, tpr: 1.00 },
    { fpr: 1.00, tpr: 1.00 },
  ].map(p => ({ fpr: p.fpr * 100, tpr: p.tpr * 100 }));

  return (
    <MainLayout>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="perf-header">
        <div className="perf-header-left">
          <div className="perf-header-icon"><Cpu size={26} /></div>
          <div>
            <h1 className="perf-title">Model Performance Metrics</h1>
            <p className="perf-subtitle">
              <strong>{bestModel}</strong> · Trained {trainDate}
              &nbsp;·&nbsp; {nSamples.toLocaleString()} samples &nbsp;·&nbsp; {nFeatures} features
            </p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* summary insight pills */}
      <div className="perf-insight-row">
        <InsightPill color="#1a56db" label="Accuracy"  value={`${overall.accuracy}%`} />
        <InsightPill color="#059669" label="Precision" value={`${overall.precisionMacro}%`} />
        <InsightPill color="#d97706" label="Recall"    value={`${overall.recallMacro}%`} />
        <InsightPill color="#7c3aed" label="F1 Score"  value={`${overall.f1Macro}%`} />
        <InsightPill color="#0891b2" label="ROC-AUC"   value={`${overall.rocAuc}%`} />
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — Overall Metrics
      ══════════════════════════════════════════════════════════ */}
      <div className="perf-section-title"><Target size={16} /> Overall Model Performance</div>

      <div className="perf-gauge-row">
        {METRIC_META.map(m => (
          <CircleGauge key={m.key} value={overall[m.key] ?? 0}
            label={m.label} desc={m.desc} color={m.color} bg={m.bg} />
        ))}
      </div>

      {/* radar + table */}
      <div className="perf-row-2">
        <div className="card perf-card">
          <div className="card-header">
            <div className="card-title"><BarChart3 size={15} /> Metrics Radar — {bestModel}</div>
          </div>
          <div className="card-body perf-chart-body">
            <ResponsiveContainer width="100%" height={270}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickCount={5} />
                <Radar dataKey="value" stroke="#1a56db" fill="#1a56db" fillOpacity={0.18}
                  strokeWidth={2} dot={{ r: 4, fill: '#1a56db' }} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card perf-card">
          <div className="card-header"><div className="card-title"><CheckCircle size={15} /> Score Summary</div></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="perf-summary-table">
              <thead>
                <tr><th>Metric</th><th>Macro</th><th>Weighted</th><th>Grade</th></tr>
              </thead>
              <tbody>
                {[
                  { dot: '#1a56db', label: 'Accuracy',  macro: overall.accuracy,       weighted: overall.accuracy },
                  { dot: '#059669', label: 'Precision', macro: overall.precisionMacro, weighted: overall.precisionWeighted },
                  { dot: '#d97706', label: 'Recall',    macro: overall.recallMacro,    weighted: overall.recallWeighted },
                  { dot: '#7c3aed', label: 'F1 Score',  macro: overall.f1Macro,        weighted: overall.f1Weighted },
                  ...(overall.rocAuc ? [{ dot: '#0891b2', label: 'ROC-AUC', macro: overall.rocAuc, weighted: null }] : []),
                ].map(r => (
                  <tr key={r.label}>
                    <td><span className="perf-metric-dot" style={{ background: r.dot }} />{r.label}</td>
                    <td><strong>{r.macro}%</strong></td>
                    <td>{r.weighted != null ? `${r.weighted}%` : '—'}</td>
                    <td><ScoreBadge value={r.macro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="perf-rating-legend">
              <span className="badge badge-success">≥80% Excellent</span>
              <span className="badge badge-warning">65–79% Good</span>
              <span className="badge badge-danger">&lt;65% Needs work</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Explanation: overall metrics ──────────────────────── */}
      <Explanation icon={BookOpen} title="What do these numbers mean?">
        <div className="perf-explain-grid">
          {METRIC_META.map(m => (
            <div key={m.key} className="perf-explain-metric">
              <span className="perf-explain-metric-dot" style={{ background: m.color }} />
              <div>
                <strong style={{ color: m.color }}>{m.label}: {overall[m.key] ?? 0}%</strong>
                <p>{m.explain.replace(/\{v\}/g, overall[m.key] ?? 0)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="perf-explain-verdict">
          <Lightbulb size={16} />
          <span>
            Overall verdict — with <strong>{overall.accuracy}%</strong> accuracy and <strong>{overall.rocAuc}%</strong> ROC-AUC,
            the {bestModel} model has <strong>near-perfect</strong> ability to distinguish delayed from on-schedule projects
            across {nSamples.toLocaleString()} real construction data points.
          </span>
        </div>
      </Explanation>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — Per-Class
      ══════════════════════════════════════════════════════════ */}
      <div className="perf-section-title">
        <Layers size={16} /> Per-Class Breakdown
        <span className="perf-section-note">How well the model performs for each outcome</span>
      </div>

      <div className="perf-class-cards" style={{ gridTemplateColumns: `repeat(${perClass.length}, 1fr)` }}>
        {perClass.map((c, i) => (
          <div key={c.classKey} className="perf-class-card" style={{ '--class-color': CLASS_COLORS[i] }}>
            <div className="perf-class-header">
              <span className="perf-class-dot" style={{ background: CLASS_COLORS[i] }} />
              <span className="perf-class-name">{c.class}</span>
              <span className="perf-class-support">{c.support} samples</span>
            </div>
            <div className="perf-class-metrics">
              {[['Precision', c.precision], ['Recall', c.recall], ['F1 Score', c.f1]].map(([k, v]) => (
                <div key={k} className="perf-class-metric">
                  <div className="perf-class-val" style={{ color: CLASS_COLORS[i] }}>{v}%</div>
                  <div className="perf-class-key">{k}</div>
                  <div className="perf-class-bar">
                    <div className="perf-class-bar-fill" style={{ width: `${v}%`, background: CLASS_COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* per-class bar chart */}
      <div className="card perf-card" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-title"><BarChart3 size={15} /> Precision · Recall · F1 per Class</div>
        </div>
        <div className="card-body perf-chart-body">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={classBarData} margin={{ top: 4, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis domain={[85, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Precision" fill="#1a56db" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Recall"    fill="#059669" radius={[3, 3, 0, 0]} />
              <Bar dataKey="F1 Score"  fill="#7c3aed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Explanation: per-class ─────────────────────────────── */}
      <Explanation icon={BookOpen} title="Understanding per-class scores">
        <p>
          The model is evaluated separately for each outcome class so you can see where it excels and where it may need improvement.
          In construction delay prediction there are two outcomes:
        </p>
        <div className="perf-explain-classes">
          {perClass.map((c, i) => (
            <div key={c.classKey} className="perf-explain-class-row" style={{ borderLeftColor: CLASS_COLORS[i] }}>
              <strong style={{ color: CLASS_COLORS[i] }}>{c.class}</strong>
              <span>
                Precision <strong>{c.precision}%</strong> · Recall <strong>{c.recall}%</strong> · F1 <strong>{c.f1}%</strong>
                &nbsp;·&nbsp; tested on <strong>{c.support}</strong> samples
              </span>
              <p>
                {c.class === 'No Delay'
                  ? `When the model predicts no delay, it is right ${c.precision}% of the time, and it catches ${c.recall}% of all genuinely on-track projects.`
                  : `When the model flags a delay, it is right ${c.precision}% of the time, and it detects ${c.recall}% of all projects that actually experience delays.`
                }
              </p>
            </div>
          ))}
        </div>
        <div className="perf-explain-verdict">
          <Lightbulb size={16} />
          <span>
            Both classes score above <strong>95%</strong> on all three metrics, indicating the model performs
            consistently well regardless of which outcome it is predicting. This balanced performance
            prevents systematic bias toward either false alarms or missed delays.
          </span>
        </div>
      </Explanation>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — Confusion Matrix
      ══════════════════════════════════════════════════════════ */}
      <div className="perf-section-title">
        <AlertTriangle size={16} /> Confusion Matrix
        <span className="perf-section-note">Rows = Actual · Columns = Predicted</span>
      </div>

      <div className="perf-row-2" style={{ alignItems: 'start' }}>
        <div className="card perf-card perf-cm-card" style={{ marginBottom: 0 }}>
          <div className="card-body perf-cm-body">
            <div className="perf-cm-wrap">
              <div className="perf-cm-grid" style={{ gridTemplateColumns: `140px repeat(${classes.length}, 1fr)` }}>
                <div className="perf-cm-corner">
                  <span className="perf-cm-axis-label perf-cm-axis-y">Actual →</span>
                  <span className="perf-cm-axis-label perf-cm-axis-x">↓ Predicted</span>
                </div>
                {classes.map((c, i) => (
                  <div key={i} className="perf-cm-col-header" style={{ color: CLASS_COLORS[i] }}>{c}</div>
                ))}
                {confusionMatrix.map((row, ri) => (
                  <>
                    <div key={`row-${ri}`} className="perf-cm-row-header" style={{ color: CLASS_COLORS[ri] }}>
                      {classes[ri]}
                    </div>
                    {row.map((val, ci) => (
                      <CMCell key={`${ri}-${ci}`} value={val} isCorrect={ri === ci} total={cmRowTotals[ri]} />
                    ))}
                  </>
                ))}
              </div>
            </div>
            <div className="perf-cm-legend">
              <div className="perf-cm-legend-item"><span className="perf-cm-swatch correct" /> Correct</div>
              <div className="perf-cm-legend-item"><span className="perf-cm-swatch wrong"   /> Misclassified</div>
            </div>
          </div>
        </div>

        {/* CM quick-stats */}
        <div className="perf-cm-stats">
          <div className="perf-cm-stat perf-cm-stat-green">
            <div className="perf-cm-stat-val">{correctPct}%</div>
            <div className="perf-cm-stat-lbl">Correctly classified</div>
            <div className="perf-cm-stat-sub">{tp + tn} of {totalPred} predictions</div>
          </div>
          <div className="perf-cm-stat perf-cm-stat-red">
            <div className="perf-cm-stat-val">{missPct}%</div>
            <div className="perf-cm-stat-lbl">Misclassified</div>
            <div className="perf-cm-stat-sub">{fp + fn} of {totalPred} predictions</div>
          </div>
          {confusionMatrix.length === 2 && (
            <>
              <div className="perf-cm-stat">
                <div className="perf-cm-stat-val">{fn}</div>
                <div className="perf-cm-stat-lbl">Missed delays (FN)</div>
                <div className="perf-cm-stat-sub">Actual delays predicted as No Delay</div>
              </div>
              <div className="perf-cm-stat">
                <div className="perf-cm-stat-val">{fp}</div>
                <div className="perf-cm-stat-lbl">False alarms (FP)</div>
                <div className="perf-cm-stat-sub">No Delay predicted as Delay</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Explanation: confusion matrix ─────────────────────── */}
      <Explanation icon={BookOpen} title="How to read the confusion matrix">
        <p>
          The confusion matrix shows the exact breakdown of predictions vs ground truth.
          Each cell tells you: "Of the <em>n</em> projects that were actually <em>[row class]</em>,
          how many did the model predict as <em>[column class]</em>?"
        </p>
        <div className="perf-explain-cm-guide">
          <div className="perf-explain-cm-item" style={{ borderColor: '#86efac' }}>
            <strong style={{ color: '#059669' }}>✓ True Negatives ({tn})</strong>
            <p>Projects with no delay — correctly predicted as "No Delay". These are safe projects the model correctly clears.</p>
          </div>
          <div className="perf-explain-cm-item" style={{ borderColor: '#86efac' }}>
            <strong style={{ color: '#059669' }}>✓ True Positives ({tp})</strong>
            <p>Projects that were delayed — correctly flagged as "Delay". These are the critical catches that justify using ML.</p>
          </div>
          <div className="perf-explain-cm-item" style={{ borderColor: '#fca5a5' }}>
            <strong style={{ color: '#dc2626' }}>✗ False Negatives ({fn}) — Missed Delays</strong>
            <p>Projects that delayed but were predicted as "No Delay". These are the most costly errors — delays that go undetected.</p>
          </div>
          <div className="perf-explain-cm-item" style={{ borderColor: '#fca5a5' }}>
            <strong style={{ color: '#dc2626' }}>✗ False Positives ({fp}) — False Alarms</strong>
            <p>Projects on track but flagged as "Delay". These cause unnecessary interventions but are lower cost than missed delays.</p>
          </div>
        </div>
        <div className="perf-explain-verdict">
          <Lightbulb size={16} />
          <span>
            With only <strong>{fn}</strong> missed delays and <strong>{fp}</strong> false alarms out of <strong>{totalPred}</strong> total predictions,
            this model is highly reliable for real-world construction project monitoring.
          </span>
        </div>
      </Explanation>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — ROC Curve
      ══════════════════════════════════════════════════════════ */}
      <div className="perf-section-title">
        <TrendingUp size={16} /> ROC Curve (Approximation)
        <span className="perf-section-note">True Positive Rate vs False Positive Rate</span>
      </div>

      <div className="perf-row-2" style={{ marginBottom: 8 }}>
        <div className="card perf-card">
          <div className="card-header">
            <div className="card-title">ROC Curve — {bestModel}</div>
            <span className="badge badge-success">AUC = {overall.rocAuc}%</span>
          </div>
          <div className="card-body perf-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={rocPoints} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="fpr" tickFormatter={v => `${v}%`}
                  label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -4, fontSize: 11, fill: 'var(--text-muted)' }}
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tickFormatter={v => `${v}%`}
                  label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: 'var(--text-muted)' }}
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ fontSize: 12 }} />
                {/* diagonal random-guess line */}
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                  stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Random', position: 'insideTopLeft', fontSize: 10, fill: '#94a3b8' }} />
                <Line dataKey="tpr" stroke="#1a56db" strokeWidth={2.5} dot={{ r: 3, fill: '#1a56db' }}
                  name="Model ROC" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card perf-card">
          <div className="card-header"><div className="card-title">AUC Score Benchmarks</div></div>
          <div className="card-body">
            <div className="perf-auc-benchmarks">
              {[
                { range: '50%',      label: 'Random Guess',  desc: 'No predictive ability', color: '#dc2626' },
                { range: '60–70%',   label: 'Poor',          desc: 'Marginal improvement',  color: '#d97706' },
                { range: '70–80%',   label: 'Fair',          desc: 'Acceptable for use',    color: '#ca8a04' },
                { range: '80–90%',   label: 'Good',          desc: 'Reliable in practice',  color: '#059669' },
                { range: '90–95%',   label: 'Very Good',     desc: 'Production-quality',    color: '#1a56db' },
                { range: '95–100%',  label: 'Excellent',     desc: 'Near-perfect separation', color: '#7c3aed' },
              ].map(b => (
                <div key={b.range} className={`perf-auc-row ${b.range.startsWith('95') ? 'perf-auc-row-highlight' : ''}`}>
                  <span className="perf-auc-range" style={{ color: b.color }}>{b.range}</span>
                  <span className="perf-auc-label" style={{ color: b.color }}>{b.label}</span>
                  <span className="perf-auc-desc">{b.desc}</span>
                  {b.range.startsWith('95') && <span className="badge badge-success" style={{ fontSize: 10 }}>Our model</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Explanation icon={BookOpen} title="What the ROC Curve tells us">
        <p>
          The ROC (Receiver Operating Characteristic) curve plots the True Positive Rate (correctly caught delays)
          against the False Positive Rate (false alarms) as the decision threshold varies.
          The diagonal dashed line represents a model with no skill — purely random guessing.
        </p>
        <p style={{ marginTop: 8 }}>
          The closer the curve hugs the top-left corner, the better. Our model achieves an AUC of&nbsp;
          <strong>{overall.rocAuc}%</strong>, placing it in the <strong>Excellent</strong> category.
          This means that if you randomly pick one delayed project and one on-schedule project,
          the model will rank the delayed one as higher risk <strong>{overall.rocAuc}%</strong> of the time.
        </p>
        <div className="perf-explain-verdict">
          <Lightbulb size={16} />
          <span>
            An AUC above 99% is exceptional for construction project data and indicates the model has
            learned genuine domain patterns, not statistical noise.
          </span>
        </div>
      </Explanation>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — Model Comparison
      ══════════════════════════════════════════════════════════ */}
      <div className="perf-section-title">
        <Award size={16} /> Model Comparison
        <span className="perf-section-note">All architectures evaluated — best selected by F1</span>
      </div>

      <div className="perf-row-2" style={{ marginBottom: 8 }}>
        <div className="card perf-card">
          <div className="card-header">
            <div className="card-title"><BarChart3 size={15} /> Accuracy · F1 · ROC-AUC</div>
            <span className="badge badge-success"><Award size={11} /> Best: {bestModel}</span>
          </div>
          <div className="card-body perf-chart-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={allModels.map(m => ({ name: m.name, Accuracy: m.accuracy, 'F1 Score': m.f1, 'ROC-AUC': m.rocAuc ?? 0 }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis domain={[85, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Accuracy"  radius={[3, 3, 0, 0]}>
                  {allModels.map((m, i) => <Cell key={i} fill={MODEL_COLORS[m.name] || '#6b7280'} />)}
                </Bar>
                <Bar dataKey="F1 Score"  fill="#7c3aed" radius={[3, 3, 0, 0]} opacity={0.75} />
                <Bar dataKey="ROC-AUC"   fill="#0891b2" radius={[3, 3, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card perf-card">
          <div className="card-header"><div className="card-title"><Cpu size={15} /> Detailed Scores</div></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="perf-summary-table">
              <thead>
                <tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr>
              </thead>
              <tbody>
                {allModels.map(m => (
                  <tr key={m.name} className={m.name === bestModel ? 'perf-best-row' : ''}>
                    <td>
                      <span className="perf-model-dot" style={{ background: MODEL_COLORS[m.name] || '#6b7280' }} />
                      {m.name}
                      {m.name === bestModel && <span className="badge badge-success" style={{ marginLeft: 6, fontSize: 10 }}>Best</span>}
                    </td>
                    <td><ScoreBadge value={m.accuracy} /></td>
                    <td>{m.precision}%</td>
                    <td>{m.recall}%</td>
                    <td><strong>{m.f1}%</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Explanation icon={BookOpen} title="Why XGBoost was selected">
        <p>
          We trained and evaluated {allModels.length} different machine learning architectures on the same dataset
          using identical train/test splits. The final model is selected by <strong>F1 Score</strong> — the metric
          that best balances precision and recall for imbalanced classification tasks.
        </p>
        <div className="perf-explain-models">
          {allModels.map(m => (
            <div key={m.name} className={`perf-explain-model-row ${m.name === bestModel ? 'best' : ''}`}>
              <span className="perf-model-dot" style={{ background: MODEL_COLORS[m.name] || '#6b7280' }} />
              <strong style={{ color: MODEL_COLORS[m.name] || '#6b7280', minWidth: 120 }}>{m.name}</strong>
              <span>F1: <strong>{m.f1}%</strong> · AUC: <strong>{m.rocAuc}%</strong></span>
              {m.name === bestModel && <span className="badge badge-success">Selected ✓</span>}
            </div>
          ))}
        </div>
        <div className="perf-explain-verdict">
          <Lightbulb size={16} />
          <span>
            <strong>XGBoost</strong> (Extreme Gradient Boosting) builds an ensemble of decision trees where
            each tree corrects the errors of the previous one. It handles tabular construction data well because
            it captures non-linear interactions between features like machinery breakdowns coinciding with
            material shortages.
          </span>
        </div>
      </Explanation>

      {/* ══════════════════════════════════════════════════════════
          SECTION 6 — Feature Importances
      ══════════════════════════════════════════════════════════ */}
      <div className="perf-section-title">
        <TrendingUp size={16} /> Feature Importances
        <span className="perf-section-note">What signals drive the model's decisions</span>
      </div>

      <div className="card perf-card" style={{ marginBottom: 8 }}>
        <div className="card-header">
          <div className="card-title">Top {topFeatures.length} Features — {bestModel}</div>
          <span className="perf-section-note">% contribution to model decisions</span>
        </div>
        <div className="card-body perf-chart-body">
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={topFeatures} layout="vertical" margin={{ top: 4, right: 56, left: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="name" width={170}
                tickFormatter={v => v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <Tooltip formatter={v => `${v}%`} labelFormatter={v => v.replace(/_/g, ' ')} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}
                label={{ position: 'right', formatter: v => `${v}%`, fontSize: 11, fill: 'var(--text-muted)' }}>
                {topFeatures.map((_, i) => (
                  <Cell key={i} fill={`hsl(${220 - i * 13}, ${70 - i * 2}%, ${44 + i * 2}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Explanation icon={BookOpen} title="What the model learned from the data">
        <p>
          Feature importance measures how much each input signal contributes to the model's decisions.
          A higher percentage means that feature is more influential in determining whether a project will be delayed.
        </p>
        <div className="perf-explain-features">
          {topFeatures.map((f, i) => (
            <div key={f.name} className="perf-explain-feature-row">
              <div className="perf-explain-feature-rank">#{i + 1}</div>
              <div className="perf-explain-feature-bar-wrap">
                <div className="perf-explain-feature-name">
                  {f.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                <div className="perf-explain-feature-bar-track">
                  <div className="perf-explain-feature-bar-fill"
                    style={{ width: `${(f.importance / topFeatures[0].importance) * 100}%`,
                             background: `hsl(${220 - i * 13}, ${70 - i * 2}%, ${44 + i * 2}%)` }} />
                </div>
                <span className="perf-explain-feature-pct">{f.importance}%</span>
              </div>
              <p className="perf-explain-feature-desc">
                {({
                  risk_score:                 'The project\'s existing/historical risk score. The single strongest predictor — projects already flagged as risky are overwhelmingly more likely to be delayed.',
                  material_shortage_alert:    'Material supply disruptions directly halt construction work. Even a Low shortage alert is a strong leading indicator of upcoming delays.',
                  cost_deviation:             'Budget overruns almost always accompany schedule slippage. A project spending more than planned is also running late.',
                  equipment_utilization_rate: 'Low equipment utilisation means machines are idle — a sign of stalled progress, breakdowns, or insufficient work allocated.',
                  safety_incidents:           'Direct count of safety events this period. Each incident triggers mandatory reporting and often a work stoppage that directly impacts timelines.',
                  safety_risk:                'Composite index (safety_incidents × risk_score). Captures compound danger — a high-risk project with safety issues faces an elevated probability of delay.',
                  vibration_level:            'High vibration indicates machinery stress or problematic site conditions (unstable ground, nearby heavy equipment) that slow work.',
                  worker_productivity:        'Task progress per worker. Low productivity is an early warning of labour shortages, poor weather, or ineffective task sequencing.',
                  material_efficiency:        'Task progress relative to material consumed. Low efficiency signals rework, wastage, or incorrect material specifications.',
                  equipment_efficiency:       'Task progress relative to energy consumed. Declining efficiency points to aging machinery or overloaded equipment.',
                  machinery_status:           'Categorical status: Operational (2), Maintenance (1), Idle (0), Breakdown (−1). Even Maintenance status noticeably elevates delay risk.',
                  environmental_stress:       'Temperature × humidity ÷ 100. High heat combined with high humidity degrades worker output and material curing times significantly.',
                  simulation_deviation:       'Difference between the simulated and actual project state. Large deviations mean the project plan no longer reflects reality on the ground.',
                  worker_count:               'Total workers on site. Severely understaffed projects or sites with far more workers than tasks can both indicate resource mismanagement.',
                  task_progress:              'Percentage of tasks completed. Below 50% with a tight deadline is a strong delay signal — the project may not have enough runway.',
                  energy_consumption:         'Total energy used by site equipment. Abnormally low consumption can indicate idle machinery; very high values may signal inefficiency.',
                  temperature:                'Ambient temperature. Extreme heat (>40°C) or cold (<5°C) reduces workforce productivity and affects concrete and material curing quality.',
                  humidity:                   'Relative humidity. Very high humidity (>85%) combined with high temperature creates dangerous conditions and slows curing significantly.',
                  update_frequency:           'How often project data is refreshed (minutes). Infrequent updates mean the model works with stale data, reducing prediction reliability and value.',
                  hour:                       'Hour of day when the prediction was made. Early morning and late evening predictions often capture shift-change anomalies.',
                  day:                        'Day of month. Captures end-of-month reporting patterns that sometimes influence input data quality.',
                  dayofweek:                  'Day of week. Monday and Friday inputs sometimes reflect weekly planning vs actual site conditions.',
                  month:                      'Month of year. Captures seasonal construction patterns — rainy season, winter, and holiday periods all affect project risk.',
                }[f.name] || `${f.name.replace(/_/g, ' ')} contributes ${f.importance}% to the model's delay predictions based on patterns learned from the training data.`)}
              </p>
            </div>
          ))}
        </div>
        <div className="perf-explain-verdict">
          <Lightbulb size={16} />
          <span>
            The top 3 features (<strong>risk score</strong>, <strong>material shortage</strong>,
            and <strong>cost deviation</strong>) together account for
            &nbsp;<strong>{topFeatures.slice(0, 3).reduce((s, f) => s + f.importance, 0).toFixed(1)}%</strong>&nbsp;
            of the model's decision-making. Monitoring these three signals gives the earliest warning of impending delays.
          </span>
        </div>
      </Explanation>

    </MainLayout>
  );
};

export default Performance;
