import {
  type ActionFunctionArgs,
  type MetaFunction,
  json,
} from "@remix-run/node"
import { Form, Link, useActionData } from "@remix-run/react"
import { useEffect, useState } from "react"
import Button from "~/components/common/Button"
import Card from "~/components/common/Card"
import Modal from "~/components/common/Modal"
import type { UserSettings } from "~/types/interview"
import { LocalStorageManager } from "~/utils/localStorage"

export const meta: MetaFunction = () => {
  return [
    { title: "設定 - LLM Interview" },
    { name: "description", content: "アプリの設定とデータ管理" },
  ]
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const action = formData.get("_action")

  if (action === "update_settings") {
    const theme = formData.get("theme") as "light" | "dark"
    const cardsPerSession = Number.parseInt(
      formData.get("cardsPerSession") as string
    )
    const enableSound = formData.get("enableSound") === "on"
    const showTimer = formData.get("showTimer") === "on"
    const autoFlip = formData.get("autoFlip") === "on"
    const autoFlipDelay = Number.parseInt(
      formData.get("autoFlipDelay") as string
    )
    const keyboardShortcuts = formData.get("keyboardShortcuts") === "on"

    try {
      const settings: UserSettings = {
        theme,
        cardsPerSession,
        enableSound,
        showTimer,
        autoFlip,
        autoFlipDelay,
        keyboardShortcuts,
      }

      return json({ success: true, settings, message: "設定を保存しました" })
    } catch (error) {
      return json({ error: "設定の保存に失敗しました" }, { status: 400 })
    }
  }

  if (action === "export_data") {
    return json({
      success: true,
      export: true,
      message: "データをエクスポートしました",
    })
  }

  if (action === "reset_progress") {
    return json({
      success: true,
      reset: true,
      message: "学習記録をリセットしました",
    })
  }

  if (action === "reset_all") {
    return json({
      success: true,
      resetAll: true,
      message: "すべてのデータをリセットしました",
    })
  }

  return json({ error: "無効なアクションです" }, { status: 400 })
}

