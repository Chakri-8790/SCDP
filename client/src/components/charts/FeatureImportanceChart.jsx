import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { featureDisplayName } from '../../utils/helpers';
import '../../styles/charts.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-name">Importance</span>
        <span className="chart-tooltip-value">{Number(payload[0].value).toFixed(2)}%</span>
      </div>
    </div>
  );
};

const FeatureImportanceChart = ({ data = [] }) => {
  if (!data.length) {
    return <div className="chart-no-data"><span>No feature importance data</span></div>;
  }

  const formatted = data.slice(0, 8).map(d => ({
    name: featureDisplayName(d.feature || d._id),
    value: Number((d.importance || d.avgImportance || 0).toFixed(2)),
  }));

  const maxVal = Math.max(...formatted.map(d => d.value));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={formatted} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, maxVal * 1.15]} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={130} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border-color)', opacity: 0.4 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {formatted.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={`rgba(26, 86, 219, ${1 - (i / formatted.length) * 0.55})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeatureImportanceChart;
