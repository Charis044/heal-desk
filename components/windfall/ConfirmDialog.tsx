"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 自定义删除/确认弹层：替代浏览器 window.confirm。
 * 暗色半透明遮罩 + 浅色纸质感弹窗，贴合应用整体视觉。
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确定",
  cancelText = "取消",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <img
          src="/assets/scrap/tape-washi.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute -top-2 left-2 z-[1] h-5 w-12 object-cover object-top select-none mix-blend-multiply"
        />
        <img
          src="/assets/scrap/tape-washi.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute -top-2 right-2 z-[1] h-5 w-12 -scale-x-100 object-cover object-top select-none mix-blend-multiply"
        />
        <h3 className="relative z-10 confirm-title">{title}</h3>
        <p className="relative z-10 confirm-message">{message}</p>
        <div className="relative z-10 confirm-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={danger ? "confirm-danger" : "btn-save"}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
