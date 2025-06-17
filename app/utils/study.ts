import type {
  Category,
  CategoryProgress,
  Difficulty,
  Interview,
  ReviewedInterview,
  StudySession,
  StudyStats,
  UserProgress,
} from "~/types/interview"
import { LocalStorageManager } from "./localStorage"
import { SM2Algorithm, defaultSM2 } from "./sm2"

export interface SessionStartConfig {
  maxCards: number // 最大カード数
  includeNew: boolean // 新規カードを含むか
  includeReview: boolean // 復習カードを含むか
  categories: Category[] // 対象カテゴリー
  difficulties: Difficulty[] // 対象難易度
}

export interface SessionStats {
  totalTime: number // 総時間（秒）
  totalCards: number // 総カード数
  correctCount: number // 正解数
  averageResponseTime: number // 平均回答時間（秒）
  hintsUsed: number // 使用ヒント数
  qualityDistribution: Record<number, number> // 品質分布
}

/**
 * 学習セッション管理と統計計算のユーティリティクラス
 */
export class StudyManager {
  private sm2: SM2Algorithm

  constructor(sm2Algorithm?: SM2Algorithm) {
    this.sm2 = sm2Algorithm || defaultSM2
  }

  /**
   * 学習セッションを開始
   * @param interviews 全質問データ
   * @param config セッション設定
   * @returns 新しい学習セッション
   */
  public startStudySession(
    interviews: Interview[],
    config: SessionStartConfig
  ): StudySession {
    const progress = LocalStorageManager.getProgress()

    // 1. 復習対象カードを選択（nextReviewDate <= today）
    const reviewCards = this.getReviewCards(
      interviews,
      progress,
      config.categories,
      config.difficulties
    )

    // 2. 新規カードを選択（reviewCount === 0）
    const newCards = this.getNewCards(
      interviews,
      progress,
      config.categories,
      config.difficulties
    )

    // 3. 優先度順にカードを選択
    const selectedCards: Interview[] = []

    if (config.includeReview && reviewCards.length > 0) {
      const reviewLimit = Math.floor(config.maxCards * 0.7) // 復習70%
      selectedCards.push(...reviewCards.slice(0, reviewLimit))
    }

    if (config.includeNew && newCards.length > 0) {
      const remainingSlots = config.maxCards - selectedCards.length
      const newLimit = Math.min(
        remainingSlots,
        Math.floor(config.maxCards * 0.3)
      ) // 新規30%
      selectedCards.push(...newCards.slice(0, newLimit))
    }

    // 4. 足りない場合は制限を緩めて追加
    if (selectedCards.length < config.maxCards) {
      const remainingSlots = config.maxCards - selectedCards.length
      const additionalCards = [...reviewCards, ...newCards]
        .filter(
          (card) => !selectedCards.some((selected) => selected.id === card.id)
        )
        .slice(0, remainingSlots)
      selectedCards.push(...additionalCards)
    }

    // 5. カードをシャッフル
    const shuffledCards = this.shuffleArray(selectedCards)

    // 6. セッションを作成
    const session: StudySession = {
      id: this.generateSessionId(),
      startedAt: new Date(),
      reviewedInterviews: [],
      correctAnswers: 0,
      totalAnswers: 0,
      averageResponseTime: 0,
    }

    // セッションを保存
    LocalStorageManager.addSession(session)

    return session
  }

  /**
   * 復習対象カードを取得
   */
  private getReviewCards(
    interviews: Interview[],
    progress: Record<string, UserProgress>,
    categories: Category[],
    difficulties: Difficulty[]
  ): Interview[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return interviews
      .filter((interview) => {
        // カテゴリーと難易度のフィルター
        if (categories.length > 0 && !categories.includes(interview.category))
          return false
        if (
          difficulties.length > 0 &&
          !difficulties.includes(interview.difficulty)
        )
          return false

        // 進捗があり、復習予定日が今日以前
        const userProgress = progress[interview.id]
        if (!userProgress) return false

        return SM2Algorithm.isDue(userProgress, today)
      })
      .sort((a, b) => {
        // 復習予定日の古い順にソート
        const progressA = progress[a.id]
        const progressB = progress[b.id]
        return (
          progressA.nextReviewDate.getTime() -
          progressB.nextReviewDate.getTime()
        )
      })
  }

  /**
   * 新規カードを取得
   */
  private getNewCards(
    interviews: Interview[],
    progress: Record<string, UserProgress>,
    categories: Category[],
    difficulties: Difficulty[]
  ): Interview[] {
    return interviews
      .filter((interview) => {
        // カテゴリーと難易度のフィルター
        if (categories.length > 0 && !categories.includes(interview.category))
          return false
        if (
          difficulties.length > 0 &&
          !difficulties.includes(interview.difficulty)
        )
          return false

        // 新規カード（進捗なし または reviewCount === 0）
        const userProgress = progress[interview.id]
        return SM2Algorithm.isNew(userProgress)
      })
      .sort(() => Math.random() - 0.5) // ランダムソート
  }

