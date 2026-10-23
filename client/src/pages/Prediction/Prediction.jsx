import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Cloud, Cpu, Package, TrendingUp, ShieldAlert, ChevronDown, ChevronUp,
  Zap, RotateCcw, CheckCircle, Info, BookOpen, Lightbulb, AlertTriangle,
  CheckSquare, Square, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { projectService } from '../../services/projectService';
import { predictionService } from '../../services/predictionService';
import MainLayout from '../../layouts/MainLayout';
import Button from '../../components/Button/Button';
import LoadingSpinner, { LoadingSteps } from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import RecommendationCard from '../../components/RecommendationCard/RecommendationCard';
import FeatureImportanceChart from '../../components/charts/FeatureImportanceChart';
import { featureDisplayName, getRiskClass } from '../../utils/helpers';
import { DEMO_SCENARIOS } from '../../utils/demoData';
import '../../styles/forms.css';
import '../../styles/cards.css';
import './Prediction.css';

/* ── action checklists per risk level ─────────────────────────── */
const ACTIONS = {
  Low: [
    { text: 'Continue routine monitoring — no immediate action required' },
    { text: 'Log this prediction for trend tracking' },
    { text: 'Review next scheduled update to ensure metrics stay stable' },
  ],
  Medium: [
    { text: 'Schedule a project review meeting within the next 3–5 days' },
    { text: 'Inspect material inventory and reorder if needed' },
    { text: 'Confirm equipment maintenance schedule is on track' },
    { text: 'Brief site manager on elevated risk indicators' },
  ],
  High: [
    { text: 'Convene urgent project steering meeting within 24–48 hours' },
    { text: 'Activate contingency resource plan (extra workers / equipment)' },
    { text: 'Negotiate emergency material procurement with suppliers' },
    { text: 'Review and compress critical path activities' },
    { text: 'Notify project stakeholders of revised timeline risk' },
  ],
  Critical: [
    { text: 'Escalate immediately to senior management and client' },
    { text: 'Halt non-critical work and redirect all resources to critical path' },
    { text: 'Conduct full site safety audit — stop unsafe activities' },
    { text: 'Issue formal delay notice per contract terms' },
    { text: 'Engage crisis resource pool for emergency procurement' },
    { text: 'Update project schedule and re-baseline with stakeholders' },
  ],
};

/* ── generate interpretation text from prediction values ─────── */
function buildInterpretation(result, inputRiskScore) {
  const { delayPrediction, delayProbability, predictedRiskScore, riskLevel, confidence, majorRiskFactors } = result;
  const topFactor = majorRiskFactors?.[0]?.displayName || 'risk score';
  const secondFactor = majorRiskFactors?.[1]?.displayName || 'cost deviation';
  const isDelay = delayPrediction === 'Delay' || delayProbability > 50;

  if (riskLevel === 'Low') {
    return `The model is ${confidence}% confident this project is currently <strong>on track</strong>. 
    The predicted risk score of <strong>${predictedRiskScore}/100</strong> is well within the safe zone. 
    The primary influencing factor is <strong>${topFactor}</strong>. 
    Continue standard monitoring — no intervention is required at this time.`;
  }
  if (riskLevel === 'Medium') {
    return `There is a <strong>${delayProbability}%</strong> probability of delay with a predicted risk score of <strong>${predictedRiskScore}/100</strong>. 
    The model is <strong>${confidence}%</strong> confident in this assessment. 
    The top contributing factors are <strong>${topFactor}</strong> and <strong>${secondFactor}</strong>. 
    Proactive attention to these signals now can prevent escalation to a high-risk scenario.`;
  }
  if (riskLevel === 'High') {
    return `This project is at <strong>high risk</strong> of delay — the model assigns a <strong>${delayProbability}%</strong> delay probability 
    with <strong>${confidence}%</strong> confidence. The predicted risk score has risen to <strong>${predictedRiskScore}/100</strong>, 
    significantly above the input score of <strong>${inputRiskScore}/100</strong>. 
    <strong>${topFactor}</strong> is the dominant driver. Immediate intervention is recommended before the situation becomes critical.`;
  }
  return `⚠ <strong>Critical alert</strong> — the model predicts an <strong>${delayProbability}%</strong> probability of severe delay 
  with <strong>${confidence}%</strong> confidence. The predicted risk score of <strong>${predictedRiskScore}/100</strong> 
  is ${predictedRiskScore - inputRiskScore > 0 ? `${predictedRiskScore - inputRiskScore} points above` : 'at'} the input risk score. 
  <strong>${topFactor}</strong> and <strong>${secondFactor}</strong> are critically elevated. 
  Executive-level intervention is required immediately.`;
}

/* ── PredictionInsights component ────────────────────────────── */
const PredictionInsights = ({ result, inputRiskScore }) => {
  const { predictedRiskScore, riskLevel, delayProbability, classProbabilities, majorRiskFactors } = result;
  const riskCls   = getRiskClass(riskLevel);
  const riskColor = { low: '#059669', medium: '#d97706', high: '#ea580c', critical: '#dc2626' }[riskCls] || '#94a3b8';
  const actions   = ACTIONS[riskLevel] || ACTIONS.Medium;

  // SVG gauge values
  const r = 48, circ = 2 * Math.PI * r;
  const filled = (predictedRiskScore / 100) * circ;

  // probability bar data
  const noDelayPct = classProbabilities?.['No Delay'] ?? (100 - delayProbability);
  const delayPct   = classProbabilities?.['Delay']    ?? delayProbability;

  // top 5 factors for mini chart
  const topFactors = (majorRiskFactors || []).slice(0, 5).map(f => ({
    name:  f.displayName || featureDisplayName(f.feature),
    value: parseFloat(f.importance),
  }));

  const interpretation = buildInterpretation(result, inputRiskScore);

  return (
    <>
      {/* ── Risk Dial + Probability Bar ─────────────────────── */}
      <div className="card pred-insights-card">
        <div className="card-header">
          <div className="card-title"><BookOpen size={15} /> Analysis Insights</div>
        </div>
        <div className="card-body pred-insights-body">

          {/* risk dial */}
          <div className="pred-dial-wrap">
            <svg width={130} height={130} viewBox="0 0 130 130" aria-label={`Risk score: ${predictedRiskScore}`}>
              <circle cx={65} cy={65} r={r} fill="none" stroke="var(--border-color)" strokeWidth={10} />
              <circle cx={65} cy={65} r={r} fill="none" stroke={riskColor} strokeWidth={10}
                strokeDasharray={`${filled} ${circ}`} strokeDashoffset={circ / 4}
                strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
              <text x={65} y={58} textAnchor="middle" fontSize={26} fontWeight={800} fill={riskColor}>{predictedRiskScore}</text>
              <text x={65} y={74} textAnchor="middle" fontSize={10} fill="var(--text-muted)" fontWeight={500}>/100</text>
              <text x={65} y={90} textAnchor="middle" fontSize={11} fill={riskColor} fontWeight={700}>{riskLevel} Risk</text>
            </svg>
            <div className="pred-dial-label">Predicted Risk Score</div>
          </div>

          {/* probability split */}
          <div className="pred-prob-wrap">
            <div className="pred-prob-label">
              <span>Delay Probability Breakdown</span>
            </div>
            <div className="pred-prob-bar-track">
              <div className="pred-prob-bar-no-delay" style={{ width: `${noDelayPct}%` }}>
                {noDelayPct > 15 && <span>{noDelayPct.toFixed(1)}%</span>}
              </div>
              <div className="pred-prob-bar-delay" style={{ width: `${delayPct}%` }}>
                {delayPct > 15 && <span>{delayPct.toFixed(1)}%</span>}
              </div>
            </div>
            <div className="pred-prob-legend">
              <span className="pred-prob-dot pred-prob-dot-green" /> No Delay
              <span className="pred-prob-dot pred-prob-dot-red" style={{ marginLeft: 12 }} /> Delay
            </div>
          </div>
        </div>
      </div>

      {/* ── Mini feature chart ───────────────────────────────── */}
      {topFactors.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={15} /> Top Risk Factors for This Project</div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topFactors} layout="vertical" margin={{ top: 0, right: 40, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}
                  label={{ position: 'right', formatter: v => `${v}%`, fontSize: 10, fill: 'var(--text-muted)' }}>
                  {topFactors.map((_, i) => (
                    <Cell key={i} fill={riskColor} opacity={1 - i * 0.15} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 6 }}>
              These are the model's top contributing features for <em>this specific prediction</em>.
              Addressing the top factors has the highest potential to reduce delay risk.
            </p>
          </div>
        </div>
      )}

      {/* ── Plain-English interpretation ─────────────────────── */}
      <div className="card pred-interpretation-card" style={{ borderLeftColor: riskColor }}>
        <div className="card-header">
          <div className="card-title"><Lightbulb size={15} /> What This Means</div>
        </div>
        <div className="card-body">
          <p className="pred-interpretation-text"
            dangerouslySetInnerHTML={{ __html: interpretation }} />

          {/* input vs predicted comparison */}
          <div className="pred-score-delta">
            <div className="pred-score-delta-item">
              <span className="pred-score-delta-label">Input Risk Score</span>
              <span className="pred-score-delta-val" style={{ color: 'var(--text-secondary)' }}>{inputRiskScore}</span>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            <div className="pred-score-delta-item">
              <span className="pred-score-delta-label">Predicted Risk Score</span>
              <span className="pred-score-delta-val" style={{ color: riskColor }}>{predictedRiskScore}</span>
            </div>
            <div className={`pred-score-delta-diff ${predictedRiskScore > inputRiskScore ? 'up' : predictedRiskScore < inputRiskScore ? 'down' : 'flat'}`}>
              {predictedRiskScore > inputRiskScore ? `+${predictedRiskScore - inputRiskScore} pts` :
               predictedRiskScore < inputRiskScore ? `${predictedRiskScore - inputRiskScore} pts` : 'unchanged'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action checklist ─────────────────────────────────── */}
      <div className="card pred-actions-card" style={{ borderLeftColor: riskColor }}>
        <div className="card-header">
          <div className="card-title" style={{ color: riskColor }}>
            <CheckSquare size={15} /> Recommended Actions — {riskLevel} Risk
          </div>
        </div>
        <div className="card-body">
          <div className="pred-action-list">
            {actions.map((a, i) => (
              <div key={i} className="pred-action-item">
                <CheckCircle size={14} className="pred-action-icon" style={{ color: riskColor }} />
                <span>{a.text}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 12 }}>
            These actions are generated based on risk level. Always apply professional judgment to your specific project context.
          </p>
        </div>
      </div>
    </>
  );
};

const LOADING_STEPS = [  'Validating project data...',
  'Preparing features...',
  'Analyzing environmental conditions...',
  'Evaluating equipment and resources...',
  'Predicting delay probability...',
  'Calculating risk score...',
  'Generating recommendations...',
];

const INITIAL_FORM = {
  timestamp: new Date().toISOString().slice(0, 16),
  temperature: '', humidity: 60, vibration_level: 25, material_usage: 70,
  machinery_status: 'operational', worker_count: '', energy_consumption: '',
  task_progress: 50, cost_deviation: 0, time_deviation: 0, safety_incidents: 0,
  equipment_utilization_rate: 75, material_shortage_alert: 'none',
  risk_score: 30, simulation_deviation: 0, update_frequency: 60,
  optimization_suggestion: 'none', performance_score: 70,
};

const Section = ({ icon, title, desc, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="form-section">
      <button type="button" className="form-section-header" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="form-section-icon">{icon}</div>
        <div style={{ flex: 1 }}>
          <div className="form-section-title">{title}</div>
          {desc && <div className="form-section-desc">{desc}</div>}
        </div>
        {open ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && <div style={{ marginTop: 20 }}>{children}</div>}
    </div>
  );
};

const RangeField = ({ id, label, value, onChange, min, max, step = 1, unit = '' }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>{label}</label>
    <div className="range-wrapper">
      <div className="range-header">
        <span className="text-xs text-muted">{min}{unit}</span>
        <span className="range-value">{value}{unit}</span>
        <span className="text-xs text-muted">{max}{unit}</span>
      </div>
      <input id={id} type="range" className="form-range" min={min} max={max} step={step} value={value} onChange={onChange} />
    </div>
  </div>
);

const Prediction = () => {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ ...INITIAL_FORM, projectId: searchParams.get('project') || '' });
  const [errors, setErrors] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    projectService.getAll({ limit: 100 }).then(res => {
      setProjects(res.data.projects);
    }).catch(() => {}).finally(() => setLoadingProjects(false));
  }, []);

  const set = (field) => (e) => {
    const val = e.target.type === 'range' || e.target.type === 'number'
      ? (e.target.value === '' ? '' : Number(e.target.value))
      : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.projectId) e.projectId = 'Please select a project';
    if (form.humidity < 0 || form.humidity > 100) e.humidity = '0–100%';
    if (form.task_progress < 0 || form.task_progress > 100) e.task_progress = '0–100%';
    if (form.equipment_utilization_rate < 0 || form.equipment_utilization_rate > 100) e.equipment_utilization_rate = '0–100%';
    if (form.performance_score < 0 || form.performance_score > 100) e.performance_score = '0–100';
    if (form.worker_count !== '' && form.worker_count < 0) e.worker_count = 'Must be ≥ 0';
    if (form.safety_incidents < 0) e.safety_incidents = 'Must be ≥ 0';
    return e;
  };

  const animateSteps = async () => {
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadingStep(i);
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setApiError('');
    setPredicting(true);
    setResult(null);
    setLoadingStep(0);

    const stepPromise = animateSteps();
    try {
      const payload = { ...form };
      const res = await predictionService.create(payload);
      await stepPromise;
      setResult(res.data.prediction);
    } catch (err) {
      setApiError(err.message || 'Prediction failed. Please try again.');
    } finally {
      setPredicting(false);
    }
  };

  const applyDemo = (scenario) => {
    const s = DEMO_SCENARIOS[scenario];
    setForm(f => ({ ...f, ...s.inputs, projectId: f.projectId }));
    setResult(null);
    setErrors({});
  };

  const heroClass = result ? `result-hero-${getRiskClass(result.riskLevel)}` : '';

  return (
    <MainLayout>
      <div className="page-header">
        <h1>New Prediction</h1>
        <p>Enter the 19 project signals to analyze delay risk and generate recommendations</p>
      </div>

      {/* Demo shortcuts */}
      <div className="prediction-demo-bar">
        <span className="text-xs text-muted" style={{ fontWeight: 600 }}>Quick Demo:</span>
        {Object.entries(DEMO_SCENARIOS).map(([key, s]) => (
          <button key={key} className="demo-pill" onClick={() => applyDemo(key)} style={{ borderColor: s.color, color: s.color }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="prediction-layout">
        {/* ─── Form ─────────────────────────────────────────── */}
        <div className="prediction-form-col">
          <form onSubmit={handleSubmit} noValidate>

            {/* Section 1 — Project */}
            <Section icon={<Zap size={18} />} title="Project" desc="Select the project to analyze">
              <div className="form-group">
                <label className="form-label" htmlFor="projectId">Project <span className="required">*</span></label>
                {loadingProjects ? <LoadingSpinner size="sm" /> : (
                  <div className="form-select-wrapper">
                    <select id="projectId" className={`form-select ${errors.projectId ? 'error' : ''}`} value={form.projectId} onChange={set('projectId')} aria-invalid={!!errors.projectId}>
                      <option value="">— Select a project —</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
                    </select>
                    <ChevronDown size={14} className="select-arrow" />
                  </div>
                )}
                {errors.projectId && <span className="form-error" role="alert">{errors.projectId}</span>}
                {!projects.length && !loadingProjects && (
                  <div className="form-hint">No projects found. <Link to="/projects">Create one first.</Link></div>
                )}
              </div>
            </Section>

            {/* Section 2 — Environmental */}
            <Section icon={<Cloud size={18} />} title="Environmental Conditions" desc="Weather and site conditions">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="ts">Timestamp</label>
                  <input id="ts" type="datetime-local" className="form-input" value={form.timestamp} onChange={set('timestamp')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="temp">Temperature (°C)</label>
                  <input id="temp" type="number" className="form-input" placeholder="-20 to 60" value={form.temperature} onChange={set('temperature')} min="-20" max="60" />
                </div>
              </div>
              <RangeField id="humidity" label="Humidity (%)" value={form.humidity} onChange={set('humidity')} min={0} max={100} unit="%" />
              {errors.humidity && <span className="form-error">{errors.humidity}</span>}
            </Section>

            {/* Section 3 — Equipment */}
            <Section icon={<Cpu size={18} />} title="Equipment & Machinery" desc="Equipment status and utilization">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="vibration">Vibration Level</label>
                  <input id="vibration" type="number" className="form-input" min="0" max="100" placeholder="0–100" value={form.vibration_level} onChange={set('vibration_level')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="mstatus">Machinery Status</label>
                  <div className="form-select-wrapper">
                    <select id="mstatus" className="form-select" value={form.machinery_status} onChange={set('machinery_status')}>
                      <option value="operational">Operational</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="idle">Idle</option>
                      <option value="breakdown">Breakdown</option>
                    </select>
                    <ChevronDown size={14} className="select-arrow" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="energy">Energy Consumption (kWh)</label>
                  <input id="energy" type="number" className="form-input" min="0" placeholder="e.g. 12000" value={form.energy_consumption} onChange={set('energy_consumption')} />
                </div>
              </div>
              <RangeField id="equip" label="Equipment Utilization Rate (%)" value={form.equipment_utilization_rate} onChange={set('equipment_utilization_rate')} min={0} max={100} unit="%" />
              {errors.equipment_utilization_rate && <span className="form-error">{errors.equipment_utilization_rate}</span>}
            </Section>

            {/* Section 4 — Resources */}
            <Section icon={<Package size={18} />} title="Resources" desc="Materials and workforce">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="workers">Worker Count</label>
                  <input id="workers" type="number" className={`form-input ${errors.worker_count ? 'error' : ''}`} min="0" placeholder="e.g. 120" value={form.worker_count} onChange={set('worker_count')} />
                  {errors.worker_count && <span className="form-error">{errors.worker_count}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="shortage">Material Shortage Alert</label>
                  <div className="form-select-wrapper">
                    <select id="shortage" className="form-select" value={form.material_shortage_alert} onChange={set('material_shortage_alert')}>
                      <option value="none">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <ChevronDown size={14} className="select-arrow" />
                  </div>
                </div>
              </div>
              <RangeField id="matusage" label="Material Usage (%)" value={form.material_usage} onChange={set('material_usage')} min={0} max={100} unit="%" />
            </Section>

            {/* Section 5 — Progress */}
            <Section icon={<TrendingUp size={18} />} title="Project Progress" desc="Schedule, cost, and performance metrics">
              <RangeField id="taskprog" label="Task Progress (%)" value={form.task_progress} onChange={set('task_progress')} min={0} max={100} unit="%" />
              {errors.task_progress && <span className="form-error">{errors.task_progress}</span>}

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="costdev">Cost Deviation (%)</label>
                  <input id="costdev" type="number" className="form-input" placeholder="-20 to +100" value={form.cost_deviation} onChange={set('cost_deviation')} />
                  <span className="form-hint">Positive = over budget. Negative = under budget.</span>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="timedev">Time Deviation (%)</label>
                  <input id="timedev" type="number" className="form-input" placeholder="-10 to +100" value={form.time_deviation} onChange={set('time_deviation')} />
                  <span className="form-hint">Positive = behind schedule.</span>
                </div>
              </div>
              <RangeField id="perf" label="Performance Score (0–100)" value={form.performance_score} onChange={set('performance_score')} min={0} max={100} />
              {errors.performance_score && <span className="form-error">{errors.performance_score}</span>}
            </Section>

            {/* Section 6 — Risk & Simulation */}
            <Section icon={<ShieldAlert size={18} />} title="Risk & Simulation" desc="Current risk indicators and simulation data">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="safety">
                    Safety Incidents
                    <span className="label-hint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Info size={12} /> current period</span>
                  </label>
                  <input id="safety" type="number" className={`form-input ${errors.safety_incidents ? 'error' : ''}`} min="0" value={form.safety_incidents} onChange={set('safety_incidents')} />
                  {errors.safety_incidents && <span className="form-error">{errors.safety_incidents}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="updfreq">Update Frequency (minutes)</label>
                  <input id="updfreq" type="number" className="form-input" min="0" placeholder="e.g. 60" value={form.update_frequency} onChange={set('update_frequency')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="simdev">Simulation Deviation (%)</label>
                  <input id="simdev" type="number" className="form-input" placeholder="-100 to +100" value={form.simulation_deviation} onChange={set('simulation_deviation')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="optsugg">Optimization Suggestion</label>
                  <div className="form-select-wrapper">
                    <select id="optsugg" className="form-select" value={form.optimization_suggestion} onChange={set('optimization_suggestion')}>
                      <option value="none">None</option>
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="major">Major</option>
                    </select>
                    <ChevronDown size={14} className="select-arrow" />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="currisk">
                  Current Risk Score (0–100)
                  <span className="label-hint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Info size={12} /> existing/historical score</span>
                </label>
                <div className="range-wrapper">
                  <div className="range-header">
                    <span className="text-xs text-muted">0</span>
                    <span className="range-value">{form.risk_score}</span>
                    <span className="text-xs text-muted">100</span>
                  </div>
                  <input id="currisk" type="range" className="form-range" min={0} max={100} step={1} value={form.risk_score} onChange={set('risk_score')} />
                </div>
                <span className="form-hint">This is the <strong>input</strong> risk score. The model will generate a separate <strong>Predicted Risk Score</strong>.</span>
              </div>
            </Section>

            {/* Submit */}
            <div className="form-actions">
              <Button type="button" variant="secondary" icon={<RotateCcw size={15} />} onClick={() => { setForm({ ...INITIAL_FORM, projectId: form.projectId }); setResult(null); setErrors({}); setApiError(''); }}>
                Reset
              </Button>
              <Button type="submit" size="lg" icon={<Zap size={16} />} loading={predicting} disabled={!form.projectId}>
                Analyze Project Risk
              </Button>
            </div>

            {apiError && <ErrorMessage message={apiError} style={{ marginTop: 16 }} />}
          </form>
        </div>

        {/* ─── Result Panel ──────────────────────────────────── */}
        <div className="prediction-result-col">
          {predicting ? (
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div className="card-header"><div className="card-title">Analyzing...</div></div>
              <div className="card-body">
                <LoadingSteps steps={LOADING_STEPS} currentStep={loadingStep} />
              </div>
            </div>
          ) : result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80 }}>
              {/* Main Result */}
              <div className="result-card">
                {result.isMock && (
                  <div className="mock-notice" style={{ margin: '16px 16px 0' }}>
                    ⚠ Demo mode — ML service unavailable
                  </div>
                )}
                <div className={`result-card-hero ${heroClass}`}>
                  <div className="result-hero-label">Delay Probability</div>
                  <div className="result-hero-value">{result.delayProbability}<span className="result-hero-unit">%</span></div>
                  <div className="result-hero-title">{result.delayPrediction}</div>
                </div>
                <div className="result-metrics">
                  <div className="result-metric">
                    <div className="result-metric-value" style={{ color: `var(--risk-${getRiskClass(result.riskLevel)})` }}>{result.predictedRiskScore}</div>
                    <div className="result-metric-label">Predicted Risk Score</div>
                  </div>
                  <div className="result-metric">
                    <div className="result-metric-value">{result.riskLevel}</div>
                    <div className="result-metric-label">Risk Level</div>
                  </div>
                  <div className="result-metric">
                    <div className="result-metric-value">{result.confidence}%</div>
                    <div className="result-metric-label">Confidence</div>
                  </div>
                </div>
              </div>

              {/* Input vs Predicted */}
              <div className="card">
                <div className="card-header"><div className="card-title">Risk Score Comparison</div></div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ textAlign: 'center', padding: 16, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{form.risk_score}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Risk Score</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>Input value</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 16, background: `var(--risk-${getRiskClass(result.riskLevel)}-bg)`, borderRadius: 'var(--radius-md)', border: `1px solid var(--risk-${getRiskClass(result.riskLevel)})` }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: `var(--risk-${getRiskClass(result.riskLevel)})` }}>{result.predictedRiskScore}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: `var(--risk-${getRiskClass(result.riskLevel)})`, marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Predicted Risk Score</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: `var(--risk-${getRiskClass(result.riskLevel)})`, marginTop: 2, opacity: 0.8 }}>ML output</div>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              {result.majorRiskFactors?.length > 0 && (
                <div className="card">
                  <div className="card-header"><div className="card-title">Why is this project at risk?</div></div>
                  <div className="card-body">
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 16 }}>Feature contributions from the model (higher = more associated with the prediction outcome).</p>
                    {result.majorRiskFactors.map(f => (
                      <div key={f.feature} className="feature-bar-item">
                        <span className="feature-bar-name">{featureDisplayName(f.feature)}</span>
                        <div className="feature-bar-track">
                          <div className="feature-bar-fill" style={{ width: `${Math.min(100, f.importance * 4)}%` }} />
                        </div>
                        <span className="feature-bar-pct">{f.importance}%</span>
                      </div>
                    ))}
                    <FeatureImportanceChart data={result.majorRiskFactors} />
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="card">
                  <div className="card-header"><div className="card-title">Recommendations</div></div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>
                      These recommendations support decision-making. The system does not guarantee delay elimination.
                    </p>
                    {result.recommendations.map((r, i) => <RecommendationCard key={i} recommendation={r} index={i} />)}
                  </div>
                </div>
              )}

              {/* ── Insights Panel ─────────────────────────────── */}
              <PredictionInsights result={result} inputRiskScore={form.risk_score} />

              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/predictions" style={{ flex: 1 }}>
                  <Button variant="secondary" fullWidth>View History</Button>
                </Link>
                <Button variant="outline" fullWidth icon={<CheckCircle size={15} />} onClick={() => setResult(null)}>
                  New Analysis
                </Button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div className="card-body">
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <Zap className="empty-state-icon" style={{ color: 'var(--primary-color)' }} />
                  <h3>Ready to analyze</h3>
                  <p>Fill in the project signals and click <strong>Analyze Project Risk</strong> to run the AI prediction engine.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Prediction;
