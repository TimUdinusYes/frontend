'use client';

import { useState, useEffect } from 'react';
import { useQuiz, QuizOption } from '../hooks/useQuiz';
import { motion, AnimatePresence } from 'framer-motion';
import GenerateQuizPrompt from './GenerateQuizPrompt';

interface QuizGameProps {
  materiId: number;
  materiTitle: string;
  userId: string; // UUID
  onComplete?: (score: number, totalXP: number) => void;
  onBack?: () => void;
}

export default function QuizGame({
  materiId,
  materiTitle,
  userId,
  onComplete,
  onBack,
}: QuizGameProps) {
  const {
    currentQuestion,
    currentQuestionIndex,
    questions,
    answers,
    score,
    totalXP,
    isLoading,
    isCompleted,
    error,
    isCurrentQuestionAnswered,
    currentAnswer,
    submitAnswer,
    nextQuestion,
    resetQuiz,
  } = useQuiz(materiId, userId);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selected option when question changes
  useEffect(() => {
    setSelectedOption(null);
    setShowResult(false);
  }, [currentQuestionIndex]);

  // Handle answer submission
  const handleSubmit = async () => {
    if (!selectedOption || !currentQuestion) return;

    setIsSubmitting(true);
    try {
      await submitAnswer(currentQuestion.id, selectedOption);
      setShowResult(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    }
  };

  // Handle complete callback
  useEffect(() => {
    if (isCompleted && onComplete) {
      onComplete(score, totalXP);
    }
  }, [isCompleted, score, totalXP, onComplete]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md bg-white rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-black font-black text-lg mb-2">Loading quiz...</p>
          <p className="text-black/70 text-sm font-bold">
            If this is your first time, were generating questions with AI. This may take up to 30 seconds.
          </p>
        </div>
      </div>
    );
  }

  // Error state - Show generate prompt if no questions found
  if (error) {
    const isNoQuestions = error.includes('No quiz questions') || error.includes('404');

    if (isNoQuestions) {
      return (
        <GenerateQuizPrompt
          materiId={materiId}
          materiTitle={materiTitle}
          onGenerated={resetQuiz}
        />
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-200 rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-black text-black mb-2">Oops!</h3>
          <p className="text-black/70 font-bold mb-4">{error}</p>
          <button
            onClick={resetQuiz}
            className="px-6 py-3 bg-blue-500 text-white font-black rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Completion state
  if (isCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 60;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center max-w-md bg-white rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-8xl mb-6"
          >
            {passed ? '🎉' : '💪'}
          </motion.div>

          <h2 className="text-3xl font-black text-black mb-2">
            {passed ? 'Congratulations!' : 'Good Effort!'}
          </h2>

          <p className="text-black/70 font-bold mb-6">
            {passed
              ? 'You passed the quiz!'
              : 'Keep learning and try again!'}
          </p>

          <div className="bg-yellow-200 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-black text-black">{score}</div>
                <div className="text-sm text-black/70 font-bold">Correct</div>
              </div>
              <div>
                <div className="text-3xl font-black text-black">
                  {percentage}%
                </div>
                <div className="text-sm text-black/70 font-bold">Score</div>
              </div>
              <div>
                <div className="text-3xl font-black text-black">
                  +{totalXP}
                </div>
                <div className="text-sm text-black/70 font-bold">XP</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={resetQuiz}
              className="w-full px-6 py-3 bg-blue-500 text-white font-black rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-gray-200 text-black font-black rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              Back to Materials
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // No questions
  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-600">No quiz questions available yet.</p>
        </div>
      </div>
    );
  }

  // Get option style based on state
  const getOptionStyle = (option: QuizOption) => {
    if (!showResult) {
      return selectedOption === option.id
        ? 'bg-blue-200 border-black border-[3px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
        : 'bg-white border-black border-[3px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]]';
    }

    if (currentAnswer?.correctOptionId === option.id) {
      return 'bg-green-200 border-black border-[3px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]';
    }

    if (selectedOption === option.id && !currentAnswer?.isCorrect) {
      return 'bg-red-200 border-black border-[3px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]';
    }

    return 'bg-gray-100 border-black border-[3px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 bg-white rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-black">{materiTitle}</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-black">
              Score: <span className="text-blue-600 font-black">{score}/{questions.length}</span>
            </div>
            <div className="text-sm font-bold text-black">
              XP: <span className="text-green-600 font-black">+{totalXP}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-white border-2 border-black rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
            className="h-full bg-yellow-400"
          />
        </div>
        <p className="text-sm text-black font-bold mt-2">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-xl border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-8 mb-6"
        >
          {/* Question */}
          <div className="mb-8">
            <div className="inline-block px-4 py-2 bg-blue-200 border-2 border-black text-black rounded-full text-sm font-black mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Question {currentQuestion.questionNumber}
            </div>
            <h3 className="text-xl font-black text-black leading-relaxed">
              {currentQuestion.questionText}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={option.id}
                whileHover={{ scale: showResult ? 1 : 1.02 }}
                whileTap={{ scale: showResult ? 1 : 0.98 }}
                onClick={() => {
                  if (!showResult && !isSubmitting) {
                    setSelectedOption(option.id);
                  }
                }}
                disabled={showResult || isSubmitting}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${getOptionStyle(
                  option
                )} ${showResult || isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black text-lg ${showResult && currentAnswer?.correctOptionId === option.id
                      ? 'bg-green-400 text-black'
                      : showResult && selectedOption === option.id && !currentAnswer?.isCorrect
                        ? 'bg-red-400 text-black'
                        : selectedOption === option.id
                          ? 'bg-blue-400 text-black'
                          : 'bg-white text-black'
                      }`}
                  >
                    {option.letter}
                  </div>
                  <div className="flex-1 text-black font-bold">{option.text}</div>
                  {showResult && currentAnswer?.correctOptionId === option.id && (
                    <div className="text-2xl">✓</div>
                  )}
                  {showResult && selectedOption === option.id && !currentAnswer?.isCorrect && (
                    <div className="text-2xl">✗</div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {showResult && currentAnswer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <div
                  className={`p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${currentAnswer.isCorrect
                    ? 'bg-green-200'
                    : 'bg-red-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {currentAnswer.isCorrect ? '🎉' : '😔'}
                    </div>
                    <div>
                      <p className="font-black text-black">
                        {currentAnswer.isCorrect
                          ? 'Correct! Great job! 🎯'
                          : 'Incorrect. Keep learning! 💪'}
                      </p>
                      <p className="text-sm text-black/70 mt-1 font-bold">
                        {currentAnswer.isCorrect
                          ? '+5 XP earned'
                          : 'Review the material and try again'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption || isSubmitting}
            className={`flex-1 py-4 rounded-xl font-black text-lg border-2 border-black transition-all ${selectedOption && !isSubmitting
              ? 'bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={currentQuestionIndex >= questions.length - 1}
            className="flex-1 py-4 bg-blue-500 text-white rounded-xl font-black text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            {currentQuestionIndex >= questions.length - 1
              ? 'Complete Quiz'
              : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}