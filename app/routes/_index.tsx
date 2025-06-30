import {
  type LoaderFunctionArgs,
  type MetaFunction,
  json,
} from "@remix-run/node"
import { Link, useLoaderData, useNavigate, useRouteError } from "@remix-run/react"
import { useEffect, useState } from "react"
import Button from "~/components/common/Button"
import Card from "~/components/common/Card"
import type { Interview, StudyStats } from "~/types/interview"
import { LocalStorageManager } from "~/utils/localStorage"
import { defaultStudyManager, type SessionStartConfig } from "~/utils/study"

export const meta: MetaFunction = () => {
  return [
    { title: "LLM Interview - AI面接対策学習アプリ" },
    {
      name: "description",
      content: "LLM面接対策のためのフラッシュカード学習アプリ",
    },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // 質問データを読み込み
    const interviews: Interview[] = await import("~/data/interview.json").then(
      (module) => (module.default || module) as Interview[]
    )

    return json({ interviews })
  } catch (error) {
    console.error("Failed to load interview data:", error)
    throw new Response("質問データの読み込みに失敗しました", { status: 500 })
  }
}

export default function Index() {
  const { interviews } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [isStarting, setIsStarting] = useState(false)

  // クライアントサイドでのみ統計を計算
  useEffect(() => {
    const calculateStats = () => {
      try {
        const studyStats = defaultStudyManager.calculateStudyStats(interviews)
        setStats(studyStats)
      } catch (error) {
        console.error("Failed to calculate stats:", error)
        // デフォルト統計を設定
        setStats({
          totalCards: interviews.length,
          studiedToday: 0,
          dueToday: 0,
          newToday: interviews.length,
          streak: 0,
          averageAccuracy: 0,
          totalStudyTime: 0,
          categoryProgress: [],
        })
      } finally {
        setIsLoading(false)
      }
    }

    // コンポーネントマウント後に計算
    calculateStats()
    
    // テーマを読み込み
    const savedTheme = LocalStorageManager.getSettings().theme
    setTheme(savedTheme)
    document.documentElement.classList.toggle(
      "dark",
      savedTheme === "dark"
    )
  }, [interviews])

  // デフォルト設定で学習を開始する関数
  const handleQuickStart = () => {
    if (isStarting) return
    
    setIsStarting(true)
    
    try {
      const defaultConfig: SessionStartConfig = {
        maxCards: 20,
        includeNew: true,
        includeReview: true,
        categories: [],
        difficulties: [],
      }
      
      const session = defaultStudyManager.startStudySession(interviews, defaultConfig)
      navigate(`/interview/${session.id}`)
    } catch (error) {
      console.error('Failed to start session:', error)
      setIsStarting(false)
    }
  }

  if (isLoading) {
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
              <div className="flex items-center space-x-2">
                <span className="text-xl">≡</span>
                <h1 className="text-xl font-bold text-text">LLM Interview</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const newTheme = theme === "light" ? "dark" : "light"
                  setTheme(newTheme)
                  LocalStorageManager.updateSettings({ theme: newTheme })
                  document.documentElement.classList.toggle(
                    "dark",
                    newTheme === "dark"
                  )
                }}
                className="p-2 text-text hover:bg-surface rounded-lg transition-colors"
                title="テーマを切り替え"
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* 中央のメインコンテンツ */}
          <div className="text-center space-y-8">
            {/* アプリ名とサブタイトル */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-text">LLM Interview</h2>
              <p className="text-gray-600 dark:text-gray-400">
                AI面接対策フラッシュカード
              </p>
            </div>

            {/* 簡単な統計情報 */}
            <div className="bg-surface rounded-lg p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {interviews?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  問題数
                </div>
              </div>
            </div>

            {/* 学習開始ボタン */}
            <Button
              onClick={handleQuickStart}
              size="lg"
              fullWidth
              disabled={isStarting}
              className="text-xl font-semibold py-6 text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isStarting ? "開始中..." : "学習を開始する"}
            </Button>

            {/* サブメニュー */}
            <div className="flex justify-center space-x-4 pt-4">
              <Link to="/interview">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-text"
                >
                  <span>⚙️</span>
                  <span>詳細設定</span>
                </Button>
              </Link>
              <Link to="/progress">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-text"
                >
                  <span>📊</span>
                  <span>進捗</span>
                </Button>
              </Link>
              <Link to="/settings">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-text"
                >
                  <span>⚙️</span>
                  <span>設定</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

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
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
              >
                再読み込み
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