  /**
   * セッションに回答を追加
   * @param sessionId セッションID
   * @param reviewedInterview 回答記録
   */
  public addReviewToSession(
    sessionId: string,
    reviewedInterview: ReviewedInterview
  ): StudySession | null {
    const session = LocalStorageManager.getSession(sessionId)
    if (!session) return null

    const updatedReviews = [...session.reviewedInterviews, reviewedInterview]
    const correctAnswers = updatedReviews.filter((r) => r.isCorrect).length
    const totalAnswers = updatedReviews.length
    const averageResponseTime =
      updatedReviews.reduce((sum, r) => sum + r.responseTime, 0) / totalAnswers

    const updatedSession = {
      ...session,
      reviewedInterviews: updatedReviews,
      correctAnswers,
      totalAnswers,
      averageResponseTime,
    }

    LocalStorageManager.updateSession(sessionId, updatedSession)

    // 進捗も更新
    this.updateProgressForReview(reviewedInterview)

    return updatedSession
  }

  /**
   * 学習記録に基づいて進捗を更新
   */
  private updateProgressForReview(review: ReviewedInterview): void {
    const currentProgress = LocalStorageManager.getProgressForInterview(
      review.interviewId
    )

    if (!currentProgress) {
      // 新規の場合は初期進捗を作成
      const initialProgress = this.sm2.createInitialProgress(review.interviewId)
      const updatedProgress = this.sm2.updateProgress(
        initialProgress,
        review.quality,
        review.isCorrect,
        review.hintsShown
      )
      LocalStorageManager.updateProgress(review.interviewId, updatedProgress)
    } else {
      // 既存の進捗を更新
      const updatedProgress = this.sm2.updateProgress(
        currentProgress,
        review.quality,
        review.isCorrect,
        review.hintsShown
      )
      LocalStorageManager.updateProgress(review.interviewId, updatedProgress)
    }
  }

  /**
   * セッションを終了
   * @param sessionId セッションID
   */
  public endSession(sessionId: string): StudySession | null {
    const session = LocalStorageManager.getSession(sessionId)
    if (!session || session.endedAt) return session

    const endedSession = {
      ...session,
      endedAt: new Date(),
    }

    LocalStorageManager.updateSession(sessionId, endedSession)

    // 統計を更新
    this.updateStats()

    return endedSession
  }

  /**
   * セッション統計を計算
   * @param session 学習セッション
   * @returns セッション統計
   */
  public calculateSessionStats(session: StudySession): SessionStats {
    const { reviewedInterviews } = session

    const totalTime = session.endedAt
      ? (session.endedAt.getTime() - session.startedAt.getTime()) / 1000
      : 0

    const qualityDistribution = reviewedInterviews.reduce(
      (acc, review) => {
        acc[review.quality] = (acc[review.quality] || 0) + 1
        return acc
      },
      {} as Record<number, number>
    )

    return {
      totalTime,
      totalCards: reviewedInterviews.length,
      correctCount: reviewedInterviews.filter((r) => r.isCorrect).length,
      averageResponseTime:
        reviewedInterviews.length > 0
          ? reviewedInterviews.reduce((sum, r) => sum + r.responseTime, 0) /
            reviewedInterviews.length
          : 0,
      hintsUsed: reviewedInterviews.reduce((sum, r) => sum + r.hintsShown, 0),
      qualityDistribution,
    }
  }

  /**
   * 学習統計を計算
   * @param interviews 全質問データ
   * @returns 学習統計
   */
  public calculateStudyStats(interviews: Interview[]): StudyStats {
    const progress = LocalStorageManager.getProgress()
    const sessions = LocalStorageManager.getSessions()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 今日学習したカード
    const todaySessions = sessions.filter((s) => {
      const sessionDate = new Date(s.startedAt)
      sessionDate.setHours(0, 0, 0, 0)
      return sessionDate.getTime() === today.getTime() && s.endedAt
    })

    const studiedToday = new Set(
      todaySessions.flatMap((s) =>
        s.reviewedInterviews.map((r) => r.interviewId)
      )
    ).size

    // 復習予定カード
    const dueToday = Object.values(progress).filter((p) =>
      SM2Algorithm.isDue(p, today)
    ).length

    // 新規カード
    const newToday = interviews.filter((i) =>
      SM2Algorithm.isNew(progress[i.id])
    ).length

    // 連続学習日数
    const streak = this.calculateStreak(sessions)

    // 平均正解率
    const allResponses = sessions.flatMap((s) => s.reviewedInterviews)
    const averageAccuracy =
      allResponses.length > 0
        ? (allResponses.filter((r) => r.isCorrect).length /
            allResponses.length) *
          100
        : 0

    // 総学習時間（分）
    const totalStudyTime =
      sessions
        .filter((s) => s.endedAt)
        .reduce(
          (sum, s) => sum + (s.endedAt!.getTime() - s.startedAt.getTime()),
          0
        ) /
      (1000 * 60)

    // カテゴリー別進捗
    const categoryProgress = this.calculateCategoryProgress(
      interviews,
      progress
    )

    return {
      totalCards: interviews.length,
      studiedToday,
      dueToday,
      newToday,
      streak,
      averageAccuracy,
      totalStudyTime,
      categoryProgress,
    }
  }

