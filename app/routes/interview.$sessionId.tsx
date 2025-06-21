import {
  type LoaderFunctionArgs,
  json,
} from "@remix-run/node"
import {
  useLoaderData,
  useNavigate,
  useRouteError,
} from "@remix-run/react"
import { useCallback, useEffect, useState, useRef } from "react"
import Button from "~/components/common/Button"
import Card from "~/components/common/Card"
import Modal from "~/components/common/Modal"
import FlashCard from "~/components/flashcard/FlashCard"
import QualityRating from "~/components/study/QualityRating"
import Timer from "~/components/study/Timer"
import type {
  Interview,
  ReviewedInterview,
  StudySession,
} from "~/types/interview"
import { defaultHintManager } from "~/utils/hints"
import { LocalStorageManager } from "~/utils/localStorage"
import { defaultStudyManager } from "~/utils/study"

export async function loader({ params }: LoaderFunctionArgs) {
  const { sessionId } = params

  if (!sessionId) {
    throw new Response("セッションIDが見つかりません", { status: 404 })
  }

  try {
    // 質問データを読み込み
    const interviews: Interview[] = await import("~/data/interview.json").then(
      (module) => (module.default || module) as Interview[]
    )

    return json({ interviews, sessionId })
  } catch (error) {
    console.error("Failed to load interview data:", error)
    throw new Response("質問データの読み込みに失敗しました", { status: 500 })
  }
}


