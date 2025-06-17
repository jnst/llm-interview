# 機能仕様書

## コア機能

### 1. フラッシュカード表示
- カードの表裏切り替え（フリップアニメーション）
- スワイプ操作（モバイル）/ キーボード操作（PC）
- 質問・回答の表示
- ヒント表示機能（回答前に確認可能）

### 2. 学習管理
- 間隔反復学習（Spaced Repetition）アルゴリズム実装
- SM-2アルゴリズムベースの復習スケジューリング
- 正解/不正解の記録

### 3. データ管理
- ローカルストレージへの学習データ保存
- JSONファイルからの質問データ読み込み

## ヒント機能

### ヒント機能仕様
- **段階的表示**: answerデータから段階的にヒントを表示
- **ヒント内容**: 
  1. ヒント1: `definition`（定義・概要）
  2. ヒント2: `key_points`からランダムに2つ選出（要点）
  3. ヒント3: `examples`からランダムに1つ選出（具体例）
- **ランダム選出**: セッション開始時に各質問のヒント内容を決定
- **記録保持**: 使用したヒント数を学習記録に保存
- **評価影響**: ヒント使用時は回答品質の自動調整（-1点/ヒント）

### ヒント生成ロジック
```typescript
// ヒント生成の実装例
const generateHints = (answer: Answer) => {
  const hints = [];
  
  // ヒント1: 定義（固定）
  hints.push({
    type: 'definition',
    content: answer.definition
  });
  
  // ヒント2: 要点からランダムに2つ選出
  if (answer.key_points.length >= 2) {
    const shuffled = [...answer.key_points].sort(() => Math.random() - 0.5);
    hints.push({
      type: 'key_points',
      content: '• ' + shuffled.slice(0, 2).join('\n• ')
    });
  }
  
  // ヒント3: 具体例からランダムに1つ選出
  if (answer.examples.length > 0) {
    const randomExample = answer.examples[Math.floor(Math.random() * answer.examples.length)];
    hints.push({
      type: 'example',
      content: randomExample
    });
  }
  
  return hints;
};
```

## SM-2アルゴリズム詳細

### SM-2アルゴリズム実装詳細
```typescript
interface SM2Algorithm {
  /**
   * 次回の復習間隔を計算
   * @param quality - 回答品質（0-5）
   * @param previousInterval - 前回の間隔（日数）
   * @param previousEaseFactor - 前回の難易度係数
   * @param reviewCount - 復習回数
   */
  calculateNextInterval(
    quality: number,
    previousInterval: number,
    previousEaseFactor: number,
    reviewCount: number
  ): {
    interval: number;
    easeFactor: number;
  };
}

// SM-2アルゴリズムの実装
const SM2_ALGORITHM = {
  // 最小難易度係数
  MIN_EASE_FACTOR: 1.3,
  
  // 初期間隔
  INITIAL_INTERVALS: [1, 6], // 1日後、6日後
  
  // 品質評価基準
  QUALITY_THRESHOLD: 3, // 3以上で合格
  
  // 計算式
  calculateEaseFactor(quality: number, previousEF: number): number {
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const newEF = previousEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(this.MIN_EASE_FACTOR, newEF);
  },
  
  calculateInterval(reviewCount: number, previousInterval: number, easeFactor: number): number {
    if (reviewCount === 1) return this.INITIAL_INTERVALS[0];
    if (reviewCount === 2) return this.INITIAL_INTERVALS[1];
    return Math.round(previousInterval * easeFactor);
  }
};
```

### 品質評価基準
- **0**: 完全に忘れた
- **1**: 間違えたが、見覚えはある
- **2**: 間違えたが、正解に近かった
- **3**: 正解したが、思い出すのに時間がかかった
- **4**: 正解したが、少し迷った
- **5**: 即座に正解した

### 学習アルゴリズムの流れ
1. **初回学習**: intervalDays = 1, easeFactor = 2.5
2. **2回目**: intervalDays = 6（固定）
3. **3回目以降**: intervalDays = 前回間隔 × easeFactor
4. **品質3未満**: 間隔をリセット（1日後に再出題）

## 学習セッション管理

