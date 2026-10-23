import { BarChart2, ArrowRight, Brain, Shield, Zap, Database, Server, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Button from '../../components/Button/Button';
import '../../styles/cards.css';
import './About.css';

const FEATURES_19 = [
  'Timestamp', 'Temperature', 'Humidity', 'Vibration Level', 'Material Usage',
  'Machinery Status', 'Worker Count', 'Energy Consumption', 'Task Progress',
  'Cost Deviation', 'Time Deviation', 'Safety Incidents', 'Equipment Utilization Rate',
  'Material Shortage Alert', 'Risk Score', 'Simulation Deviation', 'Update Frequency',
  'Optimization Suggestion', 'Performance Score',
];

const PIPELINE = [
  { step: '01', label: 'Construction Data', desc: '19 real-time signals collected from the project site', icon: Database },
  { step: '02', label: 'Preprocessing', desc: 'Feature engineering, categorical encoding, numerical scaling', icon: Code2 },
  { step: '03', label: 'ML Model', desc: 'Random Forest / XGBoost trained on synthetic construction data', icon: Brain },
  { step: '04', label: 'Delay Prediction', desc: 'On Schedule / Potential Delay / Likely Delayed / Severe Delay Risk', icon: Zap },
  { step: '05', label: 'Predicted Risk Score', desc: 'Continuous risk score 0–100 distinct from the input risk score', icon: Shield },
  { step: '06', label: 'Risk Explanation', desc: 'Feature importance identifying the top contributing signals', icon: BarChart2 },
  { step: '07', label: 'Recommendations', desc: 'Actionable interventions based on input values and model output', icon: ArrowRight },
];

const TECH_STACK = [
  { label: 'Frontend', items: ['React 18', 'React Router v6', 'Recharts', 'Lucide React', 'Plain CSS'] },
  { label: 'Backend', items: ['Node.js', 'Express.js', 'JWT Auth', 'bcrypt', 'Mongoose'] },
  { label: 'Database', items: ['MongoDB', 'Mongoose ODM'] },
  { label: 'ML Service', items: ['Python / Flask', 'Random Forest', 'XGBoost', 'scikit-learn', 'joblib'] },
];

const About = () => (
  <MainLayout>
    <div className="page-header">
      <h1>About SmartConstruct AI</h1>
      <p>AI-powered construction delay prediction and risk management platform</p>
    </div>

    {/* Problem & Solution */}
    <div className="grid-2" style={{ marginBottom: 32 }}>
      <div className="card">
        <div className="card-header"><div className="card-title">The Problem</div></div>
        <div className="card-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <p>Construction projects routinely face delays, cost overruns, and safety incidents. Traditional project management relies on periodic manual assessment, meaning risk factors often compound before they are identified. By the time a delay is recognized it may already be weeks or months into the project timeline.</p>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">The Solution</div></div>
        <div className="card-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <p>SmartConstruct AI continuously analyzes 19 project signals — from weather conditions and equipment status to schedule and cost metrics — to predict delay probability and risk level in real time, enabling project managers to take preventive action before delays become critical.</p>
        </div>
      </div>
    </div>

    {/* Pipeline */}
    <div className="card" style={{ marginBottom: 32 }}>
      <div className="card-header"><div className="card-title">System Architecture</div></div>
      <div className="card-body">
        <div className="about-pipeline">
          {PIPELINE.map(({ step, label, desc, icon: Icon }, i) => (
            <div key={step} className="about-pipeline-step">
              <div className="about-step-number">{step}</div>
              <div className="about-step-icon"><Icon size={20} /></div>
              <div className="about-step-body">
                <div className="about-step-label">{label}</div>
                <div className="about-step-desc">{desc}</div>
              </div>
              {i < PIPELINE.length - 1 && <div className="about-step-arrow" aria-hidden="true">↓</div>}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* 19 Features */}
    <div className="card" style={{ marginBottom: 32 }}>
      <div className="card-header">
        <div>
          <div className="card-title">19 Data Signals</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>All features used by the prediction model</div>
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {FEATURES_19.map((f, i) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ width: 22, height: 22, borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ML & Risk Design */}
    <div className="grid-2" style={{ marginBottom: 32 }}>
      <div className="card">
        <div className="card-header"><div className="card-title">Machine Learning</div></div>
        <div className="card-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <p style={{ marginBottom: 12 }}>The ML service evaluates four model architectures and selects the best performer by F1 macro score:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Random Forest (200 estimators)', 'XGBoost (gradient boosting)', 'AdaBoost', 'Gaussian Naive Bayes'].map(m => (
              <li key={m} style={{ listStyle: 'disc', fontSize: 'var(--text-sm)' }}>{m}</li>
            ))}
          </ul>
          <p style={{ marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            The same preprocessing pipeline is used during training and inference to prevent data leakage.
          </p>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Risk Design</div></div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 'var(--text-sm)' }}>The system distinguishes two different risk concepts:</p>
          {[
            { label: 'Current Risk Score', desc: 'Input feature — the existing historical risk score for the project.', color: 'var(--text-primary)' },
            { label: 'Predicted Risk Score', desc: 'ML output — computed from class probabilities and input signals.', color: 'var(--primary-color)' },
          ].map(({ label, desc, color }) => (
            <div key={label} style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--surface-sunken)', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color, marginBottom: 4, fontSize: 'var(--text-sm)' }}>{label}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{desc}</div>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            {[['0–25', 'Low', 'var(--risk-low)'], ['26–50', 'Medium', 'var(--risk-medium)'], ['51–75', 'High', 'var(--risk-high)'], ['76–100', 'Critical', 'var(--risk-critical)']].map(([range, level, color]) => (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', width: 60 }}>{range}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color }}>{level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Tech Stack */}
    <div className="card" style={{ marginBottom: 32 }}>
      <div className="card-header"><div className="card-title">Technology Stack</div></div>
      <div className="card-body">
        <div className="grid-4">
          {TECH_STACK.map(({ label, items }) => (
            <div key={label} style={{ padding: '16px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</div>
              {items.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Disclaimer */}
    <div className="alert alert-info">
      <span className="alert-icon"><Shield size={16} /></span>
      <div>
        <strong>Decision Support Tool:</strong> SmartConstruct AI provides risk indicators and recommendations to assist project managers. It does not guarantee construction delay outcomes. All recommendations should be evaluated by qualified professionals in the context of their specific project circumstances.
      </div>
    </div>

    <div style={{ marginTop: 24, textAlign: 'center' }}>
      <Link to="/prediction"><Button size="lg" icon={<Zap size={16} />}>Try It Now</Button></Link>
    </div>
  </MainLayout>
);

export default About;
