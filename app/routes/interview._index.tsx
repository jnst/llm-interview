import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node"
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react"
import { useEffect, useState } from "react"
import Button from "~/components/common/Button"
import Card from "~/components/common/Card"
import type { Category, Difficulty, Interview } from "~/types/interview"
import { LocalStorageManager } from "~/utils/localStorage"
import { type SessionStartConfig, defaultStudyManager } from "~/utils/study"

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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const action = formData.get("_action")

  if (action === "start_session") {
    // セッション設定を取得
    const maxCards = Number.parseInt(formData.get("maxCards") as string) || 20
    const includeNew = formData.get("includeNew") === "on"
    const includeReview = formData.get("includeReview") === "on"
    const categories = formData.getAll("categories") as Category[]
    const difficulties = formData.getAll("difficulties") as Difficulty[]

    // 質問データを読み込み
    const interviews: Interview[] = await import("~/data/interview.json").then(
      (module) => (module.default || module) as Interview[]
    )

    const config: SessionStartConfig = {
      maxCards,
      includeNew,
      includeReview,
      categories,
      difficulties,
    }

    try {
      // セッションを開始
      const session = defaultStudyManager.startStudySession(interviews, config)
      return redirect(`/interview/${session.id}`)
    } catch (error) {
      return json({ error: "セッションの開始に失敗しました" }, { status: 400 })
    }
  }

  return json({ error: "無効なアクションです" }, { status: 400 })
}

export default function InterviewIndex() {
  const { interviews } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [config, setConfig] = useState<SessionStartConfig>({
    maxCards: 20,
    includeNew: true,
    includeReview: true,
    categories: [],
    difficulties: [],
  })
  const [availableCards, setAvailableCards] = useState(0)

  // 利用可能なカード数を計算
  useEffect(() => {
    const count = defaultStudyManager.getAvailableCardsCount(interviews, config)
    setAvailableCards(count)
  }, [interviews, config])

  // カテゴリーのリスト
  const allCategories: Category[] = [
    "基礎概念",
    "アーキテクチャ",
    "学習手法",
    "応用技術",
    "評価指標",
    "実装技術",
    "倫理・社会的影響",
  ]

  // 難易度のリスト
  const allDifficulties: Difficulty[] = ["初級", "中級", "上級"]

  const handleConfigChange = (updates: Partial<SessionStartConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const toggleCategory = (category: Category) => {
    const newCategories = config.categories.includes(category)
      ? config.categories.filter((c) => c !== category)
      : [...config.categories, category]
    handleConfigChange({ categories: newCategories })
  }

  const toggleDifficulty = (difficulty: Difficulty) => {
    const newDifficulties = config.difficulties.includes(difficulty)
      ? config.difficulties.filter((d) => d !== difficulty)
      : [...config.difficulties, difficulty]
    handleConfigChange({ difficulties: newDifficulties })
  }

  const getDifficultyEmoji = (difficulty: Difficulty) => {
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

  return (
    <div className="min-h-screen bg-background text-text">
      {/* ヘッダー */}
      <header className="bg-surface border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-text hover:text-primary">
              ←
            </Link>
            <h1 className="text-xl font-bold text-text">学習設定</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {actionData?.error && (
            <Card className="border-error">
              <div className="text-error text-center">{actionData.error}</div>
            </Card>
          )}

          <Form method="post">
            <input type="hidden" name="_action" value="start_session" />

            {/* カード数設定 */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">
                  学習カード数
                </h3>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text" htmlFor="maxCards">
                    1セッションあたりのカード数
                  </label>
                  <input
                    id="maxCards"
                    type="range"
                    name="maxCards"
                    min="5"
                    max="50"
                    step="5"
                    value={config.maxCards}
                    onChange={(e) =>
                      handleConfigChange({
                        maxCards: Number.parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>5</span>
                    <span className="font-semibold text-primary">
                      {config.maxCards}枚
                    </span>
                    <span>50</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* カードタイプ設定 */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">学習対象</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="includeNew"
                      checked={config.includeNew}
                      onChange={(e) =>
                        handleConfigChange({ includeNew: e.target.checked })
                      }
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-text">新規カード</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({defaultStudyManager.getNewCardsCount(interviews)}枚)
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="includeReview"
                      checked={config.includeReview}
                      onChange={(e) =>
                        handleConfigChange({ includeReview: e.target.checked })
                      }
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-text">復習カード</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({defaultStudyManager.getDueCardsCount(interviews)}枚)
                    </span>
                  </label>
                </div>
              </div>
            </Card>

            {/* カテゴリー選択 */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">カテゴリー</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  未選択の場合は全カテゴリーが対象になります
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {allCategories.map((category) => {
                    const categoryCount = interviews.filter(
                      (i) => i.category === category
                    ).length
                    return (
                      <label
                        key={category}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          name="categories"
                          value={category}
                          checked={config.categories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-text">{category}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({categoryCount}枚)
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* 難易度選択 */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">難易度</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  未選択の場合は全難易度が対象になります
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {allDifficulties.map((difficulty) => {
                    const difficultyCount = interviews.filter(
                      (i) => i.difficulty === difficulty
                    ).length
                    return (
                      <label
                        key={difficulty}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          name="difficulties"
                          value={difficulty}
                          checked={config.difficulties.includes(difficulty)}
                          onChange={() => toggleDifficulty(difficulty)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-text">{difficulty}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getDifficultyEmoji(difficulty)} ({difficultyCount}枚)
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* 学習可能カード数表示 */}
            <Card>
              <div className="text-center space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  現在の設定で学習可能なカード数
                </div>
                <div className="text-2xl font-bold text-primary">
                  {availableCards}枚
                </div>
                {availableCards === 0 && (
                  <div className="text-sm text-warning">
                    設定を変更してください
                  </div>
                )}
              </div>
            </Card>

            {/* 開始ボタン */}
            <div className="space-y-4">
              <Button
                type="submit"
                size="lg"
                fullWidth
                disabled={
                  availableCards === 0 ||
                  (!config.includeNew && !config.includeReview)
                }
                className="text-lg font-semibold py-4"
              >
                学習を開始する
              </Button>
              <Link to="/">
                <Button variant="ghost" fullWidth>
                  ホームに戻る
                </Button>
              </Link>
            </div>
          </Form>
        </div>
      </main>
    </div>
  )
}
