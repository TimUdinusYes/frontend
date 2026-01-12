'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Data types
interface SubFeature {
    id: string;
    label: string;
    title: string; // Title inside the box
    description: string;
    points: string[];
    image: string; // Path to image/screenshot
}

interface MainFeature {
    id: string;
    title: string;
    subtitle: string;
    subFeatures: SubFeature[];
}

// Feature Data
const features: MainFeature[] = [
    {
        id: 'peerconnect',
        title: 'PEERCONNECT',
        subtitle: 'Terhubung dengan teman sekelas dan dosen melalui platform komunikasi terintegrasi kami',
        subFeatures: [
            {
                id: 'group_chat',
                label: 'Grup Chat',
                title: 'Grup Chat',
                description: 'Buat dan bergabung dengan grup chat untuk diskusi kelas, proyek kelompok, atau komunitas kampus.',
                points: [
                    'Bagikan file dan dokumen penting',
                    'Diskusi real-time dengan anggota grup',
                    'Notifikasi untuk pesan penting'
                ],
                image: '/komunitasw.png'
            },
            {
                id: 'private_chat',
                label: 'Private Chat',
                title: 'Private Chat',
                description: 'Kirim pesan pribadi yang aman ke teman atau dosen untuk konsultasi lebih mendalam.',
                points: [
                    'Enkripsi end-to-end terjamin',
                    'Status online/offline pengguna',
                    'Arsip pesan otomatis'
                ],
                image: '/landingpage1.png'
            },
            {
                id: 'video_call',
                label: 'Video Call',
                title: 'Video Call',
                description: 'Lakukan pertemuan tatap muka secara virtual dengan kualitas video HD yang jernih.',
                points: [
                    'Screen sharing untuk presentasi',
                    'Kapasitas hingga 50 peserta',
                    'Fitur angkat tangan untuk bertanya'
                ],
                image: '/happy.png'
            }
        ]
    },
    {
        id: 'taskintegrator',
        title: 'TASK INTEGRATOR',
        subtitle: 'Kelola tugas akademik Anda dengan cerdas dan efisien di satu tempat',
        subFeatures: [
            {
                id: 'daily_plan',
                label: 'Daily Plan',
                title: 'Rencana Harian',
                description: 'Dapatkan jadwal harian yang dipersonalisasi berdasarkan deadline tugas dan waktu luang Anda.',
                points: [
                    'Prioritas tugas otomatis',
                    'Pengingat cerdas',
                    'Sinkronisasi kalender'
                ],
                image: '/workflow.png'
            },
            {
                id: 'progress',
                label: 'Progress',
                title: 'Pelacakan Progress',
                description: 'Pantau sejauh mana perkembangan pengerjaan tugas-tugas besar Anda secara visual.',
                points: [
                    'Visualisasi chart yang menarik',
                    'Gamifikasi penyelesaian tugas',
                    'Milestone tracking'
                ],
                image: '/immat.png'
            }
        ]
    },
    {
        id: 'adaptive',
        title: 'ADAPTIVE MATERIAL',
        subtitle: 'Materi pembelajaran yang menyesuaikan dengan gaya dan kecepatan belajar Anda',
        subFeatures: [
            {
                id: 'smart_learn',
                label: 'Smart Learn',
                title: 'Pembelajaran Pintar',
                description: 'Sistem AI menganalisis pemahaman Anda dan menyajikan materi yang paling relevan.',
                points: [
                    'Rekomendasi materi otomatis',
                    'Deteksi area yang perlu ditingkatkan',
                    'Kuis adaptif'
                ],
                image: '/materi.png'
            },
            {
                id: 'interactive',
                label: 'Interactive',
                title: 'Konten Interaktif',
                description: 'Belajar tidak lagi membosankan dengan konten yang bisa berinteraksi dengan Anda.',
                points: [
                    'Simulasi dan visualisasi',
                    'Audio dan video terintegrasi',
                    'Latihan soal dengan feedback instan'
                ],
                image: '/newmat.png'
            }
        ]
    },
    {
        id: 'games',
        title: 'GAMIFICATION',
        subtitle: 'Jadikan belajar lebih menyenangkan dengan elemen permainan dan kompetisi sehat',
        subFeatures: [
            {
                id: 'leaderboard',
                label: 'Leaderboard',
                title: 'Papan Peringkat',
                description: 'Bersaing secara sehat dengan teman-teman untuk mendapatkan skor tertinggi.',
                points: [
                    'Peringkat mingguan dan bulanan',
                    'Kategori per mata pelajaran',
                    'Hadiah untuk peringkat teratas'
                ],
                image: '/quiz.png'
            },
            {
                id: 'badges',
                label: 'Badges',
                title: 'Koleksi Lencana',
                description: 'Kumpulkan lencana unik sebagai bukti pencapaian akademik Anda.',
                points: [
                    'Lencana khusus event',
                    'Sistem leveling profil',
                    'Pamerkan di profil publik'
                ],
                image: '/skate.png'
            }
        ]
    },
    {
        id: 'multi_source',
        title: 'MULTI-SOURCE',
        subtitle: 'Akses ribuan sumber pengetahuan terpercaya dari berbagai platform',
        subFeatures: [
            {
                id: 'aggregator',
                label: 'Aggregator',
                title: 'Pusat Pengetahuan',
                description: 'Cari materi dari jurnal, video edukasi, dan artikel ilmiah dalam satu pencarian.',
                points: [
                    'Filter sumber terpercaya',
                    'Simpan ke perpustakaan pribadi',
                    'Kutipan otomatis'
                ],
                image: '/aiw.png'
            }
        ]
    }
];

