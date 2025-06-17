import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useParams, useNavigate, Form } from "@remix-run/react";
import { useState, useEffect, useCallback } from "react";
import type { Interview, StudySession, ReviewedInterview } from "~/types/interview";
import { defaultStudyManager } from "~/utils/study";
import { LocalStorageManager } from "~/utils/localStorage";
import { generateHints } from "~/utils/hints";
import FlashCard from "~/components/flashcard/FlashCard";
import QualityRating from "~/components/study/QualityRating";
import Timer from "~/components/study/Timer";
import Button from "~/components/common/Button";
import Card from "~/components/common/Card";
import Modal from "~/components/common/Modal";

export async function loader({ params }: LoaderFunctionArgs) {
  const { sessionId } = params;
  
  if (!sessionId) {
    throw new Response("セッションIDが見つかりません", { status: 404 });
  }

  try {
    // 質問データを読み込み
    const interviews: Interview[] = await import("~/data/interview.json").then(
      (module) => module.default || module
    );
    
    return json({ interviews, sessionId });
  } catch (error) {
    console.error("Failed to load interview data:", error);
    throw new Response("質問データの読み込みに失敗しました", { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { sessionId } = params;
  const formData = await request.formData();
  const action = formData.get("_action");

  if (!sessionId) {
    return json({ error: "セッションIDが見つかりません" }, { status: 404 });
  }

  if (action === "submit_answer") {
    const interviewId = formData.get("interviewId") as string;
    const quality = parseInt(formData.get("quality") as string);
    const responseTime = parseInt(formData.get("responseTime") as string);
    const hintsShown = parseInt(formData.get("hintsShown") as string);

    try {
      const reviewedInterview: ReviewedInterview = {
        interviewId,
        isCorrect: quality >= 3, // 品質3以上を正解とする
        reviewedAt: new Date(),
        responseTime,
        quality,
        hintsShown
      };

      const updatedSession = defaultStudyManager.addReviewToSession(sessionId, reviewedInterview);
      
      return json({ success: true, session: updatedSession });
    } catch (error) {
      return json({ error: "回答の記録に失敗しました" }, { status: 400 });
    }
  }

  if (action === "end_session") {
    try {
      const endedSession = defaultStudyManager.endSession(sessionId);
      return json({ success: true, session: endedSession, ended: true });
    } catch (error) {
      return json({ error: "セッションの終了に失敗しました" }, { status: 400 });
    }
  }

  return json({ error: "無効なアクションです" }, { status: 400 });
}

export default function SessionStudy() {
  const { interviews, sessionId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<StudySession | null>(null);
  const [currentInterviews, setCurrentInterviews] = useState<Interview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [hints, setHints] = useState<string[]>([]);

  // セッションの初期化
  useEffect(() => {
    const loadedSession = LocalStorageManager.getSession(sessionId);
    if (loadedSession) {
      setSession(loadedSession);
      setSessionStartTime(new Date(loadedSession.startedAt));
      
      // セッション用のカードを決定 (実際の実装では、セッション開始時に保存される)
      const config = {
        maxCards: 20,
        includeNew: true,
        includeReview: true,
        categories: [],
        difficulties: []
      };
      
      const availableCards = interviews.filter(interview => {
        return defaultStudyManager.getAvailableCardsCount([interview], config) > 0;
      }).slice(0, 20);
      
      setCurrentInterviews(availableCards);
    } else {
      // セッションが見つからない場合はホームに戻る
      navigate("/");
    }
  }, [sessionId, interviews, navigate]);

  // 現在のカードのヒントを生成
  useEffect(() => {
    if (currentInterviews.length > 0 && currentIndex < currentInterviews.length) {
      const currentInterview = currentInterviews[currentIndex];
      const generatedHints = generateHints(currentInterview.answer);
      setHints(generatedHints);
    }
  }, [currentInterviews, currentIndex]);

  // ActionDataの処理
  useEffect(() => {
    if (actionData?.success && actionData.session) {
      setSession(actionData.session);
      if (actionData.ended) {
        // セッション終了時の処理
        navigate("/", { replace: true });
      }
    }
  }, [actionData, navigate]);

  const currentInterview = currentInterviews[currentIndex];
  const isLastCard = currentIndex >= currentInterviews.length - 1;

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleNext = useCallback(() => {
    if (currentIndex < currentInterviews.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
      setCurrentHintIndex(0);
      setCardStartTime(new Date());
      setHintsUsed(0);
    }
  }, [currentIndex, currentInterviews.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
      setCurrentHintIndex(0);
      setCardStartTime(new Date());
      setHintsUsed(0);
    }
  }, [currentIndex]);

  const handleShowHint = useCallback(() => {
    if (!showHint) {
      setShowHint(true);
      setHintsUsed(1);
    } else if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
      setHintsUsed(hintsUsed + 1);
    }
  }, [showHint, currentHintIndex, hints.length, hintsUsed]);

  const handleHideHint = useCallback(() => {
    setShowHint(false);
  }, []);

  const handleQualityRate = useCallback((quality: number) => {
    if (!currentInterview) return;

    const responseTime = Math.floor((new Date().getTime() - cardStartTime.getTime()) / 1000);
    
    // フォームデータを準備
    const formData = new FormData();
    formData.append("_action", "submit_answer");
    formData.append("interviewId", currentInterview.id);
    formData.append("quality", quality.toString());
    formData.append("responseTime", responseTime.toString());
    formData.append("hintsShown", hintsUsed.toString());

    // フォームを送信
    const form = document.createElement("form");
    form.method = "POST";
    form.style.display = "none";
    
    for (const [key, value] of formData.entries()) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value as string;
      form.appendChild(input);
    }
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    // 次のカードに進む
    if (!isLastCard) {
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  }, [currentInterview, cardStartTime, hintsUsed, isLastCard, handleNext]);

  const handleEndSession = () => {
    const formData = new FormData();
    formData.append("_action", "end_session");

    const form = document.createElement("form");
    form.method = "POST";
    form.style.display = "none";
    
    for (const [key, value] of formData.entries()) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value as string;
      form.appendChild(input);
    }
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  if (!session || !currentInterview) {
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
              <button onClick={handleExit} className="text-text hover:text-primary">
                ←
              </button>
              <span className="text-text font-medium">
                {currentIndex + 1}/{currentInterviews.length}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Timer startTime={sessionStartTime} />
              <button onClick={handleExit} className="text-text hover:text-error">
                ×
              </button>
            </div>
          </div>
          {/* 進捗バー */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / currentInterviews.length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {actionData?.error && (
            <Card className="mb-4 border-error">
              <div className="text-error text-center">
                {actionData.error}
              </div>
            </Card>
          )}

          <FlashCard
            interview={currentInterview}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onRate={handleQualityRate}
            showHint={showHint}
            onToggleHint={handleShowHint}
            hints={hints}
            currentHintIndex={currentHintIndex}
            onHideHint={handleHideHint}
            canGoNext={currentIndex < currentInterviews.length - 1}
            canGoPrevious={currentIndex > 0}
            isLastCard={isLastCard}
          />

          {/* セッション終了ボタン */}
          {isLastCard && isFlipped && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleEndSession}
                variant="success"
                size="lg"
                fullWidth
              >
                セッションを終了
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* 離脱確認モーダル */}
      {showExitModal && (
        <Modal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          title="学習を中断しますか？"
        >
          <div className="space-y-4">
            <p className="text-text">
              学習セッションが進行中です。本当に離脱しますか？
              進捗は保存されません。
            </p>
            <div className="flex space-x-4">
              <Button
                onClick={() => navigate("/")}
                variant="error"
                fullWidth
              >
                離脱
              </Button>
              <Button
                onClick={() => setShowExitModal(false)}
                variant="ghost"
                fullWidth
              >
                続ける
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}