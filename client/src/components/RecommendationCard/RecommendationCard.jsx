import '../../styles/cards.css';

const PRIORITY_LABELS = { High: 'High Priority', Medium: 'Medium Priority', Low: 'Low Priority' };

const RecommendationCard = ({ recommendation, index }) => {
  const { priority = 'Medium', issue, action, reason, expectedBenefit } = recommendation;
  const p = priority.toLowerCase();

  return (
    <div className="recommendation-card" role="article">
      <div className={`recommendation-priority-bar ${p}`} aria-hidden="true" />
      <div className="recommendation-body">
        <div className="recommendation-header">
          <span className={`badge badge-${p === 'high' ? 'danger' : p === 'medium' ? 'warning' : 'success'}`}>
            {PRIORITY_LABELS[priority]}
          </span>
          {index !== undefined && (
            <span className="text-xs text-muted">#{index + 1}</span>
          )}
        </div>
        <p className="recommendation-issue">{issue}</p>
        <p className="recommendation-action"><strong>Action:</strong> {action}</p>
        {(reason || expectedBenefit) && (
          <div className="recommendation-meta">
            {reason && (
              <div className="recommendation-meta-item">
                <span className="recommendation-meta-label">Why</span>
                <span className="recommendation-meta-value">{reason}</span>
              </div>
            )}
            {expectedBenefit && (
              <div className="recommendation-meta-item">
                <span className="recommendation-meta-label">Expected Benefit</span>
                <span className="recommendation-meta-value">{expectedBenefit}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;
