import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stats } = body;

    if (!stats) {
      return NextResponse.json(
        { error: "Stats are required" },
        { status: 400 }
      );
    }

    // Debug: Log received data
    console.log("📊 Combined Stats received:", {
      totalMaterials: stats.totalMaterialsOpened,
      materialsCompleted: stats.materialsCompleted,
      quizDataCount: stats.materialQuizSummary?.length || 0,
      activityDataCount: stats.materialSummary?.length || 0,
      hasQuizData: (stats.materialQuizSummary?.length || 0) > 0,
    });

    // Debug: Log detail setiap materi
    console.log("📚 Material Details:");
    console.log("Quiz Data:", stats.materialQuizSummary?.map((m: any) => ({
      title: m.material_title,
      quiz: `${m.total_correct}/${m.total_pages}`,
      opens: m.total_opens,
      duration: m.total_duration
    })));
    console.log("Activity Data:", stats.materialSummary?.map((m: any) => ({
      title: m.material_title,
      opens: m.total_opens,
      duration: m.total_duration,
      completed: m.is_completed
    })));

    const prompt = `
Anda adalah seorang AI learning assistant yang menganalisis pemahaman siswa dan membangun peta pengetahuan (knowledge map).

METODE ANALISIS HYBRID:
- **PRIMARY (Acuan Utama)**: Skor Quiz dari setiap materi → mengukur pemahaman langsung
- **SECONDARY (Data Pendukung)**: Waktu & frekuensi belajar → memahami pola dan konsistensi

Data Ringkasan:
- Total materi dibuka: ${stats.totalMaterialsOpened}
- Total waktu belajar: ${stats.totalTimeSpent} menit  
- Materi selesai: ${stats.materialsCompleted}

${
  stats.materialQuizSummary && stats.materialQuizSummary.length > 0
    ? `
DETAIL MATERI DENGAN QUIZ (PRIORITAS ANALISIS):
${stats.materialQuizSummary
  .map((m: any) => {
    const quizScore =
      m.total_pages > 0
        ? Math.round((m.total_correct / m.total_pages) * 100)
        : 0;
    return `- ${m.material_title} (${m.topic_title}):
  📊 QUIZ: ${m.total_correct}/${m.total_pages} soal benar (${quizScore}%)
  ⏱️ AKTIVITAS: dibuka ${m.total_opens}x, durasi ${m.total_duration}s${
      m.is_completed ? ", completed" : ""
    }`;
  })
  .join("\n")}

MATERI LAIN (tanpa quiz):
${
  stats.materialSummary
    .filter(
      (m: any) =>
        !stats.materialQuizSummary.some(
          (q: any) => q.material_title === m.material_title
        )
    )
    .map(
      (m: any) =>
        `- ${m.material_title} (${m.topic_title}): dibuka ${
          m.total_opens
        }x, durasi ${m.total_duration}s, completed: ${
          m.is_completed ? "YA" : "TIDAK"
        }`
    )
    .join("\n") || "(Tidak ada)"
}
`
    : `
DETAIL MATERI (hanya data aktivitas, belum ada quiz):
${stats.materialSummary
  .map(
    (m: any) =>
      `- ${m.material_title} (${m.topic_title}): dibuka ${
        m.total_opens
      }x, durasi ${m.total_duration}s, completed: ${
        m.is_completed ? "YA" : "TIDAK"
      }`
  )
  .join("\n")}
`
}

Tugas Anda:
1. Analisis SETIAP materi yang tercantum (WAJIB SEMUA!)
2. Prioritaskan quiz score sebagai indikator utama pemahaman
3. Gunakan data aktivitas untuk memperkaya insight
4. Bangun knowledge map yang akurat
5. Berikan rekomendasi berbasis data quiz

Berikan analisis dalam format JSON berikut:
{
  "knowledgeMap": {
    "masteredConcepts": [
      {
        "concept": "Nama konsep",
        "confidence": 85,
        "evidence": "Alasan mengapa siswa dikategorikan paham (prioritaskan quiz score)"
      }
    ],
    "learningConcepts": [
      {
        "concept": "Nama konsep",
        "progress": 60,
        "needsReview": true,
        "estimatedTimeToMaster": "2-3 jam",
        "status": "Status detail (contoh: 'Belum mengerjakan quiz', 'Quiz sudah dikerjakan (60%) tapi perlu perbaikan', 'Materi baru dibuka sebentar')"
      }
    ],
    "notStartedConcepts": [
      {
        "concept": "Nama konsep",
        "prerequisite": ["Konsep A", "Konsep B"],
        "difficulty": "medium",
        "estimatedLearningTime": "4-5 jam",
        "reason": "Alasan kenapa belum dimulai (misal: belum ada data aktivitas atau quiz untuk topik ini)"
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

🎯 ATURAN KATEGORISASI HYBRID (PRIORITAS QUIZ):

1. UNTUK MATERI DENGAN QUIZ DATA:
   
   a) masteredConcepts (PAHAM):
      - Quiz score >= 80% (total_correct/total_pages >= 0.8)
      - Confidence: 75-95% tergantung konsistensi dengan aktivitas
      - Evidence WAJIB menyebut quiz score
      - Contoh: "Quiz score 90% (9/10 benar) menunjukkan pemahaman solid"
   
   b) learningConcepts (SEDANG BELAJAR):
      - Quiz score < 80%
      - Progress: WAJIB HYBRID calculation (JANGAN hanya quiz score!)
        * Base: quiz score percentage (contoh: 33% jika 1/3 benar)
        * Bonus: +5-10% jika total_opens >2x DAN total_duration >120s (menunjukkan usaha konsisten)
        * Penalty: -5% jika total_opens <=1 (kurang latihan)
        * CONTOH KALKULASI:
          - Quiz 1/3 (33%) + dibuka 7x (>2) + durasi 637s (>120s) = 33% + 8% bonus = 41%
          - Quiz 5/10 (50%) + dibuka 3x + durasi 180s = 50% + 7% bonus = 57%
          - Quiz 7/10 (70%) + dibuka 1x + durasi 45s = 70% - 5% penalty = 65%
      - needsReview: true jika quiz score < 60% OR (score < 70% AND total_opens <=1)
      - Evidence WAJIB kombinasi quiz + aktivitas
      - Status WAJIB:
        * Jika ada quiz data: "Quiz sudah dikerjakan ({quiz_percentage}%) tapi perlu perbaikan"
        * Jika tidak ada quiz: "Belum mengerjakan quiz" atau "Materi baru dibuka {total_opens}x"
      - Contoh: "Quiz score 60% (6/10), sudah dibuka 3x dengan durasi 180s - perlu fokus pada 4 konsep yang masih salah"

2. UNTUK MATERI TANPA QUIZ (fallback ke aktivitas):
   
   a) masteredConcepts:
      - Completed: YA AND dibuka >1x AND durasi >60s
      - Confidence: 70-80% (lebih rendah karena tidak ada quiz)
   
   b) learningConcepts:
      - Completed: TIDAK OR dibuka 1x OR durasi <60s
      - Progress: (total_duration / 300) * 100 (max 90%)
      - Status: "Belum mengerjakan quiz" (karena tidak ada data quiz)

3. notStartedConcepts:
   - Topik yang TIDAK ADA sama sekali di data
   - Minimal 2-3 topik relevan dengan bidang studi
   - WAJIB sertakan reason: jelaskan mengapa topik ini direkomendasikan (contoh: "Fundamental untuk pemrograman", "Topik lanjutan dari materi yang sudah dipelajari")

4. WAJIB LENGKAP:
   - Total konsep di masteredConcepts + learningConcepts >= jumlah total materi
   - Minimal 3-5 predictedChallenges
   - Minimal 5-8 optimalLearningPath steps
   - Minimal 5 insights (fokus pada quiz performance)

5. ANTI-DUPLIKASI (CRITICAL):
   - WAJIB: Setiap materi HANYA BOLEH muncul di SATU kategori
   - TIDAK BOLEH materi yang sama ada di masteredConcepts DAN learningConcepts
   - Jika ada data duplikat dengan score berbeda, pilih yang TERBARU atau TERTINGGI
   - Case-insensitive: "JavaScript" = "javascript" = "JAVASCRIPT"

6. INSIGHTS HARUS BERBASIS QUIZ:
   - Jika ada quiz data: sebutkan performa quiz
   - Highlight materi dengan score tinggi (strength)
   - Identifikasi materi dengan score rendah (weakness)
   - Berikan rekomendasi spesifik untuk improvement

CONTOH KATEGORISASI:

Materi dengan Quiz:
- "Matematika Dasar: Quiz 9/10 (90%), dibuka 3x, 120s"
  → masteredConcepts, confidence: 90%, evidence: "Score quiz 90% dengan konsistensi baik"

- "Fisika: Quiz 5/10 (50%), dibuka 3x, 180s"
  → learningConcepts
  → progress: 57% (BUKAN 50%! Hitung: base 50% + bonus 7% karena 3x opens & 180s duration)
  → needsReview: true
  → status: "Quiz sudah dikerjakan (50%) tapi perlu perbaikan"
  → evidence: "Quiz score 50%, sudah belajar 3x (180s) tapi masih perlu review 5 konsep yang salih"

- "Kimia: Quiz 7/10 (70%), dibuka 1x, 45s"
  → learningConcepts
  → progress: 65% (BUKAN 70%! Hitung: base 70% - penalty 5% karena hanya 1x opens)
  → needsReview: true (score <70% AND opens <=1)
  → status: "Quiz sudah dikerjakan (70%) tapi kurang latihan"
  → evidence: "Quiz 70% tapi baru dibuka 1x (45s), perlu latihan lebih banyak"

- "JavaScript: Quiz 1/3 (33%), dibuka 7x, 637s"
  → learningConcepts
  → progress: 41% (BUKAN 33%! Hitung: base 33% + bonus 8% karena 7x opens & 637s duration)
  → needsReview: true
  → status: "Quiz sudah dikerjakan (33%) tapi perlu perbaikan"
  → evidence: "Quiz score 33%, sudah belajar konsisten 7x (637s) menunjukkan usaha baik"

Materi tanpa Quiz:
- "Bahasa Indonesia: dibuka 2x, 150s, completed: YA"
  → masteredConcepts, confidence: 75%, evidence: "Completed dengan aktivitas konsisten"

- "Kimia: dibuka 1x, 30s, completed: TIDAK"
  → learningConcepts, progress: 10%
  → status: "Belum mengerjakan quiz"
  → evidence: "Baru diakses sebentar, perlu waktu lebih"

Jawab hanya dengan JSON yang valid, tanpa markdown atau penjelasan tambahan.
`;

    console.log(
      "📝 Prompt preview (first 500 chars):",
      prompt.substring(0, 500)
    );

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from AI");
    }

    const analysis = JSON.parse(responseContent);

    // Add recommendedMaterials based on learningConcepts
    const recommendedMaterials =
      analysis.knowledgeMap?.learningConcepts?.map((lc: any) => lc.concept) ||
      [];

    const analysisWithRecommendations = {
      ...analysis,
      recommendedMaterials,
    };

    console.log("✅ AI Analysis completed:", {
      masteredCount: analysis.knowledgeMap?.masteredConcepts?.length || 0,
      learningCount: analysis.knowledgeMap?.learningConcepts?.length || 0,
      notStartedCount: analysis.knowledgeMap?.notStartedConcepts?.length || 0,
      totalConcepts:
        (analysis.knowledgeMap?.masteredConcepts?.length || 0) +
        (analysis.knowledgeMap?.learningConcepts?.length || 0),
      expectedMin: stats.materialSummary.length,
      recommendedMaterialsCount: recommendedMaterials.length,
    });

    return NextResponse.json(analysisWithRecommendations);
  } catch (error: any) {
    console.error("Error in AI analysis:", error);

    // Handle rate limit errors specifically
    if (error?.status === 429 || error?.error?.code === "rate_limit_exceeded") {
      return NextResponse.json(
        {
          error:
            "AI sedang sibuk. Silakan tunggu beberapa detik dan refresh halaman.",
          retryAfter: 10,
        },
        { status: 503 } // Service temporarily unavailable
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to analyze learning pattern" },
      { status: 500 }
    );
  }
}