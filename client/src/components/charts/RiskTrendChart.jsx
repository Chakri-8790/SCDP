import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import '../../styles/charts.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-item">
          <span className="chart-tooltip-dot" style={{ background: p.color }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <span className="chart-tooltip-value">{Number(p.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

const RiskTrendChart = ({ data = [] }) => {
  if (!data.length) {
    return <div className="chart-no-data"><span>No trend data available</span></div>;
  }

  const formatted = data.map(d => ({
    date: d._id,
    'Risk Score': Number(d.avgRisk?.toFixed(1) || 0),
    'Delay %': Number(d.avgProbability?.toFixed(1) || 0),
  }));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={formatted} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={50} stroke="var(--warning-color)" strokeDasharray="4 4" strokeOpacity={0.6} />
          <Line type="monotone" dataKey="Risk Score" stroke="var(--danger-color)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="Delay %" stroke="var(--primary-color)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        <div className="legend-item"><span className="legend-line" style={{ background: 'var(--danger-color)' }} />Risk Score</div>
        <div className="legend-item"><span className="legend-line" style={{ background: 'var(--primary-color)' }} />Delay %</div>
      </div>
    </div>
  );
};

export default RiskTrendChart;
