import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const toastStyles = {
  success: {
    icon: "fa-circle-check",
    gradient: "linear-gradient(135deg, #16a34a, #15803d)",
  },
  error: {
    icon: "fa-circle-xmark",
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
  },
  warning: {
    icon: "fa-triangle-exclamation",
    gradient: "linear-gradient(135deg, #d97706, #b45309)",
  },
  info: {
    icon: "fa-circle-info",
    gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  },
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    window.showToast = showToast;
    return () => {
      delete window.showToast;
    };
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 20px",
            borderRadius: "var(--radius-lg)",
            color: "white",
            fontWeight: 500,
            fontSize: "14px",
            boxShadow: "var(--shadow-lg)",
            pointerEvents: "auto",
            animation: "toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            minWidth: "320px",
            maxWidth: "480px",
            background: toastStyles[toast.type].gradient,
          }}
        >
          <i className={`fa-solid ${toastStyles[toast.type].icon} text-lg`}></i>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>,
    document.body,
  );
};
