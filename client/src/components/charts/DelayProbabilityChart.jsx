import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import '../../styles/charts.css';

// Supports both binary labels (current model) and legacy 4-class labels
const COLORS_MAP = {
  // binary model
  'No Delay':         'var(--risk-low)',
  'Delay':            'var(--risk-critical)',
  // legacy 4-class
  'On Schedule':      'var(--risk-low)',
  'Potential Delay':  'var(--risk-medium)',
  'Likely Delayed':   'var(--risk-high)',
  'Severe Delay Risk':'var(--risk-critical)',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-name">Count</span>
        <span className="chart-tooltip-value">{payload[0].value}</span>
      </div>
    </div>
  );
};

const DelayProbabilityChart = ({ data = [] }) => {
  if (!data.length) {
    return <div className="chart-no-data"><span>No delay data available</span></div>;
  }

  // Detect which label set is present in the data
  const labels = data.map(d => d._id).filter(Boolean);
  const isBinary = labels.some(l => l === 'No Delay' || l === 'Delay');

  const ORDER = isBinary
    ? ['No Delay', 'Delay']
    : ['On Schedule', 'Potential Delay', 'Likely Delayed', 'Severe Delay Risk'];

  const formatted = ORDER.map(label => ({
    name: label,
    count: data.find(d => d._id === label)?.count || 0,
  }));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={formatted} margin={{ top: 4, right: 16, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border-color)', opacity: 0.5 }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {formatted.map(entry => (
              <Cell key={entry.name} fill={COLORS_MAP[entry.name] || 'var(--primary-color)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DelayProbabilityChart;
