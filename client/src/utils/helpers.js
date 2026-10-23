export const formatDate = (date, opts = {}) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...opts });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatTimeAgo = (date) => {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const getRiskColor = (level) => {
  const map = { Low: 'var(--risk-low)', Medium: 'var(--risk-medium)', High: 'var(--risk-high)', Critical: 'var(--risk-critical)' };
  return map[level] || 'var(--text-muted)';
};

export const getRiskBg = (level) => {
  const map = { Low: 'var(--risk-low-bg)', Medium: 'var(--risk-medium-bg)', High: 'var(--risk-high-bg)', Critical: 'var(--risk-critical-bg)' };
  return map[level] || 'var(--surface-sunken)';
};

export const getRiskClass = (level) => {
  const map = { Low: 'low', Medium: 'medium', High: 'high', Critical: 'critical' };
  return map[level] || 'low';
};

export const getDelayClass = (prediction) => {
  const map = {
    // binary model (current)
    'No Delay':        'success',
    'Delay':           'danger',
    // legacy 4-class (backwards compat)
    'On Schedule':      'success',
    'Potential Delay':  'warning',
    'Likely Delayed':   'danger',
    'Severe Delay Risk':'danger',
  };
  return map[prediction] || 'neutral';
};

export const getStatusClass = (status) => {
  const map = { Planning: 'info', 'In Progress': 'success', 'At Risk': 'warning', Delayed: 'danger', Completed: 'neutral' };
  return map[status] || 'neutral';
};

export const featureDisplayName = (key) => {
  const map = {
    // raw input features
    timestamp:                   'Timestamp',
    temperature:                 'Temperature',
    humidity:                    'Humidity',
    vibration_level:             'Vibration Level',
    material_usage:              'Material Usage',
    machinery_status:            'Machinery Status',
    worker_count:                'Worker Count',
    energy_consumption:          'Energy Consumption',
    task_progress:               'Task Progress',
    cost_deviation:              'Cost Deviation',
    time_deviation:              'Time Deviation',
    safety_incidents:            'Safety Incidents',
    equipment_utilization_rate:  'Equipment Utilization',
    material_shortage_alert:     'Material Shortage',
    risk_score:                  'Current Risk Score',
    simulation_deviation:        'Simulation Deviation',
    update_frequency:            'Update Frequency',
    optimization_suggestion:     'Optimization Suggestion',
    performance_score:           'Performance Score',
    // timestamp-derived features
    timestamp_hour:              'Time of Day (Hour)',
    hour:                        'Hour of Day',
    day:                         'Day of Month',
    dayofweek:                   'Day of Week',
    month:                       'Month',
    // engineered features (notebook Cells 21-25)
    worker_productivity:         'Worker Productivity',
    material_efficiency:         'Material Efficiency',
    equipment_efficiency:        'Equipment Efficiency',
    environmental_stress:        'Environmental Stress',
    safety_risk:                 'Safety Risk Index',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
};

export const greetUser = (name) => {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  return `${greeting}, ${name?.split(' ')[0] || 'User'}`;
};

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};
