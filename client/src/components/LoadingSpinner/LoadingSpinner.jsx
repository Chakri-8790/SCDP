import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', text = '', fullPage = false }) => {
  const spinner = (
    <div className={`spinner-wrapper ${fullPage ? 'spinner-fullpage' : ''}`} role="status" aria-live="polite">
      <div className={`spinner spinner-${size}`} />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
  return spinner;
};

export const LoadingSteps = ({ steps, currentStep }) => (
  <div className="loading-steps" role="status" aria-live="polite">
    <div className="loading-steps-spinner" />
    <div className="loading-steps-list">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`loading-step ${i < currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}`}
        >
          <span className="step-dot" />
          <span className="step-text">{step}</span>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSpinner;
