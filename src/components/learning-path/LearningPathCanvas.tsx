'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    Connection,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    BackgroundVariant,
    ReactFlowProvider,
    useReactFlow,
    updateEdge,
    EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import LearningNode, { LearningNodeData } from './LearningNode';
import ValidationEdge from './ValidationEdge';
import ValidationResult from './ValidationResult';
import NodeSidebar from './NodeSidebar';
import AddNodeModal from './AddNodeModal';
import ImplementModal from './ImplementModal';
import { Topic } from '@/types/database';

const nodeTypes = {
    learningNode: LearningNode,
};

const edgeTypes = {
    validation: ValidationEdge,
};

interface LearningPathCanvasProps {
    topic: Topic;
    workflowId?: string;
    userId?: string;
    onSave?: (data: { title: string; edges: Edge[]; positions: Record<string, { x: number; y: number }>; isDraft?: boolean }) => void;
    initialData?: {
        edges: Array<{ source_node: LearningNodeData & { id: string }; target_node: LearningNodeData & { id: string } }>;
        node_positions: Record<string, { x: number; y: number }>;
    };
}

interface ValidationState {
    isOpen: boolean;
    isLoading: boolean;
    isValid: boolean;
    fromNode: string;
    toNode: string;
    reason: string;
    recommendation?: string;
}