  /**
   * 連続学習日数を計算
   */
  private calculateStreak(sessions: StudySession[]): number {
    if (sessions.length === 0) return 0

    // セッションを日付でグループ化
    const sessionsByDate = sessions
      .filter((s) => s.endedAt)
      .reduce(
        (acc, session) => {
          const date = new Date(session.startedAt)
          date.setHours(0, 0, 0, 0)
          const dateKey = date.toISOString().split("T")[0]

          if (!acc[dateKey]) acc[dateKey] = []
          acc[dateKey].push(session)

          return acc
        },
        {} as Record<string, StudySession[]>
      )

    // 日付を降順でソート
    const sortedDates = Object.keys(sessionsByDate).sort().reverse()

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const dateKey of sortedDates) {
      const date = new Date(dateKey)
      const daysDiff = Math.floor(
        (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === streak) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  /**
   * カテゴリー別進捗を計算
   */
  private calculateCategoryProgress(
    interviews: Interview[],
    progress: Record<string, UserProgress>
  ): CategoryProgress[] {
    const categories: Category[] = [
      "基礎概念",
      "アーキテクチャ",
      "学習手法",
      "応用技術",
      "評価指標",
      "実装技術",
      "倫理・社会的影響",
    ]

    return categories
      .map((category) => {
        const categoryInterviews = interviews.filter(
          (i) => i.category === category
        )
        const categoryProgressData = categoryInterviews
          .map((i) => progress[i.id])
          .filter(Boolean)

        const masteredCards = categoryProgressData.filter(
          (p) => SM2Algorithm.getMasteryLevel(p) === "習得済み"
        ).length

        const reviewedCards = categoryProgressData.filter(
          (p) => p.reviewCount > 0
        )
        const averageAccuracy =
          reviewedCards.length > 0
            ? (reviewedCards.reduce(
                (sum, p) => sum + p.correctCount / p.reviewCount,
                0
              ) /
                reviewedCards.length) *
              100
            : 0

        return {
          category,
          totalCards: categoryInterviews.length,
          masteredCards,
          averageAccuracy,
        }
      })
      .filter((cp) => cp.totalCards > 0) // カードが存在するカテゴリーのみ
  }

  /**
   * 統計を更新してLocalStorageに保存
   */
  private updateStats(): void {
    // この実装では動的に計算するため、実際の保存は不要
    // 必要に応じてキャッシュのために保存することも可能
  }

  /**
   * 配列をシャッフル
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * セッションIDを生成
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * 復習予定のカード数を取得
   * @param interviews 全質問データ
   * @param date 対象日（デフォルトは今日）
   * @returns 復習予定カード数
   */
  public getDueCardsCount(
    interviews: Interview[],
    date: Date = new Date()
  ): number {
    const progress = LocalStorageManager.getProgress()
    return interviews.filter((interview) => {
      const userProgress = progress[interview.id]
      return userProgress && SM2Algorithm.isDue(userProgress, date)
    }).length
  }

  /**
   * 新規カード数を取得
   * @param interviews 全質問データ
   * @returns 新規カード数
   */
  public getNewCardsCount(interviews: Interview[]): number {
    const progress = LocalStorageManager.getProgress()
    return interviews.filter((interview) =>
      SM2Algorithm.isNew(progress[interview.id])
    ).length
  }

  /**
   * 学習準備完了のカード数を取得
   * @param interviews 全質問データ
   * @param config セッション設定
   * @returns 学習可能なカード数
   */
  public getAvailableCardsCount(
    interviews: Interview[],
    config: Partial<SessionStartConfig>
  ): number {
    const progress = LocalStorageManager.getProgress()
    const today = new Date()

    return interviews.filter((interview) => {
      // カテゴリーフィルター
      if (
        config.categories &&
        config.categories.length > 0 &&
        !config.categories.includes(interview.category)
      ) {
        return false
      }

      // 難易度フィルター
      if (
        config.difficulties &&
        config.difficulties.length > 0 &&
        !config.difficulties.includes(interview.difficulty)
      ) {
        return false
      }

      const userProgress = progress[interview.id]

      // 新規カードを含む場合
      if (config.includeNew && SM2Algorithm.isNew(userProgress)) {
        return true
      }

      // 復習カードを含む場合
      if (
        config.includeReview &&
        userProgress &&
        SM2Algorithm.isDue(userProgress, today)
      ) {
        return true
      }

      return false
    }).length
  }
}

// デフォルトのStudyManagerインスタンス
export const defaultStudyManager = new StudyManager()