### セッション開始
```typescript
interface SessionStartConfig {
  maxCards: number;              // 最大カード数
  includeNew: boolean;           // 新規カードを含むか
  includeReview: boolean;        // 復習カードを含むか
  categories: Category[];        // 対象カテゴリー
  difficulties: Difficulty[];    // 対象難易度
}

const startStudySession = (config: SessionStartConfig): StudySession => {
  // 1. 復習対象カードを選択（nextReviewDate <= today）
  const reviewCards = getReviewCards(config.categories, config.difficulties);
  
  // 2. 新規カードを選択（reviewCount === 0）
  const newCards = getNewCards(config.categories, config.difficulties);
  
  // 3. 優先度順にカードを選択
  const selectedCards = [
    ...reviewCards.slice(0, Math.floor(config.maxCards * 0.7)), // 復習70%
    ...newCards.slice(0, Math.floor(config.maxCards * 0.3))     // 新規30%
  ].slice(0, config.maxCards);
  
  // 4. カードをシャッフル
  const shuffledCards = shuffleArray(selectedCards);
  
  return createSession(shuffledCards);
};
```

### セッション統計計算
```typescript
const calculateSessionStats = (session: StudySession): SessionStats => {
  const { reviewedInterviews } = session;
  
  return {
    totalTime: session.endedAt ? 
      (session.endedAt.getTime() - session.startedAt.getTime()) / 1000 : 0,
    totalCards: reviewedInterviews.length,
    correctCount: reviewedInterviews.filter(r => r.isCorrect).length,
    averageResponseTime: reviewedInterviews.reduce((sum, r) => sum + r.responseTime, 0) / reviewedInterviews.length,
    hintsUsed: reviewedInterviews.reduce((sum, r) => sum + r.hintsShown, 0),
    qualityDistribution: calculateQualityDistribution(reviewedInterviews)
  };
};
```

## 進捗追跡機能

### 学習統計の計算
```typescript
const calculateStudyStats = (
  interviews: Interview[],
  progress: Record<string, UserProgress>,
  sessions: StudySession[]
): StudyStats => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 今日学習したカード
  const todaySessions = sessions.filter(s => 
    s.startedAt >= today && s.endedAt
  );
  
  const studiedToday = new Set(
    todaySessions.flatMap(s => s.reviewedInterviews.map(r => r.interviewId))
  ).size;
  
  // 復習予定カード
  const dueToday = Object.values(progress).filter(p => 
    p.nextReviewDate <= today
  ).length;
  
  // 新規カード
  const newToday = interviews.filter(i => !progress[i.id]).length;
  
  // 連続学習日数の計算
  const streak = calculateStreak(sessions);
  
  // 平均正解率
  const allResponses = sessions.flatMap(s => s.reviewedInterviews);
  const averageAccuracy = allResponses.length > 0 ?
    (allResponses.filter(r => r.isCorrect).length / allResponses.length) * 100 : 0;
  
  // 総学習時間（分）
  const totalStudyTime = sessions
    .filter(s => s.endedAt)
    .reduce((sum, s) => sum + (s.endedAt!.getTime() - s.startedAt.getTime()), 0) / (1000 * 60);
  
  return {
    totalCards: interviews.length,
    studiedToday,
    dueToday,
    newToday,
    streak,
    averageAccuracy,
    totalStudyTime,
    categoryProgress: calculateCategoryProgress(interviews, progress)
  };
};
```

### 連続学習日数の計算
```typescript
const calculateStreak = (sessions: StudySession[]): number => {
  if (sessions.length === 0) return 0;
  
  // セッションを日付でグループ化
  const sessionsByDate = sessions
    .filter(s => s.endedAt)
    .reduce((acc, session) => {
      const date = new Date(session.startedAt);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(session);
      
      return acc;
    }, {} as Record<string, StudySession[]>);
  
  // 日付を降順でソート
  const sortedDates = Object.keys(sessionsByDate).sort().reverse();
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const dateKey of sortedDates) {
    const date = new Date(dateKey);
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};
```

## データ管理機能

### データエクスポート
```typescript
const exportUserData = () => {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: localStorage.getItem(STORAGE_KEYS.SETTINGS),
    progress: localStorage.getItem(STORAGE_KEYS.PROGRESS),
    sessions: localStorage.getItem(STORAGE_KEYS.SESSIONS),
    stats: localStorage.getItem(STORAGE_KEYS.STATS)
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `llm-interview-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
};
```

### データインポート
```typescript
const importUserData = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // バージョンチェック
        if (data.version !== '1.0') {
          throw new Error('Unsupported data version');
        }
        
        // データの復元
        if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, data.settings);
        if (data.progress) localStorage.setItem(STORAGE_KEYS.PROGRESS, data.progress);
        if (data.sessions) localStorage.setItem(STORAGE_KEYS.SESSIONS, data.sessions);
        if (data.stats) localStorage.setItem(STORAGE_KEYS.STATS, data.stats);
        
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
};
```