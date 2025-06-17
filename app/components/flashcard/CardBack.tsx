import type { Interview } from "~/types/interview"

export interface CardBackProps {
  interview: Interview
  hintsUsed: number
}

const CardBack = ({ interview, hintsUsed }: CardBackProps) => {
  const { answer } = interview

  const renderSection = (title: string, content: string | string[]) => {
    if (!content || (Array.isArray(content) && content.length === 0))
      return null

    return (
      <div className="mb-4">
        <h4 className="font-semibold text-text mb-2">{title}:</h4>
        {Array.isArray(content) ? (
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {content.map((item, index) => (
              <li key={`${title}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {content}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-4">
        {/* 定義・概要 */}
        {renderSection("定義", answer.definition)}

        {/* 重要性 */}
        {renderSection("重要性", answer.importance)}

        {/* 仕組み・動作原理 */}
        {renderSection("仕組み", answer.mechanism)}

        {/* 要点 */}
        {renderSection("要点", answer.key_points)}

        {/* 具体例 */}
        {renderSection("具体例", answer.examples)}

        {/* 応用例 */}
        {renderSection("応用例", answer.applications)}

        {/* 利点・メリット */}
        {renderSection("利点", answer.advantages)}

        {/* 制限・課題 */}
        {renderSection("制限", answer.limitations)}

        {/* 数式やアルゴリズム */}
        {renderSection("数式・アルゴリズム", answer.formulas)}

        {/* 関連概念 */}
        {renderSection("関連概念", answer.related_concepts)}

        {/* 補足説明 */}
        {renderSection("補足", answer.additional_notes)}

        {/* ヒント使用表示 */}
        {hintsUsed > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg
                className="w-4 h-4 text-yellow-500"
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
              <span>ヒント使用: {hintsUsed}個</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CardBack
