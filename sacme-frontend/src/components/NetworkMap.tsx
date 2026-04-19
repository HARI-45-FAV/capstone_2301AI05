"use client";
import { getAuthToken } from '@/lib/auth';

import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import { Download, Loader2, Maximize } from 'lucide-react';
import { AdminNode, BranchNode, AdvisorNode, ProfessorNode, CourseNode, StudentCountNode } from './NetworkMapNodes';

const nodeTypes = {
  ADMIN_NODE: AdminNode,
  BRANCH_NODE: BranchNode,
  ADVISOR_NODE: AdvisorNode,
  PROFESSOR_NODE: ProfessorNode,
  COURSE_NODE: CourseNode,
  STUDENT_COUNT_NODE: StudentCountNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    // Estimating node sizes
    dagreGraph.setNode(node.id, { width: 220, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';

    node.position = {
      x: nodeWithPosition.x - 110,
      y: nodeWithPosition.y - 50,
    };

    return node;
  });

  return { nodes, edges };
};

export default function NetworkMap() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const mapRef = useRef(null);

    const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());
    const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set());
    const graphDataRef = useRef<{nodes: any[], edges: any[]}>({ nodes: [], edges: [] });

    useEffect(() => {
        const fetchMap = async () => {
            const token = getAuthToken();
            const res = await fetch('http://localhost:5000/api/network-map', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                buildGraph(data);
            }
            setLoading(false);
        };
        fetchMap();
    }, []);

    const handleNodeClick = useCallback((nodeData: any) => {
        setSelectedNode(nodeData);
        // Expand/Collapse logic can be here by modifying hiddenNodes, but for now we just show a popup.
    }, []);

    const buildGraph = (data: any) => {
        const initialNodes: any[] = [];
        const initialEdges: any[] = [];

        // Flatten hierarchy
        data.admins.forEach((admin: any) => {
            initialNodes.push({ id: admin.id, type: 'ADMIN_NODE', data: { name: admin.name, onNodeClick: handleNodeClick } });

            admin.branches.forEach((branch: any) => {
                initialNodes.push({ id: branch.id, type: 'BRANCH_NODE', data: { ...branch, onNodeClick: handleNodeClick } });
                initialEdges.push({ id: `e-${admin.id}-${branch.id}`, source: admin.id, target: branch.id, animated: true, style: { stroke: '#6366f1' } });

                // Advisors
                branch.facultyAdvisors.forEach((advisor: any) => {
                    initialNodes.push({ id: advisor.id, type: 'ADVISOR_NODE', data: { ...advisor, onNodeClick: handleNodeClick } });
                    initialEdges.push({ id: `e-${branch.id}-${advisor.id}`, source: branch.id, target: advisor.id });

                    // Professors mapped to advisor
                    advisor.professors.forEach((prof: any) => {
                        initialNodes.push({ id: prof.id, type: 'PROFESSOR_NODE', data: { ...prof, onNodeClick: handleNodeClick } });
                        initialEdges.push({ id: `e-${advisor.id}-${prof.id}`, source: advisor.id, target: prof.id });

                        // Courses
                        prof.courses.forEach((course: any) => {
                            initialNodes.push({ id: course.id, type: 'COURSE_NODE', data: { ...course, onNodeClick: handleNodeClick } });
                            initialEdges.push({ id: `e-${prof.id}-${course.id}`, source: prof.id, target: course.id });

                            // Student Count
                            const studentCountId = `student-${course.id}`;
                            initialNodes.push({ id: studentCountId, type: 'STUDENT_COUNT_NODE', data: { count: course.studentsCount, onNodeClick: handleNodeClick } });
                            initialEdges.push({ id: `e-${course.id}-${studentCountId}`, source: course.id, target: studentCountId, style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' } });
                        });
                    });
                });
            });
        });

        graphDataRef.current = { nodes: initialNodes, edges: initialEdges };
        applyLayoutAndState(initialNodes, initialEdges, collapsedBranches);
    };

    const handleCollapseToggle = useCallback((branchId: string) => {
        setCollapsedBranches((prev) => {
            const next = new Set(prev);
            if (next.has(branchId)) next.delete(branchId);
            else next.add(branchId);
            return next;
        });
    }, []);

    useEffect(() => {
        if (graphDataRef.current.nodes.length > 0) {
            applyLayoutAndState(graphDataRef.current.nodes, graphDataRef.current.edges, collapsedBranches);
        }
    }, [collapsedBranches]);

    const applyLayoutAndState = (initialNodes: any[], initialEdges: any[], collapsed: Set<string>) => {
        const hiddenSet = new Set<string>();

        const getDescendants = (nodeId: string) => {
            const children = initialEdges.filter(e => e.source === nodeId).map(e => e.target);
            children.forEach(childId => {
                hiddenSet.add(childId);
                getDescendants(childId);
            });
        };

        collapsed.forEach(branchId => getDescendants(branchId));

        const visibleNodes = initialNodes.map(n => ({
            ...n,
            hidden: hiddenSet.has(n.id),
            data: { 
                ...n.data,
                isCollapsed: collapsed.has(n.id),
                onCollapseToggle: n.type === 'BRANCH_NODE' ? handleCollapseToggle : undefined
            }
        }));
        
        const visibleEdges = initialEdges.map(e => ({
            ...e, 
            hidden: hiddenSet.has(e.source) || hiddenSet.has(e.target)
        }));

        const activeNodesForLayout = visibleNodes.filter(n => !n.hidden);
        const activeEdgesForLayout = visibleEdges.filter(e => !e.hidden);

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(activeNodesForLayout, activeEdgesForLayout);

        // Merge updated coordinates into the full array (React Flow likes having full domain with hidden properties)
        const finalNodes = visibleNodes.map(n => {
            const layoutNode = layoutedNodes.find((ln:any) => ln.id === n.id);
            return layoutNode ? layoutNode : n;
        });

        setNodes(finalNodes);
        setEdges(visibleEdges);
    };

    const exportToImage = () => {
        if (!mapRef.current) return;
        toPng(mapRef.current, { backgroundColor: '#f8fafc' })
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = 'sacme_network_map.png';
            link.href = dataUrl;
            link.click();
          });
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin"/></div>;

    return (
        <div className="w-full h-full relative" ref={mapRef}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-slate-50 dark:bg-slate-950"
            >
                <Panel position="top-right" className="bg-white/80 dark:bg-black/50 p-2 rounded-xl shadow-lg backdrop-blur-md flex gap-2">
                    <button onClick={exportToImage} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors">
                        <Download className="w-4 h-4"/> Export PNG
                    </button>
                </Panel>
                <Controls />
                <MiniMap zoomable pannable nodeColor={(n)=> n.type === 'ADMIN_NODE' ? '#333' : '#6366f1'} />
                <Background color="#ccc" gap={16} />
            </ReactFlow>

            {/* Modal for Details */}
            {selectedNode && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                            ✕
                        </button>
                        
                        <div className="mt-4 mb-4 text-center flex flex-col items-center">
                            {selectedNode.avatar ? (
                                <img src={`http://localhost:5000${selectedNode.avatar}`} className="w-20 h-20 rounded-full border-4 border-indigo-100 object-cover mb-3" />
                            ) : (
                                <div className="w-20 h-20 rounded-full border-4 border-indigo-100 bg-indigo-50 text-indigo-500 font-bold text-3xl flex items-center justify-center mb-3">
                                    {selectedNode.name ? selectedNode.name.split(' ').map((n:string)=>n.charAt(0)).slice(0,2).join('').toUpperCase() : '?'}
                                </div>
                            )}
                            <h3 className="text-xl font-black">{selectedNode.name || 'Details'}</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                                {selectedNode.nodeType?.replace('_NODE','').replace('_',' ')}
                            </p>
                        </div>
                        
                        <div className="space-y-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm mt-4">
                            {selectedNode.department && <p><strong>Department:</strong> {selectedNode.department}</p>}
                            {selectedNode.email && <p><strong>Email:</strong> {selectedNode.email}</p>}
                            {selectedNode.phone && <p><strong>Phone:</strong> {selectedNode.phone}</p>}
                            {selectedNode.code && <p><strong>Course Code:</strong> {selectedNode.code}</p>}
                            {selectedNode.credits && <p><strong>Credits:</strong> {selectedNode.credits}</p>}
                            {selectedNode.interests && <p><strong>Interests:</strong> {selectedNode.interests}</p>}
                            {selectedNode.count !== undefined && <p className="text-emerald-600 font-black">Total Students: {selectedNode.count}</p>}
                        </div>

                        <div className="mt-6 flex gap-2">
                             <button className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200" onClick={() => setSelectedNode(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
