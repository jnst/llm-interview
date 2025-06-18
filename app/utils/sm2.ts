import type { UserProgress } from "~/types/interview"

export interface SM2Result {
  interval: number
  easeFactor: number
  nextReviewDate: Date
}

export interface SM2Config {
  minEaseFactor: number
  initialIntervals: number[]
  qualityThreshold: number
}

/**
 * SM-2アルゴリズムの実装
 * SuperMemo-2アルゴリズムを使用して間隔反復学習を実現
 */
export class SM2Algorithm {
  private static readonly DEFAULT_CONFIG: SM2Config = {
    minEaseFactor: 1.3,
    initialIntervals: [1, 6], // 1日後、6日後
    qualityThreshold: 3, // 3以上で合格
  }

  private config: SM2Config

  constructor(config?: Partial<SM2Config>) {
    this.config = { ...SM2Algorithm.DEFAULT_CONFIG, ...config }
  }

  /**
   * 品質評価に基づいて難易度係数を計算
   * @param quality 回答品質（0-5）
   * @param previousEaseFactor 前回の難易度係数
   * @returns 新しい難易度係数
   */
  private calculateEaseFactor(
    quality: number,
    previousEaseFactor: number
  ): number {
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const newEaseFactor =
      previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    return Math.max(this.config.minEaseFactor, newEaseFactor)
  }

  /**
   * 復習間隔を計算
   * @param reviewCount 復習回数
   * @param previousInterval 前回の間隔（日数）
   * @param easeFactor 難易度係数
   * @returns 次回の復習間隔（日数）
   */
  private calculateInterval(
    reviewCount: number,
    previousInterval: number,
    easeFactor: number
  ): number {
    if (reviewCount === 1) return this.config.initialIntervals[0]
    if (reviewCount === 2) return this.config.initialIntervals[1]
    return Math.round(previousInterval * easeFactor)
  }

  /**
   * 次回の復習スケジュールを計算
   * @param quality 今回の回答品質（0-5）
   * @param previousInterval 前回の間隔（日数）
   * @param previousEaseFactor 前回の難易度係数
   * @param reviewCount 現在の復習回数
   * @param hintsUsed 使用したヒント数
   * @returns SM2計算結果
   */
  public calculateNext(
    quality: number,
    previousInterval: number,
    previousEaseFactor: number,
    reviewCount: number,
    hintsUsed = 0
  ): SM2Result {
    // ヒント使用による品質調整（-1点/ヒント）
    const adjustedQuality = Math.max(0, quality - hintsUsed)

    // 新しい難易度係数を計算
    const newEaseFactor = this.calculateEaseFactor(
      adjustedQuality,
      previousEaseFactor
    )

    let newInterval: number
    let newReviewCount = reviewCount + 1

    // 品質が閾値未満の場合、間隔をリセット
    if (adjustedQuality < this.config.qualityThreshold) {
      newInterval = 1 // 1日後に再出題
      newReviewCount = 1 // 復習回数もリセット
    } else {
      // 通常の間隔計算
      newInterval = this.calculateInterval(
        newReviewCount,
        previousInterval,
        newEaseFactor
      )
    }

    // 次回復習日を計算
    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)
    nextReviewDate.setHours(0, 0, 0, 0) // 時間をリセット

    return {
      interval: newInterval,
      easeFactor: newEaseFactor,
      nextReviewDate,
    }
  }

  /**
   * 初回学習時の進捗を作成
   * @param interviewId 質問ID
   * @returns 初期のUserProgress
   */
  public createInitialProgress(interviewId: string): UserProgress {
    const now = new Date()
    const nextReviewDate = new Date()
    nextReviewDate.setDate(
      nextReviewDate.getDate() + this.config.initialIntervals[0]
    )
    nextReviewDate.setHours(0, 0, 0, 0)

    return {
      interviewId,
      lastReviewedAt: now,
      reviewCount: 0,
      correctCount: 0,
      intervalDays: this.config.initialIntervals[0],
      easeFactor: 2.5, // 初期値
      nextReviewDate,
      quality: 0,
    }
  }

  /**
   * 学習記録を更新
   * @param progress 現在の進捗
   * @param quality 今回の回答品質
   * @param isCorrect 正解かどうか
   * @param hintsUsed 使用したヒント数
   * @returns 更新された進捗
   */
  public updateProgress(
    progress: UserProgress,
    quality: number,
    isCorrect: boolean,
    hintsUsed = 0
  ): UserProgress {
    const sm2Result = this.calculateNext(
      quality,
      progress.intervalDays,
      progress.easeFactor,
      progress.reviewCount,
      hintsUsed
    )

    return {
      ...progress,
      lastReviewedAt: new Date(),
      reviewCount: progress.reviewCount + 1,
      correctCount: progress.correctCount + (isCorrect ? 1 : 0),
      intervalDays: sm2Result.interval,
      easeFactor: sm2Result.easeFactor,
      nextReviewDate: sm2Result.nextReviewDate,
      quality,
    }
  }

  /**
   * 品質評価の説明を取得
   * @param quality 品質評価（0-5）
   * @returns 品質の説明文
   */
  public static getQualityDescription(quality: number): string {
    const descriptions = {
      0: "完全に忘れた",
      1: "間違えたが、見覚えはある",
      2: "間違えたが、正解に近かった",
      3: "正解したが、思い出すのに時間がかかった",
      4: "正解したが、少し迷った",
      5: "即座に正解した",
    }

    return descriptions[quality as keyof typeof descriptions] || "不明"
  }

  /**
   * 習得度を判定
   * @param progress ユーザー進捗
   * @returns 習得度（初心者、学習中、習得済み）
   */
  public static getMasteryLevel(
    progress: UserProgress
  ): "初心者" | "学習中" | "習得済み" {
    if (progress.reviewCount === 0) return "初心者"
    if (progress.easeFactor >= 2.0 && progress.reviewCount >= 3)
      return "習得済み"
    return "学習中"
  }

  /**
   * 復習予定かどうかを判定
   * @param progress ユーザー進捗
   * @param date 判定日（デフォルトは今日）
   * @returns 復習予定かどうか
   */
  public static isDue(
    progress: UserProgress,
    date: Date = new Date()
  ): boolean {
    const today = new Date(date)
    today.setHours(0, 0, 0, 0)

    const nextReview = new Date(progress.nextReviewDate)
    nextReview.setHours(0, 0, 0, 0)

    return nextReview <= today
  }

  /**
   * 新規カードかどうかを判定
   * @param progress ユーザー進捗
   * @returns 新規カードかどうか
   */
  public static isNew(progress: UserProgress | null | undefined): boolean {
    return !progress || progress.reviewCount === 0
  }
}

// デフォルトのSM2アルゴリズムインスタンス
export const defaultSM2 = new SM2Algorithm()
