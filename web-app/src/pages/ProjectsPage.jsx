import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
// removed useAuth
import projectService from '../services/projectService';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import ProjectList from '../components/Projects/ProjectList';
import CreateProjectModal from '../components/Projects/CreateProjectModal';
import { FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import CustomSelect from '../components/common/CustomSelect';

const ProjectsPage = () => {
    const { theme } = useTheme();
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projects, searchQuery, statusFilter, categoryFilter]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getProjects(localStorage.getItem('token'));
            setProjects(data);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...projects];

        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        setFilteredProjects(filtered);
    };

    const handleProjectCreated = async (projectData) => {
        try {
            const newProject = await projectService.createProject(projectData, localStorage.getItem('token'));
            setProjects([newProject, ...projects]);
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating project:', error);
        }
    };

    const styles = {
        container: {
            padding: '32px',
            minHeight: '100vh',
            backgroundColor: theme.bgMain,
        },
        loading: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            color: theme.textPrimary,
            gap: '16px',
        },
        spinner: {
            width: '40px',
            height: '40px',
            border: `4px solid ${theme.bgMain}`,
            borderTop: `4px solid ${theme.primary}`,
            boxShadow: theme.shadows.neumorphic,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '32px',
        },
        title: {
            fontSize: '32px',
            fontWeight: '800',
            color: theme.textPrimary,
            margin: '0 0 4px 0',
            textShadow: theme.type === 'dark' ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
        },
        subtitle: {
            fontSize: '14px',
            color: theme.textSecondary,
            margin: 0,
        },
        createButton: {
            backgroundColor: theme.primary,
            color: '#fff',
            border: 'none',
            borderRadius: borderRadius.lg,
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
        },
        filtersContainer: {
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: theme.shadows.neumorphic,
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        },
        searchContainer: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
        },
        searchIcon: {
            position: 'absolute',
            left: '16px',
            fontSize: '16px',
            color: theme.textMuted,
            pointerEvents: 'none',
            zIndex: 1,
        },
        searchInput: {
            width: '100%',
            backgroundColor: theme.bgMain,
            border: 'none',
            borderRadius: borderRadius.md,
            padding: '12px 16px 12px 48px',
            fontSize: '14px',
            color: theme.textPrimary,
            outline: 'none',
            boxShadow: theme.shadows.neumorphicInset,
        },
        clearSearch: {
            position: 'absolute',
            right: '12px',
            background: 'none',
            border: 'none',
            color: theme.textMuted,
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
        },
        filtersRow: {
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center',
        },
        fab: {
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: theme.primary,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            boxShadow: theme.type === 'dark' ? '8px 8px 16px rgba(0,0,0,0.4), -8px -8px 16px rgba(255,255,255,0.05)' : '8px 8px 16px rgba(0,0,0,0.2), -8px -8px 16px rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            transition: 'all 0.3s ease',
        },
    };

    if (loading) {
        return (
            <Layout>
                <div style={styles.loading}>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <div style={styles.spinner} />
                    <p>Loading projects...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <style>{`
                .create-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px ${theme.primary}66 !important;
                }
                .fab:hover {
                    transform: scale(1.1) rotate(90deg);
                    box-shadow: 0 0 20px ${theme.primary}80 !important;
                }
            `}</style>
            <div style={styles.container}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Projects</h1>
                        <p style={styles.subtitle}>
                            Manage your long-term goals and group tasks together.
                        </p>
                    </div>
                    <button
                        style={styles.createButton}
                        className="create-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FaPlus style={{ marginRight: '8px' }} /> New Project
                    </button>
                </div>

                <div style={styles.filtersContainer}>
                    <div style={styles.searchContainer}>
                        <FaSearch style={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={styles.clearSearch}
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                    <div style={styles.filtersRow}>
                        <div style={{ width: '200px' }}>
                            <CustomSelect
                                options={[
                                    { value: 'all', label: 'All Status' },
                                    { value: 'not-started', label: 'Not Started' },
                                    { value: 'in-progress', label: 'In Progress' },
                                    { value: 'completed', label: 'Completed' }
                                ]}
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val)}
                                placeholder="Status"
                            />
                        </div>
                        <div style={{ width: '200px' }}>
                            <CustomSelect
                                options={[
                                    { value: 'all', label: 'All Categories' },
                                    { value: 'Work', label: 'Work' },
                                    { value: 'Personal', label: 'Personal' },
                                    { value: 'Health', label: 'Health' },
                                    { value: 'Learning', label: 'Learning' },
                                    { value: 'Shopping', label: 'Shopping' },
                                    { value: 'Family', label: 'Family' }
                                ]}
                                value={categoryFilter}
                                onChange={(val) => setCategoryFilter(val)}
                                placeholder="Category"
                            />
                        </div>
                    </div>
                </div>

                <ProjectList 
                    projects={filteredProjects} 
                    searchQuery={searchQuery} 
                    emptyMessage="No projects yet. Start by creating one!" 
                />

                <CreateProjectModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onProjectCreated={handleProjectCreated}
                />

                <button
                    style={styles.fab}
                    onClick={() => setShowCreateModal(true)}
                    className="fab"
                >
                    <FaPlus />
                </button>
            </div>
        </Layout>
    );
};

export default ProjectsPage;
