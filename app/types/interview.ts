// Interview (質問データ)
export interface Interview {
  id: string;                    // 一意識別子 (例: "llm_interview_001")
  question: string;              // 質問文
  answer: Answer;                // 詳細な回答情報
  category: Category;            // カテゴリー
  difficulty: Difficulty;        // 難易度
  tags: string[];                // タグリスト
  source: string;                // 出典情報
}

export interface Answer {
  definition: string;            // 定義・概要
  importance: string;            // 重要性・理由
  mechanism: string;             // 仕組み・動作原理
  key_points: string[];          // 要点リスト（最低1つ必須）
  examples: string[];            // 具体例リスト
  applications: string;          // 応用例・使用場面
  advantages: string;            // 利点・メリット
  limitations: string;           // 制限・課題
  formulas: string[];            // 数式やアルゴリズム
  related_concepts: string;      // 関連概念
  additional_notes: string;      // 補足説明
}

export type Category = 
  | "基礎概念"
  | "アーキテクチャ"
  | "学習手法"
  | "応用技術"
  | "評価指標"
  | "実装技術"
  | "倫理・社会的影響";

export type Difficulty = "初級" | "中級" | "上級";

// UserProgress (ユーザー学習進捗)
export interface UserProgress {
  interviewId: string;           // 質問ID
  lastReviewedAt: Date;          // 最終学習日時
  reviewCount: number;           // 学習回数
  correctCount: number;          // 正解回数
  intervalDays: number;          // 次回学習までの間隔（日数）
  easeFactor: number;            // 難易度係数（SM-2アルゴリズム: 1.3〜2.5）
  nextReviewDate: Date;          // 次回学習予定日
  quality: number;               // 前回の回答品質（0-5）
}

// StudySession (学習セッション)
export interface StudySession {
  id: string;                    // セッションID (UUID)
  startedAt: Date;               // 開始時刻
  endedAt?: Date;                // 終了時刻
  reviewedInterviews: ReviewedInterview[]; // 学習した質問
  correctAnswers: number;        // 正解数
  totalAnswers: number;          // 回答総数
  averageResponseTime: number;   // 平均回答時間（秒）
}

export interface ReviewedInterview {
  interviewId: string;           // 質問ID
  isCorrect: boolean;            // 正解/不正解
  reviewedAt: Date;              // 回答時刻
  responseTime: number;          // 回答時間（秒）
  quality: number;               // 回答品質（0-5）
  hintsShown: number;            // 表示したヒントの数（0=ヒント未使用）
}

// UserSettings (ユーザー設定)
export interface UserSettings {
  theme: "light" | "dark";       // テーマ設定
  cardsPerSession: number;       // 1セッションあたりのカード数（デフォルト: 20）
  enableSound: boolean;          // 効果音の有効/無効
  showTimer: boolean;            // タイマー表示の有効/無効
  autoFlip: boolean;             // 自動裏返し機能
  autoFlipDelay: number;         // 自動裏返しまでの遅延（秒）
  keyboardShortcuts: boolean;    // キーボードショートカットの有効/無効
}

// StudyStats (学習統計)
export interface StudyStats {
  totalCards: number;            // 総カード数
  studiedToday: number;          // 今日学習したカード数
  dueToday: number;              // 今日復習予定のカード数
  newToday: number;              // 今日の新規カード数
  streak: number;                // 連続学習日数
  averageAccuracy: number;       // 平均正解率（%）
  totalStudyTime: number;        // 総学習時間（分）
  categoryProgress: CategoryProgress[]; // カテゴリー別進捗
}

export interface CategoryProgress {
  category: Category;            // カテゴリー
  totalCards: number;            // 総カード数
  masteredCards: number;         // 習得済みカード数（easeFactor > 2.0）
  averageAccuracy: number;       // 平均正解率（%）
}