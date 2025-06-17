import type { Answer } from "~/types/interview"

export interface Hint {
  type: "definition" | "key_points" | "example"
  content: string
}

export interface HintSet {
  interviewId: string
  hints: Hint[]
  selectedKeyPoints: string[]
  selectedExample: string
}

/**
 * ヒント生成とランダム選出を管理するクラス
 */
export class HintManager {
  private hintSets: Map<string, HintSet> = new Map()

  /**
   * 指定された質問のヒントセットを生成
   * @param interviewId 質問ID
   * @param answer 回答データ
   * @returns 生成されたヒントセット
   */
  public generateHints(interviewId: string, answer: Answer): HintSet {
    // 既に生成済みの場合は既存のものを返す（セッション中は固定）
    if (this.hintSets.has(interviewId)) {
      return this.hintSets.get(interviewId)!
    }

    const hints: Hint[] = []
    let selectedKeyPoints: string[] = []
    let selectedExample = ""

    // ヒント1: 定義（固定）
    if (answer.definition && answer.definition.trim()) {
      hints.push({
        type: "definition",
        content: answer.definition.trim(),
      })
    }

    // ヒント2: 要点からランダムに2つ選出
    if (answer.key_points && answer.key_points.length > 0) {
      const availablePoints = answer.key_points.filter(
        (point) => point && point.trim()
      )

      if (availablePoints.length >= 2) {
        // ランダムに2つ選出
        selectedKeyPoints = this.selectRandomItems(availablePoints, 2)
      } else if (availablePoints.length === 1) {
        // 1つしかない場合はそれを使用
        selectedKeyPoints = [availablePoints[0]]
      }

      if (selectedKeyPoints.length > 0) {
        const keyPointsContent = selectedKeyPoints
          .map((point) => `• ${point}`)
          .join("\n")
        hints.push({
          type: "key_points",
          content: keyPointsContent,
        })
      }
    }

    // ヒント3: 具体例からランダムに1つ選出
    if (answer.examples && answer.examples.length > 0) {
      const availableExamples = answer.examples.filter(
        (example) => example && example.trim()
      )

      if (availableExamples.length > 0) {
        selectedExample = this.selectRandomItems(availableExamples, 1)[0]
        hints.push({
          type: "example",
          content: selectedExample,
        })
      }
    }

    const hintSet: HintSet = {
      interviewId,
      hints,
      selectedKeyPoints,
      selectedExample,
    }

    // セッション中は同じヒントを使用するためキャッシュ
    this.hintSets.set(interviewId, hintSet)

    return hintSet
  }

  /**
   * 配列から指定数のアイテムをランダムに選出
   * @param items 選出元の配列
   * @param count 選出数
   * @returns ランダムに選出されたアイテムの配列
   */
  private selectRandomItems<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, items.length))
  }

  /**
   * 指定された質問の特定のヒントを取得
   * @param interviewId 質問ID
   * @param hintIndex ヒントのインデックス（0から開始）
   * @returns ヒント、または存在しない場合はnull
   */
  public getHint(interviewId: string, hintIndex: number): Hint | null {
    const hintSet = this.hintSets.get(interviewId)
    if (!hintSet || hintIndex >= hintSet.hints.length || hintIndex < 0) {
      return null
    }
    return hintSet.hints[hintIndex]
  }

  /**
   * 指定された質問の利用可能なヒント数を取得
   * @param interviewId 質問ID
   * @returns ヒント数
   */
  public getHintCount(interviewId: string): number {
    const hintSet = this.hintSets.get(interviewId)
    return hintSet ? hintSet.hints.length : 0
  }

  /**
   * 指定された質問のすべてのヒントを取得
   * @param interviewId 質問ID
   * @returns ヒントの配列
   */
  public getAllHints(interviewId: string): Hint[] {
    const hintSet = this.hintSets.get(interviewId)
    return hintSet ? [...hintSet.hints] : []
  }

  /**
   * ヒントの種類に基づく表示タイトルを取得
   * @param hintType ヒントの種類
   * @returns 表示用タイトル
   */
  public static getHintTitle(hintType: Hint["type"]): string {
    const titles = {
      definition: "💡 定義・概要",
      key_points: "📝 重要なポイント",
      example: "📋 具体例",
    }
    return titles[hintType]
  }

  /**
   * ヒントキャッシュをクリア（新しいセッション開始時に使用）
   */
  public clearCache(): void {
    this.hintSets.clear()
  }

  /**
   * 特定の質問のヒントキャッシュをクリア
   * @param interviewId 質問ID
   */
  public clearHintForInterview(interviewId: string): void {
    this.hintSets.delete(interviewId)
  }

  /**
   * ヒント使用統計を計算
   * @param hintCount 表示したヒント数
   * @param totalHints 利用可能な総ヒント数
   * @returns ヒント使用率
   */
  public static calculateHintUsageRate(
    hintCount: number,
    totalHints: number
  ): number {
    if (totalHints === 0) return 0
    return Math.round((hintCount / totalHints) * 100)
  }

  /**
   * ヒント使用による品質への影響を計算
   * @param originalQuality 元の品質評価
   * @param hintsUsed 使用したヒント数
   * @returns 調整後の品質評価
   */
  public static adjustQualityForHints(
    originalQuality: number,
    hintsUsed: number
  ): number {
    // ヒント1つにつき-1点（最低0点）
    return Math.max(0, originalQuality - hintsUsed)
  }

  /**
   * ヒント表示の推奨タイミングを判定
   * @param responseTime 現在の経過時間（秒）
   * @param difficulty 質問の難易度
   * @returns ヒント表示を推奨するかどうか
   */
  public static shouldSuggestHint(
    responseTime: number,
    difficulty: "初級" | "中級" | "上級"
  ): boolean {
    const thresholds = {
      初級: 30, // 30秒
      中級: 45, // 45秒
      上級: 60, // 60秒
    }

    return responseTime >= thresholds[difficulty]
  }

  /**
   * セッション統計用のヒント使用情報を生成
   * @param reviewedInterviews 学習済みの質問配列
   * @returns ヒント使用統計
   */
  public generateHintStatistics(
    reviewedInterviews: { interviewId: string; hintsShown: number }[]
  ) {
    if (reviewedInterviews.length === 0) {
      return {
        totalHintsUsed: 0,
        averageHintsPerCard: 0,
        hintsUsageRate: 0,
        cardsWithHints: 0,
      }
    }

    const totalHintsUsed = reviewedInterviews.reduce(
      (sum, review) => sum + review.hintsShown,
      0
    )
    const cardsWithHints = reviewedInterviews.filter(
      (review) => review.hintsShown > 0
    ).length
    const averageHintsPerCard = totalHintsUsed / reviewedInterviews.length
    const hintsUsageRate = (cardsWithHints / reviewedInterviews.length) * 100

    return {
      totalHintsUsed,
      averageHintsPerCard: Math.round(averageHintsPerCard * 10) / 10,
      hintsUsageRate: Math.round(hintsUsageRate),
      cardsWithHints,
    }
  }
}

// デフォルトのHintManagerインスタンス
export const defaultHintManager = new HintManager()

// ヒント生成関数（後方互換性のため）
export function generateHints(answer: Answer): string[] {
  const hintSet = defaultHintManager.generateHints('temp', answer)
  return hintSet.hints.map(hint => hint.content)
}