export default function Settings() {
  const actionData = useActionData<typeof action>()
  const [settings, setSettings] = useState<UserSettings>({
    theme: "light",
    cardsPerSession: 20,
    enableSound: false,
    showTimer: true,
    autoFlip: false,
    autoFlipDelay: 5,
    keyboardShortcuts: true,
  })

  const [showResetModal, setShowResetModal] = useState(false)
  const [showResetAllModal, setShowResetAllModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 設定の読み込み
  useEffect(() => {
    const currentSettings = LocalStorageManager.getSettings()
    setSettings(currentSettings)
  }, [])

  // ActionDataの処理
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      if ('settings' in actionData && actionData.settings) {
        LocalStorageManager.setSettings(actionData.settings)
        setSettings(actionData.settings)

        // テーマの適用
        document.documentElement.classList.toggle(
          "dark",
          actionData.settings.theme === "dark"
        )
      }

      if ('export' in actionData && actionData.export) {
        LocalStorageManager.exportData()
      }

      if ('reset' in actionData && actionData.reset) {
        LocalStorageManager.clearProgress()
        setShowResetModal(false)
      }

      if ('resetAll' in actionData && actionData.resetAll) {
        LocalStorageManager.clearAllData()
        setShowResetAllModal(false)
        // 設定をデフォルトに戻す
        const defaultSettings = LocalStorageManager.getSettings()
        setSettings(defaultSettings)
      }
    }
  }, [actionData])

  const handleSettingsChange = (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
  }

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setIsLoading(true)

    try {
      const success = await LocalStorageManager.importData(file)
      if (success) {
        // インポート成功時は設定を再読み込み
        const importedSettings = LocalStorageManager.getSettings()
        setSettings(importedSettings)
        document.documentElement.classList.toggle(
          "dark",
          importedSettings.theme === "dark"
        )
        alert("データをインポートしました")
      }
    } catch (error) {
      alert("データのインポートに失敗しました: " + (error as Error).message)
    } finally {
      setIsLoading(false)
      setImportFile(null)
      event.target.value = "" // ファイル選択をリセット
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
            <h1 className="text-xl font-bold text-text">設定</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* メッセージ表示 */}
          {actionData && 'message' in actionData && actionData.message && (
            <Card className="border-success">
              <div className="text-success text-center">
                {actionData.message}
              </div>
            </Card>
          )}

          {actionData && 'error' in actionData && actionData.error && (
            <Card className="border-error">
              <div className="text-error text-center">{actionData.error}</div>
            </Card>
          )}

          <Form method="post">
            <input type="hidden" name="_action" value="update_settings" />

            {/* 外観設定 */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">外観</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      テーマ
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={settings.theme === "light"}
                          onChange={(e) =>
                            handleSettingsChange({
                              theme: e.target.value as "light" | "dark",
                            })
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-text">☀️ Light</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={settings.theme === "dark"}
                          onChange={(e) =>
                            handleSettingsChange({
                              theme: e.target.value as "light" | "dark",
                            })
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-text">🌙 Dark</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 学習設定 */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">学習設定</h3>
                <div className="space-y-4">
                  {/* 1日のカード数 */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      1セッションのカード数
                    </label>
                    <input
                      type="range"
                      name="cardsPerSession"
                      min="5"
                      max="50"
                      step="5"
                      value={settings.cardsPerSession}
                      onChange={(e) =>
                        handleSettingsChange({
                          cardsPerSession: Number.parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <span>5</span>
                      <span className="font-semibold text-primary">
                        {settings.cardsPerSession}枚
                      </span>
                      <span>50</span>
                    </div>
                  </div>

                  {/* 自動フリップ */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="autoFlip"
                        checked={settings.autoFlip}
                        onChange={(e) =>
                          handleSettingsChange({ autoFlip: e.target.checked })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-text">自動フリップ</span>
                    </label>
                    {settings.autoFlip && (
                      <div className="ml-6">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          遅延時間: {settings.autoFlipDelay}秒
                        </label>
                        <input
                          type="range"
                          name="autoFlipDelay"
                          min="3"
                          max="10"
                          value={settings.autoFlipDelay}
                          onChange={(e) =>
                            handleSettingsChange({
                              autoFlipDelay: Number.parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* その他の設定 */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="showTimer"
                        checked={settings.showTimer}
                        onChange={(e) =>
                          handleSettingsChange({ showTimer: e.target.checked })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-text">タイマー表示</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="enableSound"
                        checked={settings.enableSound}
                        onChange={(e) =>
                          handleSettingsChange({
                            enableSound: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-text">効果音</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="keyboardShortcuts"
                        checked={settings.keyboardShortcuts}
                        onChange={(e) =>
                          handleSettingsChange({
                            keyboardShortcuts: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-text">
                        キーボードショートカット
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* 保存ボタン */}
            <Button type="submit" fullWidth variant="primary">
              設定を保存
            </Button>
          </Form>

          {/* データ管理 */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">データ管理</h3>
              <div className="space-y-3">
                {/* エクスポート */}
                <Form method="post" className="inline">
                  <input type="hidden" name="_action" value="export_data" />
                  <Button type="submit" variant="ghost" fullWidth>
                    データをエクスポート
                  </Button>
                </Form>

                {/* インポート */}
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                    id="import-file"
                    disabled={isLoading}
                  />
                  <label htmlFor="import-file" className="block cursor-pointer">
                    <div className="inline-flex items-center justify-center w-full font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text hover:bg-surface focus:ring-gray-500 border border-gray-300 dark:border-gray-600 px-4 py-2 text-base gap-2">
                      {isLoading ? "インポート中..." : "データをインポート"}
                    </div>
                  </label>
                </div>

                {/* 学習記録リセット */}
                <Button
                  onClick={() => setShowResetModal(true)}
                  variant="warning"
                  fullWidth
                >
                  学習記録をリセット
                </Button>

                {/* 全データリセット */}
                <Button
                  onClick={() => setShowResetAllModal(true)}
                  variant="error"
                  fullWidth
                >
                  すべてのデータをリセット
                </Button>
              </div>
            </div>
          </Card>

          {/* キーボードショートカット説明 */}
          {settings.keyboardShortcuts && (
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">
                  キーボードショートカット
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Space
                    </span>
                    <span className="text-text">カード裏返し</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      ←/→
                    </span>
                    <span className="text-text">前後のカード</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">H</span>
                    <span className="text-text">ヒント表示</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      0-5
                    </span>
                    <span className="text-text">難易度評価</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ナビゲーション */}
          <Link to="/">
            <Button variant="ghost" fullWidth>
              ホームに戻る
            </Button>
          </Link>
        </div>
      </main>

      {/* 学習記録リセット確認モーダル */}
      {showResetModal && (
        <Modal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title="学習記録をリセット"
        >
          <div className="space-y-4">
            <p className="text-text">
              学習記録、セッション履歴、統計データがすべて削除されます。
              この操作は取り消せません。
            </p>
            <div className="flex space-x-4">
              <Form method="post" className="flex-1">
                <input type="hidden" name="_action" value="reset_progress" />
                <Button type="submit" variant="warning" fullWidth>
                  リセット実行
                </Button>
              </Form>
              <Button
                onClick={() => setShowResetModal(false)}
                variant="ghost"
                fullWidth
              >
                キャンセル
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 全データリセット確認モーダル */}
      {showResetAllModal && (
        <Modal
          isOpen={showResetAllModal}
          onClose={() => setShowResetAllModal(false)}
          title="すべてのデータをリセット"
        >
          <div className="space-y-4">
            <p className="text-text">
              設定、学習記録、セッション履歴、統計データがすべて削除されます。
              この操作は取り消せません。
            </p>
            <div className="flex space-x-4">
              <Form method="post" className="flex-1">
                <input type="hidden" name="_action" value="reset_all" />
                <Button type="submit" variant="error" fullWidth>
                  すべてリセット
                </Button>
              </Form>
              <Button
                onClick={() => setShowResetAllModal(false)}
                variant="ghost"
                fullWidth
              >
                キャンセル
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
