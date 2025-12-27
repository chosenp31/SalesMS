"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface UseUnsavedChangesWarningOptions {
  isDirty: boolean;
  message?: string;
}

/**
 * フォームに未保存の変更がある場合にブラウザの警告を表示するフック
 * @param options.isDirty フォームに未保存の変更があるかどうか
 * @param options.message カスタム警告メッセージ（オプション）
 */
export function useUnsavedChangesWarning({
  isDirty,
  message = "保存されていない変更があります。ページを離れますか？",
}: UseUnsavedChangesWarningOptions) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const router = useRouter();

  // ブラウザのbeforeunloadイベントで警告を表示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // モダンブラウザでは、カスタムメッセージは無視され、
        // ブラウザのデフォルトメッセージが表示される
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, message]);

  // アプリ内ナビゲーションのためのハンドラー
  const handleNavigate = useCallback(
    (path: string) => {
      if (isDirty) {
        setPendingNavigation(path);
        setShowDialog(true);
        return false;
      }
      router.push(path);
      return true;
    },
    [isDirty, router]
  );

  // ダイアログで「離れる」を選択した場合
  const confirmNavigation = useCallback(() => {
    setShowDialog(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, router]);

  // ダイアログで「キャンセル」を選択した場合
  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    showDialog,
    setShowDialog,
    handleNavigate,
    confirmNavigation,
    cancelNavigation,
    message,
  };
}
