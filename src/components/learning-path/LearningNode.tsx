'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface LearningNodeData {
    label: string;
    description?: string;
    color?: string;
}

function LearningNode({ data, selected }: NodeProps<LearningNodeData>) {
    const bgColor = data.color || '#6366f1';

    return (
        <div
            className={`
        relative px-4 py-3 rounded-xl shadow-lg min-w-[160px]
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : ''}
      `}
            style={{
                background: `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -20)} 100%)`,
            }}
        >
            {/* Input Handle (Left) */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-4 !h-4 !bg-slate-700 !border-2 !border-slate-400
          hover:!bg-indigo-500 hover:!border-white hover:!scale-125
          transition-all duration-200"
                style={{ left: -8 }}
            />

            {/* Content */}
            <div className="flex items-center gap-3">
                <div>
                    <div className="font-semibold text-white text-sm">
                        {data.label}
                    </div>
                    {data.description && (
                        <div className="text-xs text-white/70 mt-0.5">
                            {data.description}
                        </div>
                    )}
                </div>
            </div>

            {/* Output Handle (Right) */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-4 !bg-slate-700 !border-2 !border-slate-400 
          hover:!bg-green-500 hover:!border-white hover:!scale-125
          transition-all duration-200"
                style={{ right: -8 }}
            />

            {/* Glow effect when selected */}
            {selected && (
                <div
                    className="absolute inset-0 rounded-xl -z-10 blur-xl opacity-40"
                    style={{ background: bgColor }}
                />
            )}
        </div>
    );
}

function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default memo(LearningNode);
