import { Link } from 'react-router-dom';
import {
  BarChart2, Zap, Shield, TrendingUp, ArrowRight, CheckCircle,
  AlertTriangle, Brain, Database, Server, ChevronRight
} from 'lucide-react';
import Footer from '../../components/Footer/Footer';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import './Landing.css';

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Prediction', desc: 'Random Forest and XGBoost models trained on construction data to predict delay probability and risk score with explainable output.' },
  { icon: Shield, title: 'Risk Scoring', desc: 'Continuous 0–100 predicted risk score updated every analysis, with Low / Medium / High / Critical classification.' },
  { icon: Zap, title: 'Instant Analysis', desc: 'Enter 19 project signals and receive delay prediction, risk level, feature importance, and recommendations in seconds.' },
  { icon: TrendingUp, title: 'Trend Analytics', desc: 'Visualize risk trends, delay patterns, and feature contributions across projects over time.' },
  { icon: AlertTriangle, title: 'Smart Recommendations', desc: 'Actionable, priority-ranked recommendations generated from actual input values and model explanations.' },
  { icon: Database, title: 'Full Project Management', desc: 'Create and manage construction projects with status tracking, progress monitoring, and prediction history.' },
];

const SIGNALS_19 = [
  'Timestamp', 'Temperature', 'Humidity', 'Vibration Level', 'Material Usage',
  'Machinery Status', 'Worker Count', 'Energy Consumption', 'Task Progress',
  'Cost Deviation', 'Time Deviation', 'Safety Incidents', 'Equipment Utilization',
  'Material Shortage', 'Risk Score', 'Simulation Deviation', 'Update Frequency',
  'Optimization Suggestion', 'Performance Score',
];

const HOW_IT_WORKS = [
  { n: '01', title: 'Connect your project', desc: 'Create a project and enter the 19 real-time signals from your construction site.' },
  { n: '02', title: 'AI analyzes the data', desc: 'The ML engine preprocesses features, runs the trained model, and computes predicted risk.' },
  { n: '03', title: 'Review predictions', desc: 'See delay probability, predicted risk score, risk level, and which factors are driving the risk.' },
  { n: '04', title: 'Act on recommendations', desc: 'Prioritized, actionable recommendations help your team intervene before delays compound.' },
];

