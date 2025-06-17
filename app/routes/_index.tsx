import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, Link, useRouteError } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { Interview, StudyStats } from "~/types/interview";
import { defaultStudyManager } from "~/utils/study";
import { LocalStorageManager } from "~/utils/localStorage";
import Button from "~/components/common/Button";
import Card from "~/components/common/Card";

export const meta: MetaFunction = () => {
  return [
    { title: "LLM Interview - AI面接対策学習アプリ" },
    { name: "description", content: "LLM面接対策のためのフラッシュカード学習アプリ" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // 質問データを読み込み
    const interviews: Interview[] = await import("~/data/interview.json").then(
      (module) => module.default || module
    );
    
    return json({ interviews });
  } catch (error) {
    console.error("Failed to load interview data:", error);
    throw new Response("質問データの読み込みに失敗しました", { status: 500 });
  }
}

export default function Index() {
  const { interviews } = useLoaderData<typeof loader>();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // クライアントサイドでのみ統計を計算
  useEffect(() => {
    const calculateStats = () => {
      try {
        const studyStats = defaultStudyManager.calculateStudyStats(interviews);
        setStats(studyStats);
      } catch (error) {
        console.error("Failed to calculate stats:", error);
        // デフォルト統計を設定
        setStats({
          totalCards: interviews.length,
          studiedToday: 0,
          dueToday: 0,
          newToday: interviews.length,
          streak: 0,
          averageAccuracy: 0,
          totalStudyTime: 0,
          categoryProgress: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    // コンポーネントマウント後に計算
    calculateStats();
  }, [interviews]);

  const handleStartStudy = () => {
    // 学習開始 - 新規セッションを開始
    window.location.href = "/interview";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-text">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            <span className="ml-2 text-text">読み込み中...</span>
          </div>
        </div>
      </div>
    );
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
                onClick={() => {
                  const theme = LocalStorageManager.getSettings().theme;
                  const newTheme = theme === "light" ? "dark" : "light";
                  LocalStorageManager.updateSettings({ theme: newTheme });
                  document.documentElement.classList.toggle("dark", newTheme === "dark");
                }}
                className="p-2 text-text hover:bg-surface rounded-lg transition-colors"
                title="テーマを切り替え"
              >
                {LocalStorageManager.getSettings().theme === "light" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* 今日の学習統計 */}
          <Card>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-text">今日の学習</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning">{stats?.dueToday || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">復習</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats?.newToday || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">新規</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-success">{(stats?.dueToday || 0) + (stats?.newToday || 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">合計</div>
                </div>
              </div>
            </div>
          </Card>

          {/* 学習状況 */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text">連続学習:</span>
                <span className="font-semibold text-warning">🔥 {stats?.streak || 0}日</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text">正解率:</span>
                <span className="font-semibold text-success">{Math.round(stats?.averageAccuracy || 0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text">学習時間:</span>
                <span className="font-semibold text-primary">{Math.round(stats?.totalStudyTime || 0)}分</span>
              </div>
            </div>
          </Card>

          {/* 学習開始ボタン */}
          <div className="text-center">
            <Button
              onClick={handleStartStudy}
              size="lg"
              fullWidth
              className="text-lg font-semibold py-4"
            >
              学習を開始する
            </Button>
          </div>

          {/* カテゴリー別進捗 */}
          {stats?.categoryProgress && stats.categoryProgress.length > 0 && (
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">カテゴリー別進捗</h3>
                <div className="space-y-3">
                  {stats.categoryProgress.map((progress) => (
                    <div key={progress.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text">{progress.category}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round((progress.masteredCards / progress.totalCards) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round((progress.masteredCards / progress.totalCards) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ナビゲーション */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/progress">
              <Button variant="ghost" fullWidth className="flex items-center justify-center space-x-2">
                <span>📊</span>
                <span>詳細な進捗</span>
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" fullWidth className="flex items-center justify-center space-x-2">
                <span>⚙️</span>
                <span>設定</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  return (
    <div className="min-h-screen bg-background text-text">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-error">エラーが発生しました</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {error instanceof Error ? error.message : "予期しないエラーが発生しました"}
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
  );
}
