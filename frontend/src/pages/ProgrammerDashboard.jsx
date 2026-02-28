import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProgrammerDashboard = () => {
    const API_URL = 'http://localhost:8000';
    const [tasks, setTasks] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [selectedTask, setSelectedTask] = useState(null);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        const res = await api.get('tasks/');
        setTasks(res.data);
    };

    const completeTask = async (id) => {
        await api.post(`tasks/${id}/complete/`);
        fetchTasks();
    };

    const startTask = async (id) => {
        await api.post(`tasks/${id}/start/`);
        fetchTasks();
    };

    const getFileUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${API_URL}${path}`;
    };

    const getBadgeClass = (status) => {
        switch (status) {
            case 'TODO': return 'badge-todo';
            case 'DONE': return 'badge-done';
            case 'REJECTED': return 'badge-rejected';
            case 'APPROVED': return 'badge-approved';
            default: return '';
        }
    };

    const activeTask = tasks.find(t => t.status === 'TODO' || t.status === 'REJECTED');

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <nav className="navbar" style={{ marginBottom: '2rem', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Salom, {user?.full_name}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Programmist</span>
                        <button className="btn-outline" onClick={() => { logout(); navigate('/login'); }} style={{ width: 'auto', padding: '0.5rem 1rem' }}>Chiqish</button>
                    </div>
                    {user?.phone_number && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{user.phone_number}</span>}
                </div>
            </nav>

            {activeTask ? (
                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Joriy Vazifa</h3>
                    <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <span className={`badge ${getBadgeClass(activeTask.status)}`}>Bajarilmoqda</span>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Bugun topshirilishi kerak</span>
                        </div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>{activeTask.title}</h2>
                        <p style={{ color: 'var(--text-main)', fontSize: '1.125rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            {activeTask.description}
                        </p>

                        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {activeTask.attachments?.map((att, index) => (
                                <div key={index} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        {att.file_type === 'IMAGE' ? 'Rasm:' : att.file_type === 'VIDEO' ? 'Video:' : 'Ovozli xabar:'}
                                    </p>
                                    {att.file_type === 'IMAGE' && (
                                        <img
                                            src={getFileUrl(att.file)}
                                            alt="Task"
                                            style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                                            onClick={() => setPreviewImage(getFileUrl(att.file))}
                                        />
                                    )}
                                    {att.file_type === 'VIDEO' && (
                                        <video controls style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <source src={getFileUrl(att.file)} />
                                        </video>
                                    )}
                                    {att.file_type === 'AUDIO' && (
                                        <audio controls style={{ width: '100%' }}>
                                            <source src={getFileUrl(att.file)} />
                                        </audio>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button className="btn-primary" onClick={() => completeTask(activeTask.id)} style={{ fontSize: '1rem', padding: '1rem' }}>
                            Bajardim deb belgilash
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderDash: '2px dashed var(--border)' }}>
                    <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Yangi vazifalar yo'q</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Hozircha sizga biriktirilgan faol vazifalar mavjud emas.</p>
                </div>
            )}

            {selectedTask && (
                <div className="image-modal">
                    <div className="card glass" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button className="close-modal" onClick={() => setSelectedTask(null)}>×</button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <span className={`badge ${getBadgeClass(selectedTask.status)}`}>{selectedTask.status}</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: #{selectedTask.id}</span>
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Vazifa tafsilotlari</span>
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
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Ishlash vaqti (Duration)</p>
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

                            {(selectedTask.status === 'TODO' || selectedTask.status === 'REJECTED') && (
                                <button className="btn-success" style={{ flex: 1 }} onClick={() => { completeTask(selectedTask.id); setSelectedTask(null); }}>
                                    Bajardim deb belgilash (Complete)
                                </button>
                            )}

                            <button className="btn-outline" style={{ flex: 1 }} onClick={() => setSelectedTask(null)}>
                                Yopish
                            </button>
                        </div>
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
                                userSelect: 'none',
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgrammerDashboard;
