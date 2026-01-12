'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateLearningSchedule, createCalendarEvents } from '@/lib/googleCalendar';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

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

function ImplementModalInner({ isOpen, onClose, workflowId, workflowTitle, canvasNodes }: ImplementModalProps) {
    const [step, setStep] = useState<'estimate' | 'configure' | 'success'>('estimate');
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [dailyHours, setDailyHours] = useState(2);
    const [createdEventCount, setCreatedEventCount] = useState(0);

    // Check if we have Google token in localStorage
    useEffect(() => {
        console.log('🔍 Checking Google Calendar auth...');

        const savedToken = localStorage.getItem('google_calendar_token');

        if (savedToken) {
            console.log('✅ Found saved Google Calendar token');
            setIsGoogleConnected(true);
            setGoogleAccessToken(savedToken);
        } else {
            console.log('❌ No Google Calendar token found');
            setIsGoogleConnected(false);
            setGoogleAccessToken(null);
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

                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/estimate-nodes`, {
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
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workflows/${workflowId}/estimate`, {
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

    // Google OAuth login handler using @react-oauth/google
    const googleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            console.log('✅ Google OAuth success:', tokenResponse);

            // Save token to localStorage
            localStorage.setItem('google_calendar_token', tokenResponse.access_token);

            // Update state
            setGoogleAccessToken(tokenResponse.access_token);
            setIsGoogleConnected(true);
            setLoading(false);

            console.log('💾 Token saved to localStorage');
        },
        onError: (error) => {
            console.error('❌ Google OAuth error:', error);
            setError('Gagal terhubung ke Google Calendar');
            setLoading(false);
        },
        scope: 'https://www.googleapis.com/auth/calendar.events',
    });

    const handleConnectGoogle = () => {
        console.log('🔐 Starting Google Calendar OAuth...');
        setLoading(true);
        setError(null);

        // Trigger Google OAuth flow
        googleLogin();
    };

    const handleImplement = async () => {
        if (!googleAccessToken) {
            setError('Token Google Calendar tidak tersedia. Silakan hubungkan ulang.');
            return;
        }

        if (!schedule) {
            setError('Estimasi jadwal tidak tersedia');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('📅 Creating calendar events...');
            console.log('Start date:', startDate);
            console.log('Daily hours:', dailyHours);
            console.log('Total nodes:', schedule.nodes.length);

            // Generate learning schedule from nodes
            const start = new Date(startDate);
            start.setHours(9, 0, 0, 0); // Start at 9 AM

            const calendarEvents = generateLearningSchedule(
                schedule.nodes,
                start,
                dailyHours
            );

            console.log(`Generated ${calendarEvents.length} calendar events`);

            // Create events in Google Calendar directly from frontend
            const result = await createCalendarEvents(googleAccessToken, calendarEvents);

            console.log(`✅ Successfully created ${result.eventIds.length} events`);

            setCreatedEventCount(result.eventIds.length);

            if (result.failedCount > 0) {
                setError(`Berhasil membuat ${result.eventIds.length} dari ${calendarEvents.length} event. ${result.failedCount} event gagal.`);
            }

            setStep('success');
        } catch (err: any) {
            console.error('❌ Failed to create calendar events:', err);

            let errorMessage = 'Gagal membuat jadwal di Google Calendar';

            if (err.message) {
                if (err.message.includes('session expired')) {
                    errorMessage = 'Sesi Google Anda telah kadaluarsa. Silakan hubungkan ulang.';
                } else if (err.message.includes('access denied')) {
                    errorMessage = 'Akses Google Calendar ditolak. Silakan berikan izin Calendar.';
                } else {
                    errorMessage = err.message;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl w-full overflow-hidden">
                {/* Header */}
                <div className="bg-cyan-400 px-8 py-6 border-b-[4px] border-black">
                    <h2 className="text-2xl font-black text-black">📅 Implement Workflow</h2>
                    <p className="text-base text-black/80 font-bold">{workflowTitle}</p>
                </div>

                <div className="p-8 bg-blue-50">
                    {loading ? (
                        <div className="flex flex-col items-center py-8">
                            <div className="animate-spin h-12 w-12 border-[4px] border-pink-400 border-t-transparent mb-4" />
                            <p className="text-black font-bold text-base">
                                {step === 'estimate' ? 'Menghitung estimasi waktu...' : 'Membuat jadwal...'}
                            </p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-200 border-[3px] border-red-600 p-5 mb-6">
                            <p className="text-red-900 text-base font-bold">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-900 text-base mt-3 underline font-bold hover:text-red-700"
                            >
                                Coba lagi
                            </button>
                        </div>
                    ) : step === 'success' ? (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">🎉</div>
                            <h3 className="text-2xl font-black text-black mb-3">
                                Jadwal Berhasil Dibuat!
                            </h3>
                            <p className="text-gray-700 text-base font-bold mb-8">
                                {createdEventCount} event telah dijadwalkan di Google Calendar
                            </p>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-green-500 text-white text-base border-[3px] border-black font-black
                                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                                    hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all hover:bg-green-400"
                            >
                                Selesai
                            </button>
                        </div>
                    ) : schedule ? (
                        <>
                            {/* Schedule Summary */}
                            <div className="bg-yellow-300 border-[3px] border-black p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="grid grid-cols-3 gap-6 text-center">
                                    <div>
                                        <div className="text-3xl font-black text-black">{schedule.totalHours}</div>
                                        <div className="text-sm font-bold text-black/80">Total Jam</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-black">{schedule.totalDays}</div>
                                        <div className="text-sm font-bold text-black/80">Hari</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-black">{schedule.nodes.length}</div>
                                        <div className="text-sm font-bold text-black/80">Topik</div>
                                    </div>
                                </div>
                            </div>

                            {/* Node List */}
                            <div className="max-h-48 overflow-y-auto mb-6 space-y-3">
                                {schedule.nodes.map((node, i) => (
                                    <div key={node.nodeId} className="flex justify-between items-center px-4 py-3 bg-white border-[2px] border-black
                                        shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-600 text-base font-bold">{i + 1}.</span>
                                            <span className="text-black font-bold">{node.nodeTitle}</span>
                                        </div>
                                        <span className="text-pink-600 text-base font-black">{node.estimatedHours}h</span>
                                    </div>
                                ))}
                            </div>

                            {/* Configuration */}
                            <div className="space-y-5 mb-6">
                                <div>
                                    <label className="text-base font-black text-black block mb-2">Mulai Tanggal</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-5 py-3 text-base bg-white border-[3px] border-black text-black
                                            focus:outline-none focus:ring-2 focus:ring-pink-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-base font-black text-black block mb-2">Jam Belajar per Hari</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="8"
                                        value={dailyHours}
                                        onChange={(e) => setDailyHours(Number(e.target.value))}
                                        className="w-full px-5 py-3 text-base bg-white border-[3px] border-black text-black
                                            focus:outline-none focus:ring-2 focus:ring-pink-400"
                                    />
                                </div>
                            </div>

                            {/* Google Connection */}
                            {isGoogleConnected ? (
                                <div className="bg-green-200 border-[3px] border-green-600 p-4 mb-6 flex items-center gap-3">
                                    <span className="text-green-800 text-xl font-black">✓</span>
                                    <span className="text-green-900 font-bold text-base">Google Calendar terhubung</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectGoogle}
                                    disabled={loading}
                                    className="w-full py-4 bg-white text-black border-[3px] border-black font-black text-base mb-6
                                        flex items-center justify-center gap-3 hover:bg-gray-100 transition-all
                                        shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                                        hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {loading ? 'Menghubungkan...' : 'Hubungkan Google Calendar'}
                                </button>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 text-base bg-red-500 hover:bg-red-400 text-white border-[3px] border-black
                                        font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                                        hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleImplement}
                                    disabled={!isGoogleConnected || loading}
                                    className="flex-1 py-3 text-base bg-blue-500 hover:bg-blue-400 disabled:bg-gray-400
                                        text-white border-[3px] border-black font-black transition-all
                                        shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                                        hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
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

// Wrapper component with GoogleOAuthProvider
export default function ImplementModal(props: ImplementModalProps) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    if (!clientId) {
        console.error('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set!');
        return null;
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <ImplementModalInner {...props} />
        </GoogleOAuthProvider>
    );
}
