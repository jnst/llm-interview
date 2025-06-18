import type {
  StudySession,
  StudyStats,
  UserProgress,
  UserSettings,
} from "~/types/interview"

// ローカルストレージのキー定義
export const STORAGE_KEYS = {
  SETTINGS: "llm-interview-settings",
  PROGRESS: "llm-interview-progress",
  SESSIONS: "llm-interview-sessions",
  STATS: "llm-interview-stats",
} as const

// デフォルト設定
export const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  cardsPerSession: 20,
  enableSound: false,
  showTimer: true,
  autoFlip: false,
  autoFlipDelay: 5,
  keyboardShortcuts: true,
}

// 型安全なlocalStorage操作クラス
export class LocalStorageManager {
  private static parseJson<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue

    try {
      const parsed = JSON.parse(value)

      // Dateオブジェクトの復元
      if (typeof parsed === "object" && parsed !== null) {
        return LocalStorageManager.reviveDates(parsed)
      }

      return parsed
    } catch (error) {
      console.warn("Failed to parse localStorage value:", error)
      return defaultValue
    }
  }

  private static reviveDates<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") return obj

    if (Array.isArray(obj)) {
      return obj.map((item) => LocalStorageManager.reviveDates(item)) as T
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Date文字列の検出と変換
      if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
      ) {
        result[key] = new Date(value)
      } else if (typeof value === "object" && value !== null) {
        result[key] = LocalStorageManager.reviveDates(value)
      } else {
        result[key] = value
      }
    }

    return result as T
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
    }
  }

  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const value = localStorage.getItem(key)
      return LocalStorageManager.parseJson(value, defaultValue)
    } catch (error) {
      console.error("Failed to read from localStorage:", error)
      return defaultValue
    }
  }

  // ユーザー設定の管理
  static getSettings(): UserSettings {
    return LocalStorageManager.getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  }

  static setSettings(settings: UserSettings): void {
    LocalStorageManager.setItem(STORAGE_KEYS.SETTINGS, settings)
  }

  static updateSettings(updates: Partial<UserSettings>): UserSettings {
    const current = LocalStorageManager.getSettings()
    const updated = { ...current, ...updates }
    LocalStorageManager.setSettings(updated)
    return updated
  }

  // 学習進捗の管理
  static getProgress(): Record<string, UserProgress> {
    return LocalStorageManager.getItem(STORAGE_KEYS.PROGRESS, {})
  }

  static setProgress(progress: Record<string, UserProgress>): void {
    LocalStorageManager.setItem(STORAGE_KEYS.PROGRESS, progress)
  }

  static updateProgress(
    interviewId: string,
    update: Partial<UserProgress>
  ): UserProgress {
    const allProgress = LocalStorageManager.getProgress()
    const current = allProgress[interviewId]

    const updated: UserProgress = {
      ...current,
      interviewId,
      lastReviewedAt: current?.lastReviewedAt || new Date(),
      reviewCount: current?.reviewCount || 0,
      correctCount: current?.correctCount || 0,
      intervalDays: current?.intervalDays || 1,
      easeFactor: current?.easeFactor || 2.5,
      nextReviewDate: current?.nextReviewDate || new Date(),
      quality: current?.quality || 0,
      ...update,
    }

    allProgress[interviewId] = updated
    LocalStorageManager.setProgress(allProgress)
    return updated
  }

  static getProgressForInterview(interviewId: string): UserProgress | null {
    const allProgress = LocalStorageManager.getProgress()
    return allProgress[interviewId] || null
  }

  // 学習セッションの管理
  static getSessions(): StudySession[] {
    return LocalStorageManager.getItem(STORAGE_KEYS.SESSIONS, [])
  }

  static setSessions(sessions: StudySession[]): void {
    LocalStorageManager.setItem(STORAGE_KEYS.SESSIONS, sessions)
  }

  static addSession(session: StudySession): void {
    const sessions = LocalStorageManager.getSessions()
    sessions.push(session)
    LocalStorageManager.setSessions(sessions)
  }

  static updateSession(
    sessionId: string,
    updates: Partial<StudySession>
  ): StudySession | null {
    const sessions = LocalStorageManager.getSessions()
    const index = sessions.findIndex((s) => s.id === sessionId)

    if (index === -1) return null

    sessions[index] = { ...sessions[index], ...updates }
    LocalStorageManager.setSessions(sessions)
    return sessions[index]
  }

  static getSession(sessionId: string): StudySession | null {
    const sessions = LocalStorageManager.getSessions()
    return sessions.find((s) => s.id === sessionId) || null
  }

  // 学習統計の管理
  static getStats(): StudyStats | null {
    const defaultStats: StudyStats = {
      totalCards: 0,
      studiedToday: 0,
      dueToday: 0,
      newToday: 0,
      streak: 0,
      averageAccuracy: 0,
      totalStudyTime: 0,
      categoryProgress: [],
    }

    return LocalStorageManager.getItem(STORAGE_KEYS.STATS, defaultStats)
  }

  static setStats(stats: StudyStats): void {
    LocalStorageManager.setItem(STORAGE_KEYS.STATS, stats)
  }

  // データ管理
  static exportData() {
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      settings: localStorage.getItem(STORAGE_KEYS.SETTINGS),
      progress: localStorage.getItem(STORAGE_KEYS.PROGRESS),
      sessions: localStorage.getItem(STORAGE_KEYS.SESSIONS),
      stats: localStorage.getItem(STORAGE_KEYS.STATS),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `llm-interview-backup-${new Date().toISOString().split("T")[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  static async importData(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)

          // バージョンチェック
          if (data.version !== "1.0") {
            throw new Error("Unsupported data version")
          }

          // データの復元
          if (data.settings)
            localStorage.setItem(STORAGE_KEYS.SETTINGS, data.settings)
          if (data.progress)
            localStorage.setItem(STORAGE_KEYS.PROGRESS, data.progress)
          if (data.sessions)
            localStorage.setItem(STORAGE_KEYS.SESSIONS, data.sessions)
          if (data.stats) localStorage.setItem(STORAGE_KEYS.STATS, data.stats)

          resolve(true)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error("File reading failed"))
      reader.readAsText(file)
    })
  }

  static clearAllData(): void {
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key)
    }
  }

  static clearProgress(): void {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS)
    localStorage.removeItem(STORAGE_KEYS.SESSIONS)
    localStorage.removeItem(STORAGE_KEYS.STATS)
  }
}
