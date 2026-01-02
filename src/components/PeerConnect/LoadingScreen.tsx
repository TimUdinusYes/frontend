interface LoadingScreenProps {
  categorizationStep: number
  detectedCategory: string
  userInterest: string
}

export default function LoadingScreen({
  categorizationStep,
  detectedCategory,
  userInterest
}: LoadingScreenProps) {
  const getStepMessage = () => {
    switch (categorizationStep) {
      case 1:
        return { title: 'Menganalisis Interest...', desc: `Membaca: "${userInterest}"` }
      case 2:
        return { title: 'Mengirim ke AI...', desc: 'Memproses dengan teknologi AI' }
      case 3:
        return { title: 'Kategori Ditemukan!', desc: `Anda cocok dengan: ${detectedCategory}` }
      case 4:
        return { title: 'Bergabung ke Community...', desc: `Masuk ke ${detectedCategory} Community` }
      case 5:
        return { title: 'Berhasil!', desc: 'Mengarahkan ke chat room...' }
      default:
        return { title: 'Memuat Chat Room...', desc: 'Mohon tunggu sebentar' }
    }
  }

  const { title, desc } = getStepMessage()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-lg mx-auto">
        {/* Icon Animation */}
        <div className="flex justify-center mb-6">
          {categorizationStep === 3 ? (
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          {desc}
        </p>

        {/* Progress Steps */}
        <div className="space-y-3 mb-6">
          {[
            { step: 1, label: 'Analisis Interest', icon: '🔍' },
            { step: 2, label: 'AI Processing', icon: '🤖' },
            { step: 3, label: 'Kategori Terdeteksi', icon: '✨' },
            { step: 4, label: 'Join Community', icon: '👥' }
          ].map(({ step, label, icon }) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                categorizationStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              }`}>
                {categorizationStep > step ? '✓' : icon}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  categorizationStep >= step
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {label}
                </div>
              </div>
              {categorizationStep === step && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Interest Box */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Interest:</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {userInterest}
          </p>
          {detectedCategory && (
            <>
              <div className="my-2 border-t border-blue-200 dark:border-gray-600"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Category:</p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {detectedCategory}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
