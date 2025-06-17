import type { Interview } from "~/types/interview"
import Button from "../common/Button"

export interface CardFrontProps {
  interview: Interview
  showHint: boolean
  currentHint?: string
  totalHints: number
  currentHintIndex: number
  onToggleHint: () => void
  onHideHint: () => void
  onFlip: () => void
}

const getDifficultyStars = (difficulty: string): string => {
  switch (difficulty) {
    case "初級":
      return "★☆☆"
    case "中級":
      return "★★☆"
    case "上級":
      return "★★★"
    default:
      return "★☆☆"
  }
}

const CardFront = ({
  interview,
  showHint,
  currentHint,
  totalHints,
  currentHintIndex,
  onToggleHint,
  onHideHint,
  onFlip,
}: CardFrontProps) => {
  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー情報 */}
      <div className="text-center mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          カテゴリー: {interview.category}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          難易度: {getDifficultyStars(interview.difficulty)}
        </div>
      </div>

      {/* 質問カード */}
      <div className="flex-1 flex items-center justify-center mb-6">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-lg font-medium text-text text-center leading-relaxed">
            {interview.question}
          </p>
        </div>
      </div>

      {/* ヒント表示エリア */}
      {showHint && currentHint && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              ヒント {currentHintIndex + 1}/{totalHints}:
            </span>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {currentHint}
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            {currentHintIndex < totalHints - 1 && (
              <Button variant="ghost" size="sm" onClick={onToggleHint}>
                次のヒント
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onHideHint}>
              ヒントを隠す
            </Button>
          </div>
        </div>
      )}

      {/* ヒントボタン（ヒント未表示時） */}
      {!showHint && (
        <div className="mb-6 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHint}
            icon={
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            ヒントを見る ({totalHints}個)
          </Button>
        </div>
      )}

      {/* フリップボタン */}
      <div className="text-center">
        <Button
          variant="primary"
          size="lg"
          onClick={onFlip}
          className="min-h-[44px]"
        >
          タップして回答を見る
        </Button>
      </div>
    </div>
  )
}

export default CardFront
