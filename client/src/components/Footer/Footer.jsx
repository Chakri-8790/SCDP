import { Link } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';
import './Footer.css';

const Footer = ({ inApp = false }) => (
  <footer className={`footer ${inApp ? 'footer-app' : 'footer-landing'}`} role="contentinfo">
    <div className="footer-inner">
      <div className="footer-brand">
        <div className="footer-logo" aria-hidden="true">
          <BarChart2 size={18} />
        </div>
        <div>
          <div className="footer-brand-name">SmartConstruct AI</div>
          <div className="footer-tagline">Predict • Analyze • Prevent</div>
        </div>
      </div>

      <nav className="footer-links" aria-label="Footer navigation">
        {inApp ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/predictions">Predictions</Link>
            <Link to="/analytics">Analytics</Link>
            <Link to="/about">About</Link>
            <Link to="/settings">Settings</Link>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/about">About</Link>
          </>
        )}
      </nav>

      <div className="footer-copy">
        <span>© 2026 SmartConstruct AI. All rights reserved.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
