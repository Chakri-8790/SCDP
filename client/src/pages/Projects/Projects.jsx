import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderOpen, MapPin, User, Calendar, Trash2, Edit2, Eye, AlertTriangle } from 'lucide-react';
import { projectService } from '../../services/projectService';
import MainLayout from '../../layouts/MainLayout';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import { formatDate, getStatusClass, debounce } from '../../utils/helpers';
import '../../styles/forms.css';
import '../../styles/cards.css';
import '../../styles/tables.css';

const MAX_PROJECTS = 20;

const STATUS_OPTIONS = ['', 'Planning', 'In Progress', 'At Risk', 'Delayed', 'Completed'];

const EMPTY_FORM = {
  projectName: '', projectId: '', location: '', manager: '',
  startDate: '', expectedEndDate: '', progress: 0, status: 'Planning', description: '', budget: ''
};

const ProjectCard = ({ project, onEdit, onDelete }) => (
  <div className="project-card" style={{ cursor: 'default' }}>
    <div className="project-card-header">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
        <div className="project-card-icon"><FolderOpen size={22} /></div>
        <div>
          <div className="project-card-name">{project.projectName}</div>
          <div className="project-card-id">{project.projectId || '—'}</div>
        </div>
      </div>
      <span className={`badge badge-${getStatusClass(project.status)}`}>{project.status}</span>
    </div>
    <div className="project-card-meta">
      {project.location && <div className="project-meta-item"><MapPin size={13} />{project.location}</div>}
      {project.manager && <div className="project-meta-item"><User size={13} />{project.manager}</div>}
      {project.startDate && <div className="project-meta-item"><Calendar size={13} />{formatDate(project.startDate)} → {formatDate(project.expectedEndDate)}</div>}
    </div>
    <div className="project-card-progress">
      <div className="project-progress-header">
        <span>Progress</span>
        <span className="project-progress-value">{project.progress}%</span>
      </div>
      <div className="progress-bar-wrapper">
        <div className="progress-bar-fill" style={{ width: `${project.progress}%`, background: project.progress >= 75 ? 'var(--success-color)' : project.progress >= 40 ? 'var(--primary-color)' : 'var(--warning-color)' }} />
      </div>
    </div>
    <div className="project-card-footer">
      {project.latestPrediction ? (
        <span className={`badge badge-risk-${project.latestPrediction.riskLevel?.toLowerCase()}`}>
          {project.latestPrediction.riskLevel} Risk
        </span>
      ) : <span className="text-muted text-xs">No predictions yet</span>}
      <div style={{ display: 'flex', gap: 6 }}>
        <Link to={`/projects/${project._id}`}><button className="table-action-btn" title="View"><Eye size={15} /></button></Link>
        <button className="table-action-btn" onClick={() => onEdit(project)} title="Edit"><Edit2 size={15} /></button>
        <button className="table-action-btn danger" onClick={() => onDelete(project)} title="Delete"><Trash2 size={15} /></button>
      </div>
    </div>
  </div>
);

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fetchProjects = useCallback(async (s, st) => {
    const searchVal = s !== undefined ? s : search;
    const statusVal = st !== undefined ? st : statusFilter;
    setLoading(true);
    setError('');
    try {
      const res = await projectService.getAll({ search: searchVal, status: statusVal, limit: 50 });
      setProjects(res.data.projects);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce((val) => fetchProjects(val, statusFilter), 400), [statusFilter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    fetchProjects(search, e.target.value);
  };

  const openCreate = () => {
    if (projects.length >= MAX_PROJECTS) {
      setError(`You have reached the maximum of ${MAX_PROJECTS} projects. Delete an existing project to create a new one.`);
      return;
    }
    setEditProject(null); setForm(EMPTY_FORM); setFormErrors({}); setModalOpen(true);
  };
  const openEdit = (p) => { setEditProject(p); setForm({ projectName: p.projectName, projectId: p.projectId || '', location: p.location || '', manager: p.manager || '', startDate: p.startDate?.slice(0,10) || '', expectedEndDate: p.expectedEndDate?.slice(0,10) || '', progress: p.progress, status: p.status, description: p.description || '', budget: p.budget || '' }); setFormErrors({}); setModalOpen(true); };

  const validateForm = () => {
    const e = {};
    if (!form.projectName.trim()) e.projectName = 'Project name is required';
    if (form.progress < 0 || form.progress > 100) e.progress = 'Progress must be 0–100';
    return e;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const v = validateForm();
    if (Object.keys(v).length) { setFormErrors(v); return; }
    setSaving(true);
    try {
      if (editProject) {
        await projectService.update(editProject._id, form);
      } else {
        await projectService.create(form);
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      setFormErrors({ api: err.message || 'Failed to save project.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectService.delete(deleteTarget._id);
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      setError(err.message || 'Failed to delete project.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const setField = (f) => (e) => { setForm(prev => ({ ...prev, [f]: e.target.value })); if (formErrors[f]) setFormErrors(fe => ({ ...fe, [f]: '' })); };

  return (
    <MainLayout>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>Projects</h1>
            <p>Manage and monitor your construction projects</p>
          </div>
          <Button icon={<Plus size={16} />} onClick={openCreate}>New Project</Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="table-toolbar" style={{ borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
        <div className="table-toolbar-left">
          <div className="table-search">
            <Search size={14} className="table-search-icon" />
            <input className="table-search-input" placeholder="Search projects..." value={search} onChange={handleSearch} aria-label="Search projects" />
          </div>
          <select className="filter-select" value={statusFilter} onChange={handleStatusFilter} aria-label="Filter by status">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>
        <div className="text-muted text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''}</div>
      </div>

      {loading ? <LoadingSpinner size="lg" text="Loading projects..." /> :
       error ? <ErrorMessage message={error} onRetry={fetchProjects} /> :
       !projects.length ? (
        <div className="empty-state">
          <FolderOpen className="empty-state-icon" />
          <h3>No projects yet</h3>
          <p>Create your first construction project to start monitoring risk.</p>
          <Button icon={<Plus size={16} />} onClick={openCreate}>Create First Project</Button>
        </div>
      ) : (
        <div className="grid-auto">
          {projects.map(p => <ProjectCard key={p._id} project={p} onEdit={openEdit} onDelete={setDeleteTarget} />)}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProject ? 'Edit Project' : 'New Project'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>{editProject ? 'Save Changes' : 'Create Project'}</Button></>}>
        <form onSubmit={handleSave} noValidate>
          {formErrors.api && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{formErrors.api}</div>}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="pName">Project Name <span className="required">*</span></label>
              <input id="pName" className={`form-input ${formErrors.projectName ? 'error' : ''}`} value={form.projectName} onChange={setField('projectName')} />
              {formErrors.projectName && <span className="form-error">{formErrors.projectName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pId">Project ID</label>
              <input id="pId" className="form-input" value={form.projectId} onChange={setField('projectId')} placeholder="e.g. PRJ-2026-001" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pLoc">Location</label>
              <input id="pLoc" className="form-input" value={form.location} onChange={setField('location')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pMgr">Project Manager</label>
              <input id="pMgr" className="form-input" value={form.manager} onChange={setField('manager')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pStart">Start Date</label>
              <input id="pStart" type="date" className="form-input" value={form.startDate} onChange={setField('startDate')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pEnd">Expected End Date</label>
              <input id="pEnd" type="date" className="form-input" value={form.expectedEndDate} onChange={setField('expectedEndDate')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pStatus">Status</label>
              <div className="form-select-wrapper">
                <select id="pStatus" className="form-select" value={form.status} onChange={setField('status')}>
                  {['Planning','In Progress','At Risk','Delayed','Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pProgress">Progress (0–100%)</label>
              <input id="pProgress" type="number" min="0" max="100" className={`form-input ${formErrors.progress ? 'error' : ''}`} value={form.progress} onChange={setField('progress')} />
              {formErrors.progress && <span className="form-error">{formErrors.progress}</span>}
            </div>
            <div className="form-group form-grid-full">
              <label className="form-label" htmlFor="pDesc">Description</label>
              <textarea id="pDesc" className="form-textarea" value={form.description} onChange={setField('description')} rows="3" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button></>}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete <strong>{deleteTarget?.projectName}</strong>? This will also delete all associated predictions and cannot be undone.
        </p>
      </Modal>
    </MainLayout>
  );
};

export default Projects;