export default function FeatureShowcase() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeSubTab, setActiveSubTab] = useState(0);

    const currentFeature = features[currentIndex];
    // Ensure activeSubTab is within bounds (e.g., when switching features with different subtab counts)
    useEffect(() => {
        setActiveSubTab(0);
    }, [currentIndex]);

    const currentSubFeature = currentFeature.subFeatures[activeSubTab] || currentFeature.subFeatures[0];

    const nextFeature = () => {
        setCurrentIndex((prev) => (prev + 1) % features.length);
    };

    const prevFeature = () => {
        setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            {/* Header Region */}
            <div className="text-center mb-16">
                <AnimatePresence mode="wait">
                    <motion.h2
                        key={currentFeature.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="text-5xl md:text-7xl font-black text-black mb-4 uppercase"
                    >
                        {currentFeature.title}
                    </motion.h2>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    <motion.p
                        key={`${currentFeature.id}-subtitle`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-lg md:text-xl font-bold text-gray-700 max-w-3xl mx-auto"
                    >
                        {currentFeature.subtitle}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows (Absolute or Flex) */}
            <div className="relative">
                <button
                    onClick={prevFeature}
                    className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors shadow-lg"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>

                <button
                    onClick={nextFeature}
                    className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors shadow-lg"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>

                {/* Main Content Card */}
                <div className="bg-[#FFFDF5] rounded-3xl border-[3px] border-black p-4 md:p-8 flex flex-col lg:flex-row gap-8 min-h-[500px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

                    {/* Left Column: Tabs & Info */}
                    <div className="lg:w-1/2 flex flex-col">
                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6 border-b-[3px] border-black/10 pb-4">
                            {currentFeature.subFeatures.map((sub, idx) => (
                                <button
                                    key={sub.id}
                                    onClick={() => setActiveSubTab(idx)}
                                    className={`px-6 py-2 rounded-full font-black text-sm md:text-base border-2 transition-all ${idx === activeSubTab
                                        ? 'bg-yellow-400 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]'
                                        : 'bg-transparent border-transparent text-gray-500 hover:text-black hover:bg-gray-100'
                                        }`}
                                >
                                    {sub.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Box */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSubFeature.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 bg-white/50 rounded-2xl border-2 border-black/5 p-6 md:p-8"
                            >
                                <h3 className="text-3xl font-black text-black mb-4">{currentSubFeature.title}</h3>
                                <p className="text-gray-700 font-medium leading-relaxed mb-6">
                                    {currentSubFeature.description}
                                </p>

                                <ul className="space-y-3">
                                    {currentSubFeature.points.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black text-xs font-black">✓</span>
                                            <span className="text-gray-800 font-bold text-sm">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Image */}
                    <div className="lg:w-1/2 relative bg-black rounded-2xl overflow-hidden border-2 border-black shadow-inner min-h-[300px] lg:min-h-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSubFeature.id}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0"
                            >
                                <img
                                    src={currentSubFeature.image}
                                    alt={currentSubFeature.title}
                                    className="w-full h-full object-cover opacity-90"
                                />

                                {/* Overlay Text/Badge (Optional, mimicking "peerconnect interface" text in screenshot) */}
                                <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-md">
                                    <span className="text-white text-xs font-bold font-mono">
                                        {currentFeature.title} Interface
                                    </span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-3 mt-8">
                {features.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all duration-300 rounded-full border-2 border-black ${currentIndex === idx
                            ? 'w-12 h-3 bg-yellow-400'
                            : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
                <span className="ml-4 text-sm font-bold text-gray-500 self-center">
                    {currentIndex + 1} / {features.length}
                </span>
            </div>
        </div>
    );
}
