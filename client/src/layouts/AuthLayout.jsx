import { Link } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';
import './AuthLayout.css';

const AuthLayout = ({ children }) => (
  <div className="auth-layout">
    <div className="auth-layout-bg" aria-hidden="true">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
    </div>
    <div className="auth-layout-content">
      <Link to="/" className="auth-layout-logo" aria-label="SmartConstruct AI Home">
        <div className="auth-layout-logo-icon">
          <BarChart2 size={24} />
        </div>
        <div>
          <div className="auth-layout-brand">SmartConstruct AI</div>
          <div className="auth-layout-sub">Construction Risk Intelligence</div>
        </div>
      </Link>
      {children}
    </div>
  </div>
);

export default AuthLayout;
