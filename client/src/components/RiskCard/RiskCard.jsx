import { ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon } from 'lucide-react';
import { getRiskClass } from '../../utils/helpers';
import '../../styles/cards.css';

const ICONS = {
  Low: ShieldCheck,
  Medium: AlertTriangle,
  High: ShieldAlert,
  Critical: AlertOctagon,
};

const RiskCard = ({ level = 'Low', score, label, description }) => {
  const cls = getRiskClass(level);
  const Icon = ICONS[level] || ShieldCheck;

  return (
    <div className={`risk-card ${cls}`} role="region" aria-label={`Risk level: ${level}`}>
      <div className="risk-card-header">
        <span className="risk-card-label">{label || `${level} Risk`}</span>
        <Icon size={20} aria-hidden="true" />
      </div>
      {score !== undefined && (
        <div className="risk-card-value">{score}<span style={{ fontSize: '0.4em', fontWeight: 600 }}>/100</span></div>
      )}
      {description && <p className="risk-card-desc">{description}</p>}
    </div>
  );
};

export default RiskCard;
