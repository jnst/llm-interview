import { useEffect, useRef, useState, memo } from "react"
import type { Interview } from "~/types/interview"
import Card from "../common/Card"
import QualityRating from "../study/QualityRating"
import CardBack from "./CardBack"
import CardFront from "./CardFront"

export interface FlashCardProps {
  interview: Interview
  isFlipped: boolean
  onFlip: () => void
  onNext: () => void
  onPrevious: () => void
  onRate: (quality: number) => void
  showHint: boolean
  onToggleHint: () => void
  hints: string[]
  currentHintIndex: number
  onHideHint: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastCard?: boolean
  enableKeyboardShortcuts?: boolean
}

const FlashCard = memo(({
  interview,
  isFlipped,
  onFlip,
  onNext,
  onPrevious,
  onRate,
  showHint,
  onToggleHint,
  hints,
  currentHintIndex,
  onHideHint,
  canGoNext = true,
  canGoPrevious = true,
  isLastCard = false,
  enableKeyboardShortcuts = true,
}: FlashCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // キーボードショートカット
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyPress = (event: KeyboardEvent) => {
      // 入力フィールドにフォーカスがある場合は無視
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (event.key) {
        case " ": // スペースキー
          event.preventDefault()
          onFlip()
          break
        case "ArrowLeft":
          event.preventDefault()
          if (canGoPrevious) onPrevious()
          break
        case "ArrowRight":
          event.preventDefault()
          if (canGoNext) onNext()
          break
        case "h":
        case "H":
          event.preventDefault()
          if (showHint && currentHintIndex < hints.length - 1) {
            // 次のヒントに進む処理
            onToggleHint()
          } else {
            onToggleHint()
          }
          break
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          if (isFlipped) {
            event.preventDefault()
            onRate(Number.parseInt(event.key))
          }
          break
        default:
          break
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [
    enableKeyboardShortcuts,
    isFlipped,
    showHint,
    currentHintIndex,
    hints.length,
    canGoNext,
    canGoPrevious,
    onFlip,
    onNext,
    onPrevious,
    onToggleHint,
    onRate,
  ])

  // フリップアニメーション
  const handleFlip = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      onFlip()
      setIsAnimating(false)
    }, 300)
  }

  // スワイプジェスチャー対応（モバイル）
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  )
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
    null
  )

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > 150
    const isRightSwipe = distanceX < -150
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX)

    // 縦スワイプは無視
    if (isVerticalSwipe) return

    if (isLeftSwipe && canGoNext) {
      onNext()
    } else if (isRightSwipe && canGoPrevious) {
      onPrevious()
    }
  }

  const currentHint = hints[currentHintIndex]

  return (
    <div
      ref={cardRef}
      className="h-full max-h-[600px] perspective-1000"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-full">
        {/* カード表面 */}
        {!isFlipped && (
          <Card
            className={`
              h-full transition-all duration-300 cursor-pointer
              ${isAnimating ? "animate-pulse" : ""}
            `}
            padding="lg"
            variant="elevated"
            onClick={handleFlip}
          >
            <div className="h-full p-6">
              <CardFront
                interview={interview}
                showHint={showHint}
                currentHint={currentHint}
                totalHints={hints.length}
                currentHintIndex={currentHintIndex}
                onToggleHint={onToggleHint}
                onHideHint={onHideHint}
                onFlip={handleFlip}
              />
            </div>
          </Card>
        )}

        {/* カード裏面 */}
        {isFlipped && (
          <Card
            className={`
              h-full transition-all duration-300
              ${isAnimating ? "animate-pulse" : ""}
            `}
            padding="lg"
            variant="elevated"
          >
            <div className="h-full p-6 flex flex-col">
              <div className="flex-1 mb-6 overflow-hidden">
                <CardBack
                  interview={interview}
                  hintsUsed={Math.max(1, currentHintIndex + (showHint ? 1 : 0))}
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <QualityRating onRate={onRate} disabled={false} />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* キーボードショートカットのヘルプ（デスクトップ） */}
      {enableKeyboardShortcuts && (
        <div className="hidden lg:block mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          <div className="flex justify-center gap-4">
            <span>Space: カード裏返し</span>
            <span>←/→: 前後のカード</span>
            <span>H: ヒント</span>
            {isFlipped && <span>0-5: 評価</span>}
          </div>
        </div>
      )}
    </div>
  )
})

FlashCard.displayName = "FlashCard"

export default FlashCard
