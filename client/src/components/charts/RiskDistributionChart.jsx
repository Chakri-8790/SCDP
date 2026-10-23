import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import '../../styles/charts.css';

const COLORS = {
  Low: 'var(--risk-low)',
  Medium: 'var(--risk-medium)',
  High: 'var(--risk-high)',
  Critical: 'var(--risk-critical)',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-dot" style={{ background: COLORS[name] }} />
        <span className="chart-tooltip-name">{name}</span>
        <span className="chart-tooltip-value">{value}</span>
      </div>
    </div>
  );
};

const RiskDistributionChart = ({ data = [] }) => {
  const chartData = ['Low', 'Medium', 'High', 'Critical'].map(level => ({
    name: level,
    value: data.find(d => d._id === level)?.count || 0,
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="chart-no-data">
        <span>No prediction data yet</span>
      </div>
    );
  }

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pie-legend-grid">
        {chartData.map(({ name, value }) => (
          <div key={name} className="pie-legend-item">
            <span className="pie-legend-color" style={{ background: COLORS[name] }} />
            <span className="pie-legend-label">{name}</span>
            <span className="pie-legend-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskDistributionChart;
