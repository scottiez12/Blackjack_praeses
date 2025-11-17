import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "warning",
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: "bg-red-900/50",
      border: "border-red-500",
      title: "text-red-400",
      confirmBtn: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      bg: "bg-yellow-900/50",
      border: "border-yellow-500",
      title: "text-yellow-400",
      confirmBtn: "bg-yellow-600 hover:bg-yellow-700",
    },
    info: {
      bg: "bg-blue-900/50",
      border: "border-blue-500",
      title: "text-blue-400",
      confirmBtn: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full max-w-md p-6 rounded-xl border-2 ${styles.bg} ${styles.border} shadow-2xl animate-in fade-in zoom-in duration-200`}
      >
        <h2 className={`text-2xl font-bold mb-4 ${styles.title}`}>{title}</h2>
        <p className="text-gray-200 mb-6 text-lg">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold shadow-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 ${styles.confirmBtn} rounded-lg font-semibold shadow-lg transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

