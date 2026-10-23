import { AlertCircle, RefreshCw } from 'lucide-react';
import './ErrorMessage.css';

const ErrorMessage = ({ message = 'Something went wrong.', onRetry, className = '' }) => (
  <div className={`error-message ${className}`} role="alert">
    <AlertCircle className="error-icon" size={20} />
    <div className="error-content">
      <p className="error-text">{message}</p>
      {onRetry && (
        <button className="error-retry" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  </div>
);

export default ErrorMessage;
