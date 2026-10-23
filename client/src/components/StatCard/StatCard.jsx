import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import '../../styles/dashboard.css';

const StatCard = ({ icon, value, label, trend, trendLabel, iconBg, iconColor }) => {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendClass = trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-flat';

  return (
    <div className="stat-card">
      {icon && (
        <div
          className="stat-card-icon"
          style={{ background: iconBg || 'var(--primary-light)', color: iconColor || 'var(--primary-color)' }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
        {trendLabel && (
          <div className={`stat-card-trend ${trendClass}`}>
            <TrendIcon size={12} aria-hidden="true" />
            {trendLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
