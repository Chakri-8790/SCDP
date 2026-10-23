import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Calendar, Zap, AlertTriangle } from 'lucide-react';
import { projectService } from '../../services/projectService';
import MainLayout from '../../layouts/MainLayout';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import RiskCard from '../../components/RiskCard/RiskCard';
import Button from '../../components/Button/Button';
import { formatDate, formatTimeAgo, getStatusClass, getRiskClass } from '../../utils/helpers';
import '../../styles/cards.css';

const ProjectDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await projectService.getById(id);
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Project not found.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <MainLayout><LoadingSpinner size="lg" text="Loading project..." /></MainLayout>;
  if (error) return <MainLayout><ErrorMessage message={error} /></MainLayout>;

  const { project, recentPredictions = [] } = data;
  const latest = project.latestPrediction;

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to Projects
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, marginBottom: 4 }}>{project.projectName}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className={`badge badge-${getStatusClass(project.status)}`}>{project.status}</span>
              {project.projectId && <span className="badge badge-neutral">{project.projectId}</span>}
            </div>
          </div>
          <Link to={`/prediction?project=${project._id}`}>
            <Button icon={<Zap size={16} />}>Run Prediction</Button>
          </Link>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Overview */}
        <div className="card">
          <div className="card-header"><div className="card-title">Project Overview</div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <MapPin size={15} />, label: 'Location', value: project.location },
              { icon: <User size={15} />, label: 'Manager', value: project.manager },
              { icon: <Calendar size={15} />, label: 'Start Date', value: formatDate(project.startDate) },
              { icon: <Calendar size={15} />, label: 'Expected End', value: formatDate(project.expectedEndDate) },
            ].map(({ icon, label, value }) => value && (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', minWidth: 100 }}>{label}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-sm)' }}>
                <span>Progress</span><strong>{project.progress}%</strong>
              </div>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-fill" style={{ width: `${project.progress}%`, background: 'var(--primary-color)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Latest Risk */}
        <div className="card">
          <div className="card-header"><div className="card-title">Current Risk Status</div></div>
          <div className="card-body">
            {latest ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <RiskCard level={latest.riskLevel} score={latest.predictedRiskScore} label="Predicted Risk Score" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{latest.delayProbability}%</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Delay Probability</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>{latest.delayPrediction}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Prediction</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <AlertTriangle size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                <p>No predictions yet</p>
                <Link to={`/prediction?project=${project._id}`}><Button size="sm" icon={<Zap size={14} />}>Run First Prediction</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prediction History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Prediction History</div>
          <Link to={`/predictions?project=${project._id}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--primary-color)', textDecoration: 'none' }}>View all</Link>
        </div>
        {!recentPredictions.length ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <p>No prediction history for this project.</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Prediction</th><th>Probability</th><th>Risk Score</th><th>Risk Level</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentPredictions.map(p => (
                  <tr key={p._id}>
                    <td>{formatTimeAgo(p.createdAt)}</td>
                    <td>{p.delayPrediction}</td>
                    <td>{p.delayProbability}%</td>
                    <td>{p.predictedRiskScore}/100</td>
                    <td><span className={`badge badge-risk-${getRiskClass(p.riskLevel)}`}>{p.riskLevel}</span></td>
                    <td><Link to={`/predictions/${p._id}`}><button className="table-action-btn" title="View"><AlertTriangle size={14} /></button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProjectDetails;