function LearningPathCanvasInner({ topic, workflowId, userId, onSave, initialData }: LearningPathCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [validation, setValidation] = useState<ValidationState>({
        isOpen: false,
        isLoading: false,
        isValid: false,
        fromNode: '',
        toNode: '',
        reason: '',
    });
    const [showAddNode, setShowAddNode] = useState(false);
    const [showImplement, setShowImplement] = useState(false);
    const [title, setTitle] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
    const [isReadOnly, setIsReadOnly] = useState(!!initialData);  // Read-only if imported
    const [isEditing, setIsEditing] = useState(false);

    const pendingEdgeRef = useRef<Edge | null>(null);
    const reactFlowInstance = useReactFlow();

    // Load initial data if editing/forking
    useEffect(() => {
        if (initialData?.edges && initialData.edges.length > 0) {
            console.log('Loading initial data:', initialData);
            const loadedNodes: Node<LearningNodeData>[] = [];
            const nodeIds = new Set<string>();

            initialData.edges.forEach(edge => {
                // Backend returns source_node/target_node with learning_nodes table structure
                const sourceNode = edge.source_node as unknown as {
                    id: string;
                    title: string;
                    description?: string;
                    icon?: string;
                    color?: string
                };
                const targetNode = edge.target_node as unknown as {
                    id: string;
                    title: string;
                    description?: string;
                    icon?: string;
                    color?: string
                };

                if (sourceNode && !nodeIds.has(sourceNode.id)) {
                    nodeIds.add(sourceNode.id);
                    const pos = initialData.node_positions?.[sourceNode.id] || {
                        x: 100 + loadedNodes.length * 300,
                        y: 200
                    };
                    loadedNodes.push({
                        id: sourceNode.id,
                        type: 'learningNode',
                        position: pos,
                        data: {
                            label: sourceNode.title,
                            description: sourceNode.description,
                            color: sourceNode.color || '#6366f1'
                        }
                    });
                }
                if (targetNode && !nodeIds.has(targetNode.id)) {
                    nodeIds.add(targetNode.id);
                    const pos = initialData.node_positions?.[targetNode.id] || {
                        x: 100 + loadedNodes.length * 300,
                        y: 200
                    };
                    loadedNodes.push({
                        id: targetNode.id,
                        type: 'learningNode',
                        position: pos,
                        data: {
                            label: targetNode.title,
                            description: targetNode.description,
                            color: targetNode.color || '#6366f1'
                        }
                    });
                }
            });

            console.log('Loaded nodes:', loadedNodes);
            setNodes(loadedNodes);

            // Load edges after nodes with ValidationEdge type
            setTimeout(async () => {
                const loadedEdges: Edge[] = [];

                for (const e of initialData.edges.filter(edge => edge.source_node && edge.target_node)) {
                    const sourceNode = e.source_node as unknown as { id: string; title: string };
                    const targetNode = e.target_node as unknown as { id: string; title: string };
                    const edgeId = `e${sourceNode.id}-${targetNode.id}`;

                    console.log('Loading edge:', sourceNode.title, '->', targetNode.title);

                    // Always call API to lookup validation from database by NAME
                    // API will check node_pair_validations table using source_name and target_name
                    try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate-path`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                from_node: sourceNode.title,
                                to_node: targetNode.title
                            })
                        });
                        const validation = await response.json();

                        if (validation.success) {
                            console.log('✅ Got validation from API:', sourceNode.title, '->', targetNode.title,
                                'isValid:', validation.isValid,
                                validation.fromDatabase ? '(from DB cache)' : '(from AI)');

                            loadedEdges.push({
                                id: edgeId,
                                source: sourceNode.id,
                                target: targetNode.id,
                                type: 'validation',
                                data: {
                                    isValid: validation.isValid,
                                    reason: validation.reason,
                                    recommendation: validation.recommendation,
                                    fromNode: sourceNode.title,
                                    toNode: targetNode.title
                                }
                            });
                        } else {
                            // Fallback if API fails
                            loadedEdges.push({
                                id: edgeId,
                                source: sourceNode.id,
                                target: targetNode.id,
                                type: 'validation',
                                data: {
                                    isValid: true,
                                    reason: 'Validation unavailable',
                                    fromNode: sourceNode.title,
                                    toNode: targetNode.title
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Edge validation failed:', error);
                        loadedEdges.push({
                            id: edgeId,
                            source: sourceNode.id,
                            target: targetNode.id,
                            type: 'validation',
                            data: {
                                isValid: true,
                                reason: 'Validation unavailable',
                                fromNode: sourceNode.title,
                                toNode: targetNode.title
                            }
                        });
                    }
                }

                setEdges(loadedEdges);
            }, 100);
        }
    }, [initialData, setNodes, setEdges]);

    const getNodeLabel = useCallback((nodeId: string): string => {
        const node = nodes.find(n => n.id === nodeId);
        return node?.data?.label || nodeId;
    }, [nodes]);

    // Validate and update edge color after connection
    const validateAndUpdateEdge = useCallback(async (
        edgeId: string,
        fromNodeId: string,
        toNodeId: string
    ) => {
        const fromLabel = getNodeLabel(fromNodeId);
        const toLabel = getNodeLabel(toNodeId);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate-path`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_node: fromLabel,
                    to_node: toLabel
                }),
            });

            const data = await response.json();

            // Update edge with validation data
            setEdges(eds => eds.map(e => {
                if (e.id === edgeId) {
                    return {
                        ...e,
                        type: 'validation',
                        data: {
                            isValid: data.isValid,
                            reason: data.reason,
                            recommendation: data.recommendation,
                        },
                    };
                }
                return e;
            }));
        } catch (error) {
            console.error('Validation error:', error);
            // Mark as invalid on error
            setEdges(eds => eds.map(e => {
                if (e.id === edgeId) {
                    return {
                        ...e,
                        type: 'validation',
                        data: {
                            isValid: false,
                            reason: 'Gagal memvalidasi koneksi',
                        },
                    };
                }
                return e;
            }));
        }
    }, [getNodeLabel, setEdges, userId, workflowId]);

    // Connect nodes - always add edge, then validate async
    const onConnect = useCallback((connection: Connection) => {
        if (!connection.source || !connection.target) return;

        const existingEdge = edges.find(
            e => e.source === connection.source && e.target === connection.target
        );
        if (existingEdge) return;

        const newEdgeId = `e${connection.source}-${connection.target}`;

        // Add edge immediately with pending state
        const newEdge: Edge = {
            id: newEdgeId,
            source: connection.source,
            target: connection.target,
            type: 'validation',
            data: {
                isValid: true,
                reason: 'Memvalidasi...',
            },
        };

        setEdges(eds => addEdge(newEdge, eds));

        // Validate async and update edge
        validateAndUpdateEdge(newEdgeId, connection.source, connection.target);
    }, [edges, setEdges, validateAndUpdateEdge]);

    // Handle edge update (reconnection)
    const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
        if (!newConnection.source || !newConnection.target) return;

        // Update the edge
        setEdges(eds => updateEdge(oldEdge, newConnection, eds));

        // Re-validate with new connection
        const edgeId = oldEdge.id;
        validateAndUpdateEdge(edgeId, newConnection.source, newConnection.target);
    }, [setEdges, validateAndUpdateEdge]);

    const closeValidation = useCallback(() => {
        setValidation(prev => ({ ...prev, isOpen: false }));
        pendingEdgeRef.current = null;
    }, []);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const data = event.dataTransfer.getData('application/json');
        if (!data) return;

        const nodeData = JSON.parse(data);
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const newNode: Node<LearningNodeData> = {
            id: nodeData.id,
            type: 'learningNode',
            position,
            data: {
                label: nodeData.title,
                description: nodeData.description,
                color: nodeData.color,
            },
        };

        setNodes(nds => {
            // Prevent duplicates
            if (nds.some(n => n.id === nodeData.id)) return nds;
            return [...nds, newNode];
        });
    }, [reactFlowInstance, setNodes]);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleSave = useCallback((isDraft = false) => {
        const positions: Record<string, { x: number; y: number }> = {};
        nodes.forEach(n => {
            positions[n.id] = n.position;
        });

        if (onSave) {
            onSave({ title, edges, positions, isDraft });
        }
        setShowSaveDialog(false);
    }, [nodes, edges, title, onSave]);

    const handleNodeDragStart = useCallback(() => {
        // Could add visual feedback here
    }, []);

    const refreshNodes = useCallback(() => {
        // Trigger re-fetch of sidebar nodes by incrementing key
        setSidebarRefreshKey(prev => prev + 1);
        setShowAddNode(false);
    }, []);


    return (
        <div
            className="w-full h-full relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={isReadOnly && !isEditing ? undefined : onNodesChange}
                onEdgesChange={isReadOnly && !isEditing ? undefined : onEdgesChange}
                onConnect={isReadOnly && !isEditing ? undefined : onConnect}
                onEdgeUpdate={isReadOnly && !isEditing ? undefined : onEdgeUpdate}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                nodesDraggable={!isReadOnly || isEditing}
                nodesConnectable={!isReadOnly || isEditing}
                elementsSelectable={true}
                edgeUpdaterRadius={10}
                fitView
                snapToGrid
                snapGrid={[20, 20]}
                connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
                defaultEdgeOptions={{
                    type: 'validation',
                }}
                deleteKeyCode={isReadOnly && !isEditing ? [] : ['Backspace', 'Delete']}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="#334155"
                />
                <Controls
                    className="!bg-slate-800 !border-slate-700 !rounded-lg !shadow-lg"
                    showInteractive={false}
                />
            </ReactFlow>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-gray-800 rounded-lg px-6 py-3 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-center">
                        <div className="text-xs text-yellow-300 mb-1 font-black">Topik</div>
                        <div className="font-black text-white">
                            {topic.title.length > 40
                                ? topic.title.substring(0, 40) + '...'
                                : topic.title}
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-10 flex gap-2 pointer-events-auto">
                {isReadOnly && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-purple-400 hover:bg-purple-300 text-black px-4 py-2 rounded-lg
                            font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        Edit
                    </button>
                )}
                {isReadOnly && isEditing && (
                    <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-300 hover:bg-gray-200 text-black px-4 py-2 rounded-lg
                            font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        View Mode
                    </button>
                )}
                <button
                    onClick={() => setShowImplement(true)}
                    disabled={nodes.length === 0}
                    className="bg-blue-400 hover:bg-blue-300 disabled:bg-gray-300 disabled:cursor-not-allowed text-black px-4 py-2 rounded-lg
          font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2"
                    title={nodes.length === 0 ? 'Tambahkan node terlebih dahulu' : 'Buat jadwal belajar'}
                >
                    Implement
                </button>
                <button
                    onClick={() => handleSave(true)}
                    className="bg-orange-400 hover:bg-orange-300 text-black px-4 py-2 rounded-lg
          font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2"
                    title="Simpan sebagai draft (tidak dipublikasi)"
                >
                    Save Draft
                </button>
                <button
                    onClick={() => setShowSaveDialog(true)}
                    className="bg-green-400 hover:bg-green-300 text-black px-4 py-2 rounded-lg font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2"
                >
                    Simpan
                </button>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-gray-800 rounded-lg px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-xs text-white font-bold">
                        Drag node dari sidebar - Hubungkan untuk validasi AI - Nodes: <span className="text-yellow-300 font-black">{nodes.length}</span> - Edges: <span className="text-yellow-300 font-black">{edges.length}</span>
                    </span>
                </div>
            </div>

            {/* Only show sidebar when creating new or in edit mode */}
            {(!isReadOnly || isEditing) && (
                <NodeSidebar
                    topicId={topic.id}
                    onDragStart={handleNodeDragStart}
                    onAddNode={() => setShowAddNode(true)}
                    refreshKey={sidebarRefreshKey}
                />
            )}

            {/* Add Node Modal */}
            <AddNodeModal
                topicId={topic.id}
                isOpen={showAddNode}
                onClose={() => setShowAddNode(false)}
                onNodeCreated={refreshNodes}
                userId={userId}
            />

            {/* Validation Result */}
            <ValidationResult
                isOpen={validation.isOpen}
                onClose={closeValidation}
                isLoading={validation.isLoading}
                isValid={validation.isValid}
                fromNode={validation.fromNode}
                toNode={validation.toNode}
                reason={validation.reason}
                recommendation={validation.recommendation}
            />

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full overflow-hidden">
                        <div className="bg-green-400 px-6 py-4 border-b-[4px] border-black">
                            <h3 className="text-xl font-black text-black">💾 Simpan Workflow</h3>
                        </div>
                        <div className="p-6 bg-blue-50">
                            <input
                                type="text"
                                placeholder="Judul workflow..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-white border-[3px] border-black text-black text-base
                                    mb-5 focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-gray-500"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSaveDialog(false)}
                                    className="flex-1 py-3 text-base bg-red-500 hover:bg-red-400 text-white border-[3px] border-black
                                        font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                                        hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={!title}
                                    className="flex-1 py-3 text-base bg-green-500 hover:bg-green-400 disabled:bg-gray-400 text-white
                                        border-[3px] border-black font-black transition-all
                                        shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                                        hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Implement Modal */}
            <ImplementModal
                isOpen={showImplement}
                onClose={() => setShowImplement(false)}
                workflowId={workflowId}
                workflowTitle={title || topic.title}
                canvasNodes={nodes}
            />
        </div>
    );
}

export default function LearningPathCanvas(props: LearningPathCanvasProps) {
    return (
        <ReactFlowProvider>
            <LearningPathCanvasInner {...props} />
        </ReactFlowProvider>
    );
}
