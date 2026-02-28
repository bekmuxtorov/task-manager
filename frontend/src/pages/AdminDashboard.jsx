import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const API_URL = 'http://localhost:8000';
    const [tasks, setTasks] = useState([]);
    const [programmers, setProgrammers] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tasks', 'programmers'
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assigned_to: '',
        status: 'TODO',
        images: [],
        videos: [],
        audios: []
    });
    const [newProgrammer, setNewProgrammer] = useState({
        first_name: '',
        last_name: '',
        username: '',
        password: '',
        phone_number: '',
        address: '',
        experience: '',
        education: '',
        bio: '',
        is_programmer: true,
        is_tester: false,
        is_manager: false
    });
    const [showForm, setShowForm] = useState(false);
    const [showProgForm, setShowProgForm] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [selectedTask, setSelectedTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [editingProgrammer, setEditingProgrammer] = useState(null);
    const [filterProgrammer, setFilterProgrammer] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
        fetchProgrammers();
    }, []);

    const fetchTasks = async () => {
        const res = await api.get('tasks/');
        setTasks(res.data);
    };

    const fetchProgrammers = async () => {
        const res = await api.get('programmers/');
        setProgrammers(res.data);
    };

    const getFileUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${API_URL}${path}`;
    };

    const handleFileChange = (e, field) => {
        const files = Array.from(e.target.files);
        setNewTask({ ...newTask, [field]: [...newTask[field], ...files] });
    };

    const removeFile = (field, index) => {
        const updatedFiles = [...newTask[field]];
        updatedFiles.splice(index, 1);
        setNewTask({ ...newTask, [field]: updatedFiles });
    };

    const createTask = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', newTask.title);
        formData.append('description', newTask.description);
        formData.append('assigned_to', newTask.assigned_to);
        formData.append('status', newTask.status);

        newTask.images.forEach(file => {
            if (file instanceof File) formData.append('images', file);
        });
        newTask.videos.forEach(file => {
            if (file instanceof File) formData.append('videos', file);
        });
        newTask.audios.forEach(file => {
            if (file instanceof File) formData.append('audios', file);
        });

        try {
            if (editingTask) {
                await api.patch(`tasks/${editingTask.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Task muvaffaqiyatli yangilandi!');
            } else {
                await api.post('tasks/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setNewTask({ title: '', description: '', assigned_to: '', status: 'TODO', images: [], videos: [], audios: [] });
            setShowForm(false);
            setEditingTask(null);
            fetchTasks();
        } catch (error) {
            alert('Xatolik yuz berdi! Ma\'lumotlarni tekshiring.');
        }
    };

    const deleteTask = async (id) => {
        if (window.confirm('Haqiqatan ham ushbu vazifani o\'chirmoqchimisiz?')) {
            try {
                await api.delete(`tasks/${id}/`);
                fetchTasks();
                if (selectedTask?.id === id) setSelectedTask(null);
            } catch (error) {
                alert('O\'chirishda xatolik!');
            }
        }
    };

    const handleEditTask = (task) => {
        setNewTask({
            title: task.title,
            description: task.description,
            assigned_to: task.assigned_to,
            status: task.status,
            images: [],
            videos: [],
            audios: []
        });
        setEditingTask(task);
        setShowForm(true);
        setSelectedTask(null); // Close detail modal if open
    };

    const registerProgrammer = async (e) => {
        e.preventDefault();
        try {
            if (editingProgrammer) {
                await api.patch(`programmers/${editingProgrammer.id}/update-user/`, newProgrammer);
                alert('Muvaffaqiyatli yangilandi!');
            } else {
                await api.post('programmers/create-user/', newProgrammer);
                alert('Foydalanuvchi muvaffaqiyatli qo\'shildi!');
            }
            setNewProgrammer({
                first_name: '', last_name: '', username: '', password: '',
                phone_number: '', address: '', experience: '', education: '', bio: '',
                is_programmer: true, is_tester: false, is_manager: false
            });
            setShowProgForm(false);
            setEditingProgrammer(null);
            fetchProgrammers();
        } catch (error) {
            alert('Xatolik yuz berdi. Ma\'lumotlarni tekshirib qaytadan urinib ko\'ring.');
        }
    };

    const deleteProgrammer = async (id) => {
        if (window.confirm('Haqiqatan ham ushbu xodimni va unga tegishli barcha ma\'lumotlarni o\'chirmoqchimisiz?')) {
            try {
                await api.delete(`programmers/${id}/`);
                fetchProgrammers();
            } catch (error) {
                alert('O\'chirishda xatolik!');
            }
        }
    };

    const handleEditProg = (prog) => {
        const [firstName, ...lastNameParts] = (prog.full_name || '').split(' ');
        setNewProgrammer({
            first_name: firstName || '',
            last_name: lastNameParts.join(' ') || '',
            username: '',
            password: '',
            phone_number: prog.phone_number || '',
            address: prog.address || '',
            experience: prog.experience || '',
            education: prog.education || '',
            bio: prog.bio || '',
            is_programmer: true,
            is_tester: false,
            is_manager: false
        });
        setEditingProgrammer(prog);
        setShowProgForm(true);
    };

    const approveTask = async (id) => {
        await api.post(`tasks/${id}/approve/`);
        fetchTasks();
    };

    const startTask = async (id) => {
        await api.post(`tasks/${id}/start/`);
        fetchTasks();
    };

    const rejectTask = async (id) => {
        await api.post(`tasks/${id}/reject/`);
        fetchTasks();
    };

    const getBadgeClass = (status) => {
        switch (status) {
            case 'PENDING': return 'badge-pending';
            case 'TODO': return 'badge-todo';
            case 'DONE': return 'badge-done';
            case 'REJECTED': return 'badge-rejected';
            case 'APPROVED': return 'badge-approved';
            default: return '';
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesProgrammer = filterProgrammer === '' || task.assigned_to === parseInt(filterProgrammer);
        const matchesStatus = filterStatus === '' || task.status === filterStatus;
        return matchesProgrammer && matchesStatus;
    });

    const stats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'TODO').length,
        pending: tasks.filter(t => t.status === 'PENDING').length,
        done: tasks.filter(t => t.status === 'DONE').length,
        programmers: programmers.length
    };

    return (
        <div className="platform-wrapper">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">TaskOS Admin</div>

                <nav className="sidebar-nav">
                    <div className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <span className="sidebar-icon">📊</span>
                        <span>Umumiy</span>
                    </div>
                    <div className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
                        <span className="sidebar-icon">📋</span>
                        <span>Vazifalar</span>
                    </div>
                    <div className={`sidebar-item ${activeTab === 'programmers' ? 'active' : ''}`} onClick={() => setActiveTab('programmers')}>
                        <span className="sidebar-icon">👥</span>
                        <span>Programmistlar</span>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile-mini">
                        <div className="user-avatar">{user?.full_name?.charAt(0) || 'A'}</div>
                        <div className="user-info">
                            <span className="user-name">{user?.full_name || 'Admin'}</span>
                            <span className="user-role">Administrator</span>
                        </div>
                    </div>
                    <button className="btn-outline" onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
                        Chiqish
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {activeTab === 'overview' && (
                    <div className="container">
                        <h2 style={{ marginBottom: '1.25rem' }}>Tizim ko'rinishi</h2>
                        <div className="stats-grid">
                            <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                                <span className="stat-label">Jami Vazifalar</span>
                                <span className="stat-value">{stats.total}</span>
                            </div>
                            <div className="card stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                                <span className="stat-label">Jarayonda</span>
                                <span className="stat-value">{stats.todo}</span>
                            </div>
                            <div className="card stat-card" style={{ borderLeft: '4px solid var(--text-muted)' }}>
                                <span className="stat-label">Navbatda</span>
                                <span className="stat-value">{stats.pending}</span>
                            </div>
                            <div className="card stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
                                <span className="stat-label">Tugatilgan</span>
                                <span className="stat-value">{stats.done}</span>
                            </div>
                            <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary-hover)' }}>
                                <span className="stat-label">Xodimlar</span>
                                <span className="stat-value">{stats.programmers}</span>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Oxirgi faollik</h3>
                            <div className="table-container">
                                <table className="task-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Vazifa</th>
                                            <th>Mas'ul</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.slice(0, 5).map(task => (
                                            <tr key={task.id}>
                                                <td>#{task.id}</td>
                                                <td style={{ fontWeight: '600' }}>{task.title}</td>
                                                <td>{task.assigned_to_name}</td>
                                                <td><span className={`badge ${getBadgeClass(task.status)}`}>{task.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>Vazifalar boshqaruvi</h2>
                            <button className="btn-primary" onClick={() => { setEditingTask(null); setNewTask({ title: '', description: '', assigned_to: '', status: 'TODO', images: [], videos: [], audios: [] }); setShowForm(true); }}>
                                + Yangi Task
                            </button>
                        </div>


                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Programmist bo'yicha</label>
                                <select value={filterProgrammer} onChange={(e) => setFilterProgrammer(e.target.value)}>
                                    <option value="">Barchasi</option>
                                    {programmers.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Status bo'yicha</label>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="">Barchasi</option>
                                    <option value="PENDING">Kutilmoqda</option>
                                    <option value="TODO">Bugun uchun</option>
                                    <option value="DONE">Bajarildi</option>
                                    <option value="REJECTED">Rad etildi</option>
                                    <option value="APPROVED">Tasdiqlandi</option>
                                </select>
                            </div>
                            <div className="view-toggle-group" style={{ height: '42px', marginTop: '22px' }}>
                                <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>Grid</button>
                                <button className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>Ro'yxat</button>
                            </div>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="task-grid">
                                {filteredTasks.map(task => (
                                    <div key={task.id} className="card" onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                                                className="btn-outline"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', minHeight: 'auto' }}
                                            >✎</button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                                className="btn-outline"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', minHeight: 'auto', color: 'var(--danger)' }}
                                            >🗑</button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingRight: '4rem' }}>
                                            <span className={`badge ${getBadgeClass(task.status)}`}>{task.status}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.assigned_to_name}</span>
                                        </div>
                                        <h4>{task.title}</h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: #{task.id}</p>
                                            {task.duration_info?.todo_to_done && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', padding: '0.2rem 0.5rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '4px' }}>
                                                    ⏱ {task.duration_info.todo_to_done}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="task-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Sarlavha</th>
                                            <th>Mas'ul</th>
                                            <th>Status</th>
                                            <th>Vaqt</th>
                                            <th>Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTasks.map(task => (
                                            <tr key={task.id} onClick={() => setSelectedTask(task)}>
                                                <td>#{task.id}</td>
                                                <td style={{ fontWeight: '600' }}>{task.title}</td>
                                                <td>{task.assigned_to_name}</td>
                                                <td><span className={`badge ${getBadgeClass(task.status)}`}>{task.status}</span></td>
                                                <td style={{ fontSize: '0.875rem' }}>{task.duration_info?.todo_to_done || '-'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                                                            className="btn-outline"
                                                            style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                                                        >✎</button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                                            className="btn-outline"
                                                            style={{ padding: '0.3rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                                                        >🗑</button>
                                                        {task.status === 'DONE' && (
                                                            <>
                                                                <button className="btn-success" onClick={(e) => { e.stopPropagation(); approveTask(task.id); }} style={{ padding: '0.4rem', fontSize: '0.7rem' }}>Ok</button>
                                                                <button className="btn-danger" onClick={(e) => { e.stopPropagation(); rejectTask(task.id); }} style={{ padding: '0.4rem', fontSize: '0.7rem' }}>X</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'programmers' && (
                    <div className="container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>Programmistlar boshqaruvi</h2>
                            <button className="btn-success" onClick={() => { setEditingProgrammer(null); setNewProgrammer({ first_name: '', last_name: '', username: '', password: '', phone_number: '', address: '', experience: '', education: '', bio: '', is_programmer: true, is_tester: false, is_manager: false }); setShowProgForm(true); }}>
                                + Yangi Programmist
                            </button>
                        </div>

                        <div className="task-grid">
                            {programmers.map(p => {
                                const activeTasksCount = tasks.filter(t => t.assigned_to === p.id && (t.status === 'TODO' || t.status === 'DONE')).length;
                                return (
                                    <div key={p.id} className="card" style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEditProg(p)}
                                                className="btn-outline"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', minHeight: 'auto' }}
                                            >✎</button>
                                            <button
                                                onClick={() => deleteProgrammer(p.id)}
                                                className="btn-outline"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', minHeight: 'auto', color: 'var(--danger)' }}
                                            >🗑</button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingRight: '4rem' }}>
                                            <h4 style={{ fontSize: '1.125rem' }}>{p.full_name}</h4>
                                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>#{p.id}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            <span>📞 {p.phone_number || 'Kiritilmagan'}</span>
                                            <span>📅 {p.experience || '0'} yil staj</span>
                                            <span style={{ color: activeTasksCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                                                {activeTasksCount > 0 ? `${activeTasksCount} ta faol vazifa` : 'Hozir bo\'sh'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Modals and Overlays */}
            {selectedTask && (
                <div className="image-modal">
                    <div className="card glass" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button className="close-modal" onClick={() => setSelectedTask(null)}>×</button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <span className={`badge ${getBadgeClass(selectedTask.status)}`}>{selectedTask.status}</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: #{selectedTask.id}</span>
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Mas'ul: {selectedTask.assigned_to_name}</span>
                        </div>

                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{selectedTask.title}</h2>

                        <div style={{ minHeight: '100px', marginBottom: '2rem' }}>
                            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tavsif</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedTask.description}</p>
                        </div>

                        {/* Attachments Section */}
                        {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Fayllar va Media</h4>

                                {/* Image Gallery */}
                                <div className="file-preview-grid" style={{ marginBottom: '1.5rem' }}>
                                    {selectedTask.attachments.filter(a => a.file_type === 'IMAGE').map(att => (
                                        <div key={att.id} className="file-preview-item" onClick={() => setPreviewImage(getFileUrl(att.file))}>
                                            <img src={getFileUrl(att.file)} alt="Task attachment" />
                                        </div>
                                    ))}
                                </div>

                                {/* Videos */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                    {selectedTask.attachments.filter(a => a.file_type === 'VIDEO').map(att => (
                                        <div key={att.id} className="card" style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
                                            <video src={getFileUrl(att.file)} controls style={{ width: '100%', borderRadius: '8px' }} />
                                            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Video ilova</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Audios */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {selectedTask.attachments.filter(a => a.file_type === 'AUDIO').map(att => (
                                        <div key={att.id} className="file-tag" style={{ padding: '0.75rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>🎵</span>
                                            <audio src={getFileUrl(att.file)} controls style={{ height: '32px', flex: 1 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--border)' }}>
                            <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vaqt hisoboti</h4>
                            <div style={{ fontSize: '0.9rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', border: 'none' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Yaratildi</p>
                                    <p style={{ fontWeight: '600' }}>{new Date(selectedTask.created_at).toLocaleString('ru-RU')}</p>
                                </div>
                                {selectedTask.todo_at && (
                                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', border: 'none' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Boshlandi</p>
                                        <p style={{ fontWeight: '600' }}>{new Date(selectedTask.todo_at).toLocaleString('ru-RU')}</p>
                                    </div>
                                )}
                                {selectedTask.done_at && (
                                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', border: 'none' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tugatildi</p>
                                        <p style={{ fontWeight: '600' }}>{new Date(selectedTask.done_at).toLocaleString('ru-RU')}</p>
                                    </div>
                                )}
                                {selectedTask.approved_at && (
                                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', border: 'none' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tasdiqlandi (Approved)</p>
                                        <p style={{ fontWeight: '700', color: 'var(--success)' }}>{new Date(selectedTask.approved_at).toLocaleString('ru-RU')}</p>
                                    </div>
                                )}
                                {selectedTask.rejected_at && (
                                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', border: 'none' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Rad etildi (Rejected)</p>
                                        <p style={{ fontWeight: '700', color: 'var(--danger)' }}>{new Date(selectedTask.rejected_at).toLocaleString('ru-RU')}</p>
                                    </div>
                                )}
                                {selectedTask.duration_info?.todo_to_done && (
                                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', border: 'none', gridColumn: 'span 2' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Sarflangan vaqt (Work duration)</p>
                                        <p style={{ fontWeight: '700', color: 'var(--primary)' }}>{selectedTask.duration_info.todo_to_done}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                            {selectedTask.status === 'PENDING' && (
                                <button className="btn-primary" style={{ flex: 1 }} onClick={() => { startTask(selectedTask.id); setSelectedTask(null); }}>
                                    Ishni boshlash (Start)
                                </button>
                            )}

                            {selectedTask.status === 'DONE' && (
                                <>
                                    <button className="btn-success" style={{ flex: 1 }} onClick={() => { approveTask(selectedTask.id); setSelectedTask(null); }}>√ Tasdiqlash</button>
                                    <button className="btn-danger" style={{ flex: 1 }} onClick={() => { rejectTask(selectedTask.id); setSelectedTask(null); }}>× Rad etish</button>
                                </>
                            )}

                            <button className="btn-outline" style={{ flex: 1 }} onClick={() => handleEditTask(selectedTask)}>
                                Tahrirlash (Edit)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="image-modal">
                    <div className="card glass" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
                        <button className="close-modal" onClick={() => setShowForm(false)}>×</button>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                            {editingTask ? `Vazifani tahrirlash: #${editingTask.id}` : 'Yangi Vazifa Biriktirish'}
                        </h3>
                        <form onSubmit={createTask}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Vazifa nomi</label>
                                <input placeholder="Masalan: Frontendi optimizatsiya qilish" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Tavsif</label>
                                <textarea placeholder="Batafsil ma'lumot..." value={newTask.description} style={{ minHeight: '120px' }} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label>Mas'ul shaxs</label>
                                    <select value={newTask.assigned_to} onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })} required>
                                        <option value="">Tanlang...</option>
                                        {programmers.map(p => (
                                            <option key={p.id} value={p.id}>{p.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Status</label>
                                    <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}>
                                        <option value="TODO">Todo</option>
                                        <option value="PENDING">Pending</option>
                                        {editingTask && (
                                            <>
                                                <option value="DONE">Done</option>
                                                <option value="APPROVED">Approved</option>
                                                <option value="REJECTED">Rejected</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Media Fayllar (Ixtiyoriy)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div className="file-tag" style={{ flexDirection: 'column', padding: '0.5rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📷</span>
                                        <input type="file" multiple accept="image/*" id="task-images" hidden onChange={(e) => handleFileChange(e, 'images')} />
                                        <label htmlFor="task-images" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>Rasmlar ({newTask.images.length})</label>
                                    </div>
                                    <div className="file-tag" style={{ flexDirection: 'column', padding: '0.5rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🎬</span>
                                        <input type="file" multiple accept="video/*" id="task-videos" hidden onChange={(e) => handleFileChange(e, 'videos')} />
                                        <label htmlFor="task-videos" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>Videolar ({newTask.videos.length})</label>
                                    </div>
                                    <div className="file-tag" style={{ flexDirection: 'column', padding: '0.5rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🎤</span>
                                        <input type="file" multiple accept="audio/*" id="task-audios" hidden onChange={(e) => handleFileChange(e, 'audios')} />
                                        <label htmlFor="task-audios" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>Audiolar ({newTask.audios.length})</label>
                                    </div>
                                </div>

                                {/* Selected Files List */}
                                {(newTask.images.length > 0 || newTask.videos.length > 0 || newTask.audios.length > 0) && (
                                    <div className="card" style={{ background: 'rgba(0,0,0,0.1)', padding: '0.75rem', border: '1px dashed var(--border)' }}>
                                        {newTask.images.length > 0 && (
                                            <div className="file-preview-grid" style={{ marginBottom: '0.5rem' }}>
                                                {newTask.images.map((f, i) => (
                                                    <div key={i} className="file-preview-item">
                                                        <img src={URL.createObjectURL(f)} alt="preview" />
                                                        <button type="button" onClick={() => removeFile('images', i)} className="remove-file">×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {newTask.videos.map((f, i) => (
                                                <div key={i} className="file-tag">
                                                    <span style={{ fontSize: '0.75rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                                                    <button type="button" onClick={() => removeFile('videos', i)}>×</button>
                                                </div>
                                            ))}
                                            {newTask.audios.map((f, i) => (
                                                <div key={i} className="file-tag">
                                                    <span style={{ fontSize: '0.75rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                                                    <button type="button" onClick={() => removeFile('audios', i)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
                                {editingTask ? 'O\'zgarishlarni saqlash' : 'Vazifani biriktirish'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showProgForm && (
                <div className="image-modal">
                    <div className="card glass" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
                        <button className="close-modal" onClick={() => setShowProgForm(false)}>×</button>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                            {editingProgrammer ? `Programmist tahrirlash: ${editingProgrammer.full_name}` : 'Yangi Programmist Qo\'shish'}
                        </h3>
                        <form onSubmit={registerProgrammer}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label>Ism</label>
                                    <input placeholder="Aziz" value={newProgrammer.first_name} onChange={(e) => setNewProgrammer({ ...newProgrammer, first_name: e.target.value })} required />
                                </div>
                                <div>
                                    <label>Familiya</label>
                                    <input placeholder="Rahimov" value={newProgrammer.last_name} onChange={(e) => setNewProgrammer({ ...newProgrammer, last_name: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label>Rollar</label>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={newProgrammer.is_programmer} onChange={(e) => setNewProgrammer({ ...newProgrammer, is_programmer: e.target.checked })} /> Programmist
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={newProgrammer.is_tester} onChange={(e) => setNewProgrammer({ ...newProgrammer, is_tester: e.target.checked })} /> Tester
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={newProgrammer.is_manager} onChange={(e) => setNewProgrammer({ ...newProgrammer, is_manager: e.target.checked })} /> Boshliq
                                    </label>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label>Telefon</label>
                                    <input placeholder="+998..." value={newProgrammer.phone_number} onChange={(e) => setNewProgrammer({ ...newProgrammer, phone_number: e.target.value })} />
                                </div>
                                <div>
                                    <label>Tajriba (yil)</label>
                                    <input type="number" placeholder="3" value={newProgrammer.experience} onChange={(e) => setNewProgrammer({ ...newProgrammer, experience: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label>{editingProgrammer ? 'Yangi parol (ixtiyoriy)' : 'Parol'}</label>
                                <input type="password" placeholder="••••••••" value={newProgrammer.password} onChange={(e) => setNewProgrammer({ ...newProgrammer, password: e.target.value })} required={!editingProgrammer} />
                            </div>
                            <button type="submit" className="btn-success" style={{ width: '100%', padding: '1rem' }}>
                                {editingProgrammer ? 'Yangilash' : 'Saqlash'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {previewImage && (
                <div
                    className="image-modal"
                    onClick={() => { setPreviewImage(null); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                    onWheel={(e) => {
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -0.1 : 0.1;
                        setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.5), 5));
                    }}
                >
                    <button className="close-modal" onClick={() => { setPreviewImage(null); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}>×</button>

                    <div className="zoom-controls" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 5))}>+</button>
                        <button onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}>Reset</button>
                        <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}>-</button>
                    </div>

                    <div
                        style={{
                            cursor: zoomLevel > 1 ? 'grab' : 'default',
                            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                            transition: isDragging ? 'none' : 'transform 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseDown={(e) => {
                            if (zoomLevel > 1) {
                                setIsDragging(true);
                                setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                            }
                        }}
                        onMouseMove={(e) => {
                            if (isDragging) {
                                setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                            }
                        }}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={previewImage}
                            alt="Full screen preview"
                            style={{
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
