'use client';

import { useState } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';

interface ValidationEdgeData {
    isValid: boolean;
    reason: string;
    recommendation?: string;
}

export default function ValidationEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
}: EdgeProps<ValidationEdgeData>) {
    const [showTooltip, setShowTooltip] = useState(false);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isValid = data?.isValid ?? true;
    const strokeColor = isValid ? '#22c55e' : '#f97316'; // green or orange

    return (
        <>
            {/* Invisible wider path for easier hover */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                style={{ cursor: 'pointer' }}
            />

            {/* Visible edge */}
            <path
                id={id}
                d={edgePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth={2}
                markerEnd={markerEnd}
                className={isValid ? '' : 'animate-pulse'}
                style={{ pointerEvents: 'none' }}
            />

            {/* Tooltip */}
            <EdgeLabelRenderer>
                {showTooltip && data?.reason && (
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -100%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'none',
                            zIndex: 1000,
                        }}
                        className="nodrag nopan"
                    >
                        <div
                            className={`px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs ${isValid
                                    ? 'bg-green-900/95 border border-green-700 text-green-100'
                                    : 'bg-orange-900/95 border border-orange-700 text-orange-100'
                                }`}
                        >
                            <div className="font-semibold mb-1 flex items-center gap-1">
                                {isValid ? '✅ Valid' : '⚠️ Perlu Perhatian'}
                            </div>
                            <p className="text-xs opacity-90">{data.reason}</p>
                            {data.recommendation && (
                                <p className="text-xs mt-1 pt-1 border-t border-current/20">
                                    💡 {data.recommendation}
                                </p>
                            )}
                        </div>
                        {/* Arrow pointing down */}
                        <div
                            className={`w-3 h-3 rotate-45 mx-auto -mt-1.5 ${isValid ? 'bg-green-900' : 'bg-orange-900'
                                }`}
                        />
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
}