const Landing = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className="landing">
      {/* ─── Nav ───────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <div className="landing-nav-logo"><BarChart2 size={20} /></div>
            <div>
              <div className="landing-nav-name">SmartConstruct AI</div>
              <div className="landing-nav-tag">Risk Intelligence Platform</div>
            </div>
          </div>
          <div className="landing-nav-right">
            <button className="landing-nav-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="landing-nav-link">Sign In</Link>
            <Link to="/register" className="landing-nav-cta">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>
        <div className="landing-container">
          <div className="landing-hero-badge">
            <span className="badge badge-info">AI-Powered Construction Intelligence</span>
          </div>
          <h1 className="landing-hero-title">
            Predict Construction Delays<br />
            <span className="landing-hero-highlight">Before They Become Critical</span>
          </h1>
          <p className="landing-hero-subtitle">
            Analyze project conditions, identify emerging risks, and receive actionable recommendations
            using machine-learning-powered construction intelligence.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-btn-primary">
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link to="/about" className="landing-btn-secondary">
              Explore Platform
            </Link>
          </div>
          <div className="landing-hero-stats">
            {[['19', 'Data Signals'], ['4', 'Risk Levels'], ['Real-time', 'Analysis'], ['AI', 'Recommendations']].map(([val, label]) => (
              <div key={label} className="hero-stat">
                <span className="hero-stat-val">{val}</span>
                <span className="hero-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dashboard Preview ─────────────────────────────── */}
      <section className="landing-preview-section">
        <div className="landing-container">
          <div className="landing-preview-card">
            <div className="preview-header">
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="preview-dot preview-red" />
                <span className="preview-dot preview-yellow" />
                <span className="preview-dot preview-green" />
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>SmartConstruct AI — Dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-kpis">
                {[['12', 'Total Projects'], ['8', 'Active'], ['3', 'At Risk'], ['74', 'Avg Risk Score']].map(([v, l]) => (
                  <div key={l} className="preview-kpi">
                    <div className="preview-kpi-val">{v}</div>
                    <div className="preview-kpi-label">{l}</div>
                  </div>
                ))}
              </div>
              <div className="preview-charts">
                <div className="preview-chart-bar">
                  {[65, 45, 80, 30, 55, 70, 40, 85, 50, 60].map((h, i) => (
                    <div key={i} className="preview-bar" style={{ height: `${h}%`, opacity: 0.7 + (i % 3) * 0.1 }} />
                  ))}
                </div>
                <div className="preview-risk-badges">
                  {[['Low', '#059669'], ['Medium', '#d97706'], ['High', '#ea580c'], ['Critical', '#dc2626']].map(([l, c]) => (
                    <div key={l} className="preview-risk-badge" style={{ borderColor: c, color: c }}>
                      <span className="preview-risk-dot" style={{ background: c }} />{l}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why SmartConstruct ────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Why SmartConstruct?</h2>
            <p className="landing-section-desc">A complete AI decision-support platform for construction risk management</p>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="landing-feature-card">
                <div className="landing-feature-icon"><Icon size={22} /></div>
                <h3 className="landing-feature-title">{title}</h3>
                <p className="landing-feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">How It Works</h2>
            <p className="landing-section-desc">From raw project data to actionable risk intelligence in four steps</p>
          </div>
          <div className="landing-steps">
            {HOW_IT_WORKS.map(({ n, title, desc }, i) => (
              <div key={n} className="landing-step">
                <div className="landing-step-number">{n}</div>
                <div className="landing-step-body">
                  <h3 className="landing-step-title">{title}</h3>
                  <p className="landing-step-desc">{desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ChevronRight size={20} className="landing-step-arrow" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 19 Signals ────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">19 Data Signals</h2>
            <p className="landing-section-desc">Every prediction uses all 19 construction features for maximum accuracy</p>
          </div>
          <div className="landing-signals-grid">
            {SIGNALS_19.map((s, i) => (
              <div key={s} className="landing-signal">
                <span className="landing-signal-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="landing-signal-name">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Risk Levels ───────────────────────────────────── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">AI Risk Analysis</h2>
            <p className="landing-section-desc">Four distinct risk levels with actionable thresholds</p>
          </div>
          <div className="landing-risk-grid">
            {[
              { level: 'Low', range: '0–25', desc: 'Project is on track. Continue standard monitoring procedures.', color: '#059669', bg: '#ecfdf5' },
              { level: 'Medium', range: '26–50', desc: 'Early warning signals detected. Review risk register and mitigation plans.', color: '#d97706', bg: '#fffbeb' },
              { level: 'High', range: '51–75', desc: 'Significant risk factors present. Immediate intervention required on critical activities.', color: '#ea580c', bg: '#fff7ed' },
              { level: 'Critical', range: '76–100', desc: 'Severe delay risk. Emergency review and executive escalation recommended.', color: '#dc2626', bg: '#fef2f2' },
            ].map(({ level, range, desc, color, bg }) => (
              <div key={level} className="landing-risk-card" style={{ background: bg, borderColor: color }}>
                <div className="landing-risk-badge" style={{ color, borderColor: color }}>{level}</div>
                <div className="landing-risk-range" style={{ color }}>{range}</div>
                <p className="landing-risk-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────── */}
      <section className="landing-cta">
        <div className="landing-container">
          <div className="landing-cta-inner">
            <h2 className="landing-cta-title">Ready to predict delays before they happen?</h2>
            <p className="landing-cta-desc">Join SmartConstruct AI and start monitoring construction risk in real time.</p>
            <div className="landing-cta-actions">
              <Link to="/register" className="landing-btn-primary landing-btn-white">
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="landing-btn-ghost-white">Already have an account?</Link>
            </div>
            <div className="landing-cta-checks">
              {['No credit card required', 'Free to get started', 'Full ML prediction pipeline'].map(c => (
                <div key={c} className="landing-cta-check"><CheckCircle size={14} />{c}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
