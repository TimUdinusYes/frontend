'use client';

import { useState, useEffect } from 'react';

interface ValidationResultProps {
    isOpen: boolean;
    onClose: () => void;
    isValid: boolean;
    fromNode: string;
    toNode: string;
    reason: string;
    recommendation?: string;
    isLoading?: boolean;
}

export default function ValidationResult({
    isOpen,
    onClose,
    isValid,
    fromNode,
    toNode,
    reason,
    recommendation,
    isLoading
}: ValidationResultProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div
            className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`
          relative bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full
          border border-slate-700 overflow-hidden
          transition-all duration-300
          ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
            >
                {/* Header */}
                <div
                    className={`
            px-6 py-4 flex items-center gap-3
            ${isLoading
                            ? 'bg-slate-700'
                            : isValid
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                                : 'bg-gradient-to-r from-red-600 to-rose-600'
                        }
          `}
                >
                    <div className="text-3xl">
                        {isLoading ? '⏳' : isValid ? '✅' : '❌'}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">
                            {isLoading
                                ? 'Memvalidasi...'
                                : isValid
                                    ? 'Koneksi Valid!'
                                    : 'Urutan Tidak Tepat'
                            }
                        </h3>
                        <p className="text-sm text-white/80">
                            {fromNode} → {toNode}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-slate-400 mb-2">
                                    Analisis AI:
                                </h4>
                                <p className="text-slate-200">{reason}</p>
                            </div>

                            {!isValid && recommendation && (
                                <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                                        💡 Rekomendasi
                                    </h4>
                                    <p className="text-amber-200">{recommendation}</p>
                                </div>
                            )}

                            {isValid && (
                                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                                    <p className="text-green-200 text-sm">
                                        ✓ Koneksi telah disimpan ke learning path Anda
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isLoading && (
                    <div className="px-6 py-4 bg-slate-900/50 flex justify-end">
                        <button
                            onClick={onClose}
                            className={`
                px-5 py-2 rounded-lg font-medium transition-all
                ${isValid
                                    ? 'bg-green-600 hover:bg-green-500 text-white'
                                    : 'bg-slate-600 hover:bg-slate-500 text-white'
                                }
              `}
                        >
                            {isValid ? 'Lanjutkan' : 'Tutup'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
