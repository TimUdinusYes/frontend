'use client';

import { useState, useEffect, useCallback } from 'react';

interface NodeEstimate {
    nodeId: string;
    nodeTitle: string;
    estimatedHours: number;
    description: string;
}

interface Schedule {
    totalHours: number;
    nodes: NodeEstimate[];
    suggestedDailyHours: number;
    totalDays: number;
}

interface CanvasNode {
    id: string;
    data: {
        label: string;
        description?: string;
    };
}

interface ImplementModalProps {
    isOpen: boolean;
    onClose: () => void;
    workflowId?: string;
    workflowTitle: string;
    canvasNodes?: CanvasNode[]; // For unsaved workflows
}

export default function ImplementModal({ isOpen, onClose, workflowId, workflowTitle, canvasNodes }: ImplementModalProps) {
    const [step, setStep] = useState<'estimate' | 'configure' | 'success'>('estimate');
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [googleToken, setGoogleToken] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [dailyHours, setDailyHours] = useState(2);

    useEffect(() => {
        // Check for Google token in URL (from OAuth callback)
        const params = new URLSearchParams(window.location.search);
        const token = params.get('google_token');
        if (token) {
            setGoogleToken(token);
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const fetchEstimate = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // If we have canvas nodes, use them directly for estimation
            if (canvasNodes && canvasNodes.length > 0) {
                const nodes = canvasNodes.map(n => ({
                    id: n.id,
                    title: n.data.label,
                    description: n.data.description
                }));

                const response = await fetch('http://localhost:8080/api/estimate-nodes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nodes })
                });
                const data = await response.json();
                if (data.success) {
                    setSchedule(data.data);
                    setDailyHours(data.data.suggestedDailyHours);
                } else {
                    setError(data.error || 'Gagal mengambil estimasi');
                }
            } else if (workflowId) {
                // Use workflow ID for saved workflows
                const response = await fetch(`http://localhost:8080/api/workflows/${workflowId}/estimate`, {
                    method: 'POST'
                });
                const data = await response.json();
                if (data.success) {
                    setSchedule(data.data);
                    setDailyHours(data.data.suggestedDailyHours);
                } else {
                    setError(data.error || 'Gagal mengambil estimasi');
                }
            } else {
                setError('Tidak ada node untuk diestimasi');
            }
        } catch (err) {
            console.error('Estimate error:', err);
            setError('Gagal mengambil estimasi');
        }
        setLoading(false);
    }, [canvasNodes, workflowId]);

    useEffect(() => {
        if (isOpen && !schedule) {
            fetchEstimate();
        }
    }, [isOpen, schedule, fetchEstimate]);

    const handleConnectGoogle = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/auth/google/url');
            const data = await response.json();
            if (data.success) {
                window.location.href = data.url;
            } else {
                setError('Google Calendar belum dikonfigurasi di server');
            }
        } catch (err) {
            setError('Gagal terhubung ke Google');
        }
    };

    const handleImplement = async () => {
        if (!googleToken) {
            setError('Hubungkan Google Calendar terlebih dahulu');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8080/api/workflows/${workflowId}/implement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: googleToken,
                    start_date: startDate,
                    daily_hours: dailyHours
                })
            });
            const data = await response.json();
            if (data.success) {
                setStep('success');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Gagal membuat jadwal');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">📅 Implement Workflow</h2>
                    <p className="text-sm text-white/80">{workflowTitle}</p>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center py-8">
                            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
                            <p className="text-slate-400">
                                {step === 'estimate' ? 'Menghitung estimasi waktu...' : 'Membuat jadwal...'}
                            </p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                            <p className="text-red-200">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-400 text-sm mt-2 underline"
                            >
                                Coba lagi
                            </button>
                        </div>
                    ) : step === 'success' ? (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">🎉</div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                Jadwal Berhasil Dibuat!
                            </h3>
                            <p className="text-slate-400 mb-6">
                                {schedule?.nodes.length} topik telah dijadwalkan di Google Calendar
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                            >
                                Selesai
                            </button>
                        </div>
                    ) : schedule ? (
                        <>
                            {/* Schedule Summary */}
                            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-blue-400">{schedule.totalHours}</div>
                                        <div className="text-xs text-slate-400">Total Jam</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-cyan-400">{schedule.totalDays}</div>
                                        <div className="text-xs text-slate-400">Hari</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-emerald-400">{schedule.nodes.length}</div>
                                        <div className="text-xs text-slate-400">Topik</div>
                                    </div>
                                </div>
                            </div>

                            {/* Node List */}
                            <div className="max-h-40 overflow-y-auto mb-6 space-y-2">
                                {schedule.nodes.map((node, i) => (
                                    <div key={node.nodeId} className="flex justify-between items-center px-3 py-2 bg-slate-700/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 text-sm">{i + 1}.</span>
                                            <span className="text-white">{node.nodeTitle}</span>
                                        </div>
                                        <span className="text-blue-400 text-sm">{node.estimatedHours}h</span>
                                    </div>
                                ))}
                            </div>

                            {/* Configuration */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Mulai Tanggal</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Jam Belajar per Hari</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="8"
                                        value={dailyHours}
                                        onChange={(e) => setDailyHours(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            {/* Google Connection */}
                            {googleToken ? (
                                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4 flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span className="text-green-200">Google Calendar terhubung</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectGoogle}
                                    className="w-full py-3 bg-white text-slate-800 rounded-lg font-medium mb-4 flex items-center justify-center gap-2 hover:bg-slate-100"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Hubungkan Google Calendar
                                </button>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 bg-slate-700 text-white rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleImplement}
                                    disabled={!googleToken}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-lg font-medium"
                                >
                                    📅 Buat Jadwal
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
