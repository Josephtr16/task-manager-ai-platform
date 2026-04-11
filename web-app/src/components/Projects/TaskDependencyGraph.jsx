import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

const TaskDependencyGraph = ({ tasks }) => {
  const { theme } = useTheme();

  const graph = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { nodes: [], edges: [], hasAnyDependencies: false, width: 0, height: 0 };
    }

    const hasAnyDependencies = tasks.some((task) => Array.isArray(task.dependencies) && task.dependencies.length > 0);

    if (!hasAnyDependencies) {
      return { nodes: [], edges: [], hasAnyDependencies: false, width: 0, height: 0 };
    }

    const taskMap = new Map(tasks.map((task) => [task._id, task]));
    const taskDepths = {};

    const calculateDepth = (taskId, visited = new Set()) => {
      if (visited.has(taskId)) return 0;
      if (taskDepths[taskId] !== undefined) return taskDepths[taskId];

      const task = taskMap.get(taskId);
      const deps = Array.isArray(task?.dependencies) ? task.dependencies : [];

      if (!task || deps.length === 0) {
        taskDepths[taskId] = 0;
        return 0;
      }

      const nextVisited = new Set(visited);
      nextVisited.add(taskId);

      const maxDependencyDepth = Math.max(
        ...deps
          .filter((depId) => taskMap.has(depId))
          .map((depId) => calculateDepth(depId, nextVisited)),
      );

      taskDepths[taskId] = maxDependencyDepth + 1;
      return taskDepths[taskId];
    };

    tasks.forEach((task) => calculateDepth(task._id));

    const tasksByDepth = {};
    Object.entries(taskDepths).forEach(([taskId, depth]) => {
      if (!tasksByDepth[depth]) tasksByDepth[depth] = [];
      tasksByDepth[depth].push(taskId);
    });

    const sortedDepths = Object.keys(tasksByDepth)
      .map((depth) => Number(depth))
      .sort((a, b) => a - b);

    sortedDepths.forEach((depth) => {
      if (depth === 0) {
        tasksByDepth[depth].sort((a, b) => {
          const taskA = taskMap.get(a);
          const taskB = taskMap.get(b);
          return (taskA?.title || '').localeCompare(taskB?.title || '');
        });
        return;
      }

      const previousDepthIds = new Set(tasksByDepth[depth - 1] || []);
      tasksByDepth[depth].sort((a, b) => {
        const taskA = taskMap.get(a);
        const taskB = taskMap.get(b);

        const depA = (taskA?.dependencies || []).findIndex((depId) => previousDepthIds.has(depId));
        const depB = (taskB?.dependencies || []).findIndex((depId) => previousDepthIds.has(depId));

        if (depA !== depB) return depA - depB;
        return (taskA?.title || '').localeCompare(taskB?.title || '');
      });
    });

    const nodePositions = {};
    const nodeWidth = 176;
    const nodeHeight = 56;
    const columnGap = 120;
    const rowGap = 38;
    const paddingX = 48;
    const paddingY = 34;
    const columnWidth = nodeWidth + columnGap;
    const rowHeight = nodeHeight + rowGap;

    const maxRows = Math.max(...sortedDepths.map((depth) => tasksByDepth[depth].length));
    const graphHeight = paddingY * 2 + Math.max(1, maxRows) * rowHeight;

    sortedDepths.forEach((depth, columnIndex) => {
      const taskIds = tasksByDepth[depth];
      const columnHeight = taskIds.length * rowHeight;
      const yStart = Math.max(paddingY, (graphHeight - columnHeight) / 2);

        taskIds.forEach((taskId, rowIndex) => {
          nodePositions[taskId] = {
            x: paddingX + columnIndex * columnWidth,
            y: yStart + rowIndex * rowHeight,
          };
        });
    });

    const edges = [];
    tasks.forEach((task) => {
      const deps = Array.isArray(task.dependencies) ? task.dependencies : [];
      deps.forEach((depId) => {
        if (taskMap.has(depId)) {
          edges.push({ from: depId, to: task._id });
        }
      });
    });

    const width = paddingX * 2 + sortedDepths.length * columnWidth - columnGap;
    const height = graphHeight;

    return {
      nodes: tasks.map((task) => ({
        _id: task._id,
        title: task.title,
        status: task.status,
        x: nodePositions[task._id]?.x || paddingX,
        y: nodePositions[task._id]?.y || paddingY,
        width: nodeWidth,
        height: nodeHeight,
      })),
      edges,
      hasAnyDependencies: true,
      width,
      height,
    };
  }, [tasks]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return theme.success || '#10b981';
      case 'in-progress':
        return theme.primary || '#3b82f6';
      case 'todo':
      default:
        return theme.textMuted || '#9ca3af';
    }
  };

  const truncateTitle = (title, maxLength = 20) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  if (!graph.hasAnyDependencies) {
    return (
      <div style={{
        padding: '28px',
        textAlign: 'center',
        color: theme.textMuted,
        fontSize: '14px',
        border: `1px dashed ${theme.border}`,
        borderRadius: '10px',
        backgroundColor: theme.bgElevated,
      }}>
        No dependencies configured
      </div>
    );
  }

  const viewBoxString = `0 0 ${graph.width} ${graph.height}`;

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '12px',
      }}>
        {[
          { label: 'Todo', key: 'todo' },
          { label: 'In progress', key: 'in-progress' },
          { label: 'Done', key: 'done' },
        ].map((item) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.textSecondary }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                backgroundColor: getStatusColor(item.key),
              }}
            />
            {item.label}
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto', border: `1px solid ${theme.border}`, borderRadius: '10px' }}>
        <svg
          viewBox={viewBoxString}
          style={{
            width: '100%',
            minWidth: `${Math.max(740, graph.width)}px`,
            height: 'auto',
            minHeight: '320px',
            backgroundColor: theme.bgElevated,
          }}
        >
          <defs>
            <marker
              id="dep-arrowhead"
              markerWidth="9"
              markerHeight="9"
              refX="7"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 8 3.5, 0 7" fill={theme.primary} />
            </marker>
          </defs>

          {graph.edges.map((edge, idx) => {
            const fromNode = graph.nodes.find((n) => n._id === edge.from);
            const toNode = graph.nodes.find((n) => n._id === edge.to);

            if (!fromNode || !toNode) return null;

            const x1 = fromNode.x + fromNode.width;
            const y1 = fromNode.y + fromNode.height / 2;
            const x2 = toNode.x;
            const y2 = toNode.y + toNode.height / 2;
            const curveOffset = Math.max(34, Math.abs(y2 - y1) * 0.24);

            const pathData = `M ${x1} ${y1} C ${x1 + curveOffset} ${y1}, ${x2 - curveOffset} ${y2}, ${x2} ${y2}`;

            return (
              <path
                key={`edge-${idx}`}
                d={pathData}
                stroke={theme.primary}
                strokeWidth="1.8"
                fill="none"
                markerEnd="url(#dep-arrowhead)"
                opacity="0.66"
              />
            );
          })}

          {graph.nodes.map((node) => {
            const color = getStatusColor(node.status);

            return (
              <g key={node._id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx="12"
                  fill={theme.bgMain}
                  stroke={theme.border}
                  strokeWidth="1.2"
                />
                <rect
                  x={node.x + 8}
                  y={node.y + 8}
                  width="6"
                  height={node.height - 16}
                  rx="4"
                  fill={color}
                />

                <text
                  x={node.x + 20}
                  y={node.y + 31}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill={theme.textPrimary}
                  pointerEvents="none"
                >
                  {truncateTitle(node.title || 'Untitled task', 20)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default TaskDependencyGraph;
