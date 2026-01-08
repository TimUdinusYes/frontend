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
        <div className="relative group" style={{ marginLeft: '8px', marginBottom: '8px' }}>
            {/* Stacked shadow layers - retro style */}
            <div
                className="absolute inset-0 border-[3px] border-black z-0 transition-all duration-300"
                style={{
                    backgroundColor: adjustColor(bgColor, -40),
                    transform: selected ? 'translate(6px, 6px)' : 'translate(4px, 4px)'
                }}
            />

            {/* Main node */}
            <div
                className={`
                    relative px-5 py-3.5 min-w-[200px] max-w-[350px] z-10
                    transition-all duration-300 cursor-grab active:cursor-grabbing
                    border-[3px] border-black
                    ${selected ? '-translate-x-1 -translate-y-1' : 'group-hover:-translate-x-0.5 group-hover:-translate-y-0.5'}
                `}
                style={{
                    backgroundColor: bgColor,
                }}
            >
                {/* Input Handle (Left) */}
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-5 !h-5 !bg-white !border-[3px] !border-black
                        hover:!bg-yellow-400 hover:!scale-110
                        transition-all duration-200"
                    style={{ left: -10 }}
                />

                {/* Content */}
                <div className="flex flex-col gap-1 max-w-[320px]">
                    <div className="font-bold text-white text-base drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] break-words">
                        {data.label}
                    </div>
                    {data.description && (
                        <div className="text-sm text-white/90 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.2)] break-words line-clamp-2">
                            {data.description}
                        </div>
                    )}
                </div>

                {/* Output Handle (Right) */}
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-5 !h-5 !bg-white !border-[3px] !border-black
                        hover:!bg-green-400 hover:!scale-110
                        transition-all duration-200"
                    style={{ right: -10 }}
                />
            </div>
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
