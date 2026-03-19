import React from 'react';
import ProjectCard from './ProjectCard';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';

const ProjectList = ({ projects, searchQuery, emptyMessage }) => {
    const { theme } = useTheme();

    const styles = {
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
        },
        emptyState: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px',
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.lg,
            boxShadow: theme.shadows.neumorphicInset,
        },
        emptyText: {
            fontSize: '16px',
            color: theme.textSecondary,
            margin: 0,
        },
    };

    if (!projects || projects.length === 0) {
        return (
            <div style={styles.emptyState}>
                <p style={styles.emptyText}>
                    {searchQuery ? 'No projects match your search.' : (emptyMessage || 'No projects yet. Create one!')}
                </p>
            </div>
        );
    }

    return (
        <div style={styles.grid}>
            {projects.map(project => (
                <ProjectCard key={project._id} project={project} />
            ))}
        </div>
    );
};

export default ProjectList;
