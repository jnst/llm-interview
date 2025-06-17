import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { Interview, StudyStats, Category, Difficulty } from "~/types/interview";
import { defaultStudyManager } from "~/utils/study";
import { LocalStorageManager } from "~/utils/localStorage";
import Button from "~/components/common/Button";
import Card from "~/components/common/Card";

export const meta: MetaFunction = () => {
  return [
    { title: "学習進捗 - LLM Interview" },
    { name: "description", content: "学習の進捗状況と統計を確認できます" },
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

interface FilterState {
  categories: Category[];
  difficulties: Difficulty[];
  period: "week" | "month" | "all";
}

export default function Progress() {
  const { interviews } = useLoaderData<typeof loader>();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [filteredStats, setFilteredStats] = useState<StudyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    difficulties: [],
    period: "all"
  });

  // 全カテゴリーと難易度のリスト
  const allCategories: Category[] = [
    "基礎概念", "アーキテクチャ", "学習手法", "応用技術", 
    "評価指標", "実装技術", "倫理・社会的影響"
  ];
  const allDifficulties: Difficulty[] = ["初級", "中級", "上級"];

  // 統計を計算
  useEffect(() => {
    const calculateStats = () => {
      try {
        const studyStats = defaultStudyManager.calculateStudyStats(interviews);
        setStats(studyStats);
        setFilteredStats(studyStats);
      } catch (error) {
        console.error("Failed to calculate stats:", error);
        const defaultStats: StudyStats = {
          totalCards: interviews.length,
          studiedToday: 0,
          dueToday: 0,
          newToday: interviews.length,
          streak: 0,
          averageAccuracy: 0,
          totalStudyTime: 0,
          categoryProgress: []
        };
        setStats(defaultStats);
        setFilteredStats(defaultStats);
      } finally {
        setIsLoading(false);
      }
    };

    calculateStats();
  }, [interviews]);

  // フィルター適用
  useEffect(() => {
    if (!stats) return;

    // フィルターに基づいて統計を再計算
    let filteredInterviews = interviews;

    if (filters.categories.length > 0) {
      filteredInterviews = filteredInterviews.filter(i => 
        filters.categories.includes(i.category)
      );
    }

    if (filters.difficulties.length > 0) {
      filteredInterviews = filteredInterviews.filter(i => 
        filters.difficulties.includes(i.difficulty)
      );
    }

    // 期間フィルター（簡易実装）
    const filteredStats = defaultStudyManager.calculateStudyStats(filteredInterviews);
    setFilteredStats(filteredStats);
  }, [stats, filters, interviews]);

  const toggleCategory = (category: Category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    setFilters(prev => ({ ...prev, categories: newCategories }));
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    const newDifficulties = filters.difficulties.includes(difficulty)
      ? filters.difficulties.filter(d => d !== difficulty)
      : [...filters.difficulties, difficulty];
    setFilters(prev => ({ ...prev, difficulties: newDifficulties }));
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      difficulties: [],
      period: "all"
    });
  };

  const getDifficultyEmoji = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "初級": return "★☆☆";
      case "中級": return "★★☆";
      case "上級": return "★★★";
      default: return "★☆☆";
    }
  };

  const getMasteryLevel = (progress: number) => {
    if (progress >= 80) return { text: "習得済み", color: "text-success" };
    if (progress >= 60) return { text: "学習中", color: "text-warning" };
    if (progress >= 20) return { text: "開始済み", color: "text-primary" };
    return { text: "未学習", color: "text-gray-500" };
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
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-text hover:text-primary">
              ←
            </Link>
            <h1 className="text-xl font-bold text-text">進捗レポート</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* フィルター */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">フィルター</h3>
                <Button
                  onClick={clearAllFilters}
                  variant="ghost"
                  size="sm"
                >
                  すべてクリア
                </Button>
              </div>
              
              {/* 期間フィルター */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">期間</label>
                <div className="flex space-x-2">
                  {[
                    { value: "week", label: "週" },
                    { value: "month", label: "月" },
                    { value: "all", label: "全期間" }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilters(prev => ({ ...prev, period: value as any }))}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        filters.period === value
                          ? "bg-primary text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-text hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* カテゴリーフィルター */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">カテゴリー</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        filters.categories.includes(category)
                          ? "bg-primary text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-text hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 難易度フィルター */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">難易度</label>
                <div className="flex space-x-2">
                  {allDifficulties.map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => toggleDifficulty(difficulty)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        filters.difficulties.includes(difficulty)
                          ? "bg-primary text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-text hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {getDifficultyEmoji(difficulty)} {difficulty}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 学習統計 */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">学習統計</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {filteredStats?.totalCards || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">総カード数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {filteredStats?.categoryProgress.reduce((sum, cp) => sum + cp.masteredCards, 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">習得済み</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {filteredStats?.streak || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">連続日数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(filteredStats?.averageAccuracy || 0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">正解率</div>
                </div>
              </div>
            </div>
          </Card>

          {/* 学習進捗の詳細 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">学習状況</h3>
                <div className="space-y-3">
                  {filteredStats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-text">総学習時間</span>
                        <span className="font-semibold text-primary">
                          {Math.round(filteredStats.totalStudyTime)}分
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text">今日の学習</span>
                        <span className="font-semibold text-success">
                          {filteredStats.studiedToday}枚
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text">復習予定</span>
                        <span className="font-semibold text-warning">
                          {filteredStats.dueToday}枚
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text">新規カード</span>
                        <span className="font-semibold text-primary">
                          {filteredStats.newToday}枚
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">週間アクティビティ</h3>
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    アクティビティグラフ
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    実装予定
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* カテゴリー別マスタリー */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">カテゴリー別マスタリー</h3>
              <div className="space-y-4">
                {filteredStats?.categoryProgress.map((progress) => {
                  const masteryPercent = Math.round((progress.masteredCards / progress.totalCards) * 100);
                  const mastery = getMasteryLevel(masteryPercent);
                  
                  return (
                    <div key={progress.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-text font-medium">{progress.category}</span>
                          <span className={`text-sm ${mastery.color}`}>
                            {mastery.text}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {progress.masteredCards}/{progress.totalCards} ({masteryPercent}%)
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${masteryPercent}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        平均正解率: {Math.round(progress.averageAccuracy)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ナビゲーション */}
          <div className="flex space-x-4">
            <Link to="/" className="flex-1">
              <Button variant="ghost" fullWidth>
                ホームに戻る
              </Button>
            </Link>
            <Link to="/interview" className="flex-1">
              <Button variant="primary" fullWidth>
                学習を開始
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}