import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stats } = body

    if (!stats) {
      return NextResponse.json(
        { error: 'Stats are required' },
        { status: 400 }
      )
    }

    // Debug: Log received data
    console.log('📊 Stats received:', {
      totalMaterials: stats.totalMaterialsOpened,
      materialsCompleted: stats.materialsCompleted,
      materialSummaryCount: stats.materialSummary?.length || 0,
      materialSummary: stats.materialSummary
    })

    const prompt = `
Anda adalah seorang AI learning assistant yang menganalisis pola belajar siswa dan membangun peta pengetahuan (knowledge map).

Data Aktivitas Belajar:
- Total materi dibuka: ${stats.totalMaterialsOpened}
- Total waktu belajar: ${stats.totalTimeSpent} menit
- Materi selesai: ${stats.materialsCompleted}
- Rata-rata waktu per sesi: ${stats.averageSessionTime} menit

DETAIL SEMUA MATERI (WAJIB ANALISIS SEMUA):
${stats.materialSummary.map((m: any) =>
  `- ${m.material_title} (${m.topic_title}): dibuka ${m.total_opens}x, durasi ${m.total_duration}s, completed: ${m.is_completed ? 'YA' : 'TIDAK'}`
).join('\n')}

Tugas Anda:
1. Analisis SETIAP materi yang tercantum di atas (WAJIB SEMUA!)
2. Bangun peta pengetahuan yang LENGKAP berdasarkan SEMUA materi yang ada
3. Kategorikan SETIAP materi/topik yang terlihat dalam data ke dalam salah satu dari 3 kategori
4. Prediksi kesulitan yang mungkin dihadapi
5. Tentukan learning path optimal

Berikan analisis dalam format JSON berikut:
{
  "knowledgeMap": {
    "masteredConcepts": [
      {
        "concept": "Nama konsep",
        "confidence": 85,
        "evidence": "Alasan mengapa siswa dikategorikan paham"
      }
    ],
    "learningConcepts": [
      {
        "concept": "Nama konsep",
        "progress": 60,
        "needsReview": true,
        "estimatedTimeToMaster": "2-3 jam"
      }
    ],
    "notStartedConcepts": [
      {
        "concept": "Nama konsep",
        "prerequisite": ["Konsep A", "Konsep B"],
        "difficulty": "medium",
        "estimatedLearningTime": "4-5 jam"
      }
    ]
  },
  "learningVelocity": {
    "overallSpeed": "medium",
    "fastTopics": ["Topic 1", "Topic 2"],
    "slowTopics": ["Topic 3"],
    "recommendation": "Saran untuk meningkatkan kecepatan belajar"
  },
  "predictedChallenges": [
    {
      "topic": "Nama topik",
      "challenge": "Deskripsi kesulitan yang diprediksi",
      "preventionTip": "Tips untuk mencegah/mengatasi"
    }
  ],
  "optimalLearningPath": [
    {
      "step": 1,
      "topic": "Topik yang harus dipelajari",
      "reason": "Kenapa harus dipelajari sekarang",
      "estimatedTime": "2 jam"
    }
  ],
  "insights": [
    {
      "type": "strength" | "weakness" | "recommendation" | "pattern",
      "title": "Judul insight singkat",
      "description": "Penjelasan detail",
      "priority": "high" | "medium" | "low"
    }
  ],
  "studyPattern": "Deskripsi pola belajar siswa (2-3 kalimat)",
  "motivationalMessage": "Pesan motivasi personal untuk siswa"
}

ATURAN KATEGORISASI YANG WAJIB DIIKUTI:

1. SETIAP MATERI DI LIST "DETAIL SEMUA MATERI" HARUS MASUK KE SALAH SATU KATEGORI!
   - Jangan skip atau lewatkan materi apapun
   - Hitung berapa banyak materi di list, pastikan total konsep di semua kategori = jumlah materi tersebut

2. ATURAN KATEGORISASI OTOMATIS:
   a) masteredConcepts:
      - Materi dengan completed: YA (apapun durasi dan frekuensinya)
      - Confidence minimal 75%

   b) learningConcepts:
      - Materi dengan completed: TIDAK tapi sudah dibuka (berapapun frekuensinya)
      - Progress dihitung: (total_duration / 300) * 100 (max 90%)
      - Jika dibuka >1x atau durasi >60s → needsReview: true

   c) notStartedConcepts:
      - Hanya untuk topik yang TIDAK ADA sama sekali di list materi
      - Contoh: jika tidak ada materi Python, tambahkan Python di sini
      - Minimal 2-3 topik yang relevan dengan bidang studi mereka

3. WAJIB LENGKAP:
   - Minimal ${stats.materialSummary.length} konsep total di masteredConcepts + learningConcepts
   - Minimal 3-5 predictedChallenges
   - Minimal 5-8 optimalLearningPath steps
   - Minimal 5 insights

4. VALIDASI AKHIR:
   Sebelum return JSON, pastikan:
   ✓ Jumlah masteredConcepts + learningConcepts >= ${stats.materialSummary.length}
   ✓ Setiap materi di data ada di salah satu kategori
   ✓ Tidak ada duplikasi

CONTOH KONKRET BERDASARKAN DATA:
Jika data menunjukkan:
- "javascript (JavaScript): dibuka 2x, durasi 68s, completed: TIDAK"
  → Masuk learningConcepts dengan progress: 22%, needsReview: true

- "Olahraga (Olahraga): dibuka 2x, durasi 17s, completed: YA"
  → Masuk masteredConcepts dengan confidence: 85%

- "f bu umi (Matematika): dibuka 1x, durasi 2s, completed: YA"
  → Masuk masteredConcepts dengan confidence: 80%

Jawab hanya dengan JSON yang valid, tanpa markdown atau penjelasan tambahan.
`

    console.log('📝 Prompt preview (first 500 chars):', prompt.substring(0, 500))

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from AI')
    }

    const analysis = JSON.parse(responseContent)

    // Add recommendedMaterials based on learningConcepts
    const recommendedMaterials = analysis.knowledgeMap?.learningConcepts?.map(
      (lc: any) => lc.concept
    ) || []

    const analysisWithRecommendations = {
      ...analysis,
      recommendedMaterials
    }

    console.log('✅ AI Analysis completed:', {
      masteredCount: analysis.knowledgeMap?.masteredConcepts?.length || 0,
      learningCount: analysis.knowledgeMap?.learningConcepts?.length || 0,
      notStartedCount: analysis.knowledgeMap?.notStartedConcepts?.length || 0,
      totalConcepts: (analysis.knowledgeMap?.masteredConcepts?.length || 0) +
                     (analysis.knowledgeMap?.learningConcepts?.length || 0),
      expectedMin: stats.materialSummary.length,
      recommendedMaterialsCount: recommendedMaterials.length
    })

    return NextResponse.json(analysisWithRecommendations)
  } catch (error: any) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze learning pattern' },
      { status: 500 }
    )
  }
}