export default function SessionStudy() {
  const { interviews, sessionId } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  const [session, setSession] = useState<StudySession | null>(null)
  const [currentInterviews, setCurrentInterviews] = useState<Interview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date())
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date())
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showExitModal, setShowExitModal] = useState(false)
  const [hints, setHints] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // セッションの初期化
  useEffect(() => {
    // ヒントキャッシュをクリア（新しいセッション開始時）
    defaultHintManager.clearCache()
    
    const loadedSession = LocalStorageManager.getSession(sessionId)
    if (loadedSession) {
      setSession(loadedSession)
      setSessionStartTime(new Date(loadedSession.startedAt))

      // セッション用のカードを決定 (実際の実装では、セッション開始時に保存される)
      const config = {
        maxCards: 20,
        includeNew: true,
        includeReview: true,
        categories: [],
        difficulties: [],
      }

      const availableCards = interviews
        .filter((interview) => {
          return (
            defaultStudyManager.getAvailableCardsCount([interview], config) > 0
          )
        })
        .slice(0, 20)

      setCurrentInterviews(availableCards)
    } else {
      // セッションが見つからない場合はホームに戻る
      navigate("/")
    }
  }, [sessionId, interviews, navigate])

  // 現在のカードのヒントを生成
  useEffect(() => {
    if (
      currentInterviews.length > 0 &&
      currentIndex < currentInterviews.length
    ) {
      const currentInterview = currentInterviews[currentIndex]
      const hintSet = defaultHintManager.generateHints(currentInterview.id, currentInterview.answer)
      const generatedHints = hintSet.hints.map(hint => hint.content)
      setHints(generatedHints)
      
      // カードが変わったときにヒント状態をリセット
      setShowHint(false)
      setCurrentHintIndex(0)
    }
  }, [currentInterviews, currentIndex])


  const currentInterview = currentInterviews[currentIndex]
  const isLastCard = currentIndex >= currentInterviews.length - 1

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped)
  }, [isFlipped])

  const handleNext = useCallback(() => {
    if (currentIndex < currentInterviews.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setShowHint(false)
      setCurrentHintIndex(0)
      setCardStartTime(new Date())
      setHintsUsed(0)
    }
  }, [currentIndex, currentInterviews.length])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
      setShowHint(false)
      setCurrentHintIndex(0)
      setCardStartTime(new Date())
      setHintsUsed(0)
    }
  }, [currentIndex])

  const handleShowHint = useCallback(() => {
    if (!showHint) {
      setShowHint(true)
      setHintsUsed(1)
    } else if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1)
      setHintsUsed(hintsUsed + 1)
    }
  }, [showHint, currentHintIndex, hints.length, hintsUsed])

  const handleHideHint = useCallback(() => {
    setShowHint(false)
  }, [])

  const handleQualityRate = useCallback(
    (quality: number) => {
      if (!currentInterview || !session) return

      try {
        const responseTime = Math.floor(
          (new Date().getTime() - cardStartTime.getTime()) / 1000
        )

        const reviewedInterview: ReviewedInterview = {
          interviewId: currentInterview.id,
          isCorrect: quality >= 3, // 品質3以上を正解とする
          reviewedAt: new Date(),
          responseTime,
          quality,
          hintsShown: hintsUsed,
        }

        // クライアントサイドで学習記録を更新
        const updatedSession = defaultStudyManager.addReviewToSession(
          sessionId,
          reviewedInterview
        )

        if (updatedSession) {
          setSession(updatedSession)
        }

        // 次のカードに進む
        if (!isLastCard) {
          setTimeout(() => {
            handleNext()
          }, 500)
        }
      } catch (error) {
        console.error('Failed to record answer:', error)
        setError('回答の記録に失敗しました')
      }
    },
    [currentInterview, session, sessionId, cardStartTime, hintsUsed, isLastCard, handleNext]
  )

  const handleEndSession = () => {
    try {
      const endedSession = defaultStudyManager.endSession(sessionId)
      if (endedSession) {
        setSession(endedSession)
      }
      // セッション終了後はホームに戻る
      navigate("/", { replace: true })
    } catch (error) {
      console.error('Failed to end session:', error)
      setError('セッションの終了に失敗しました')
    }
  }

  const handleExit = () => {
    setShowExitModal(true)
  }


  if (!session || !currentInterview) {
    return (
      <div className="min-h-screen bg-background text-text">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <span className="ml-2 text-text">読み込み中...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-text">
      {/* ヘッダー */}
      <header className="bg-surface border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleExit}
                className="text-text hover:text-primary"
              >
                ←
              </button>
              <span className="text-text font-medium">
                {currentIndex + 1}/{currentInterviews.length}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Timer startTime={sessionStartTime} />
              <button
                type="button"
                onClick={handleExit}
                className="text-text hover:text-error"
              >
                ×
              </button>
            </div>
          </div>
          {/* 進捗バー */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / currentInterviews.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {error && (
            <Card className="mb-4 border-error">
              <div className="text-error text-center">{error}</div>
            </Card>
          )}

          <FlashCard
            interview={currentInterview}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onRate={handleQualityRate}
            showHint={showHint}
            onToggleHint={handleShowHint}
            hints={hints}
            currentHintIndex={currentHintIndex}
            onHideHint={handleHideHint}
            canGoNext={currentIndex < currentInterviews.length - 1}
            canGoPrevious={currentIndex > 0}
            isLastCard={isLastCard}
          />

          {/* セッション終了ボタン */}
          {isLastCard && isFlipped && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleEndSession}
                variant="success"
                size="lg"
                fullWidth
              >
                セッションを終了
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* 離脱確認モーダル */}
      {showExitModal && (
        <Modal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          title="学習を中断しますか？"
        >
          <div className="space-y-4">
            <p className="text-text">
              学習セッションが進行中です。本当に離脱しますか？
              進捗は保存されません。
            </p>
            <div className="flex space-x-4">
              <Button onClick={() => navigate("/")} variant="error" fullWidth>
                離脱
              </Button>
              <Button
                onClick={() => setShowExitModal(false)}
                variant="ghost"
                fullWidth
              >
                続ける
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-error">
                エラーが発生しました
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {error instanceof Error
                  ? error.message
                  : "予期しないエラーが発生しました"}
              </p>
              <div className="flex space-x-4 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                  variant="primary"
                >
                  再読み込み
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="ghost"
                >
                  ホームに戻る
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
