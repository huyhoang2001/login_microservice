import { useEffect, useState } from "react";
import { authAPI } from "@/shared/api/auth";
import SliderCaptcha from "./SliderCaptcha";

const CaptchaModal = ({ isOpen, onClose, onVerified }) => {
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaSession, setCaptchaSession] = useState(null);
  const [captchaError, setCaptchaError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadCaptchaSession();
    } else {
      setCaptchaSession(null);
      setCaptchaError("");
    }
  }, [isOpen]);

  const loadCaptchaSession = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError("");
      const session = await authAPI.getCaptchaSession();
      setCaptchaSession(session);
    } catch (error) {
      console.error("❌ Failed to load captcha session:", error);
      setCaptchaError("Không thể tải captcha. Vui lòng thử lại.");
    } finally {
      setCaptchaLoading(false);
    }
  };

  const handleCaptchaComplete = async ({
    sessionId,
    userX,
    duration,
    dragHistoryCount,
  }) => {
    onVerified({
      captchaSessionId: sessionId,
      captchaPosition: userX,
      captchaDuration: duration,
      dragHistory: dragHistoryCount,
    });
  };

  const handleCaptchaFail = (error) => {
    setCaptchaError(
      error?.message || "Xác thực captcha thất bại. Vui lòng thử lại.",
    );
  };

  const handleReload = () => {
    setCaptchaError("");
    loadCaptchaSession();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 22,
          overflow: "hidden",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          position: "relative",
        }}
      >
        <div
          style={{
            padding: "26px 28px 20px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
            backgroundColor: "#f8fbff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1f2937",
                }}
              >
                Xác thực bảo mật
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14,
                  color: "#475569",
                  lineHeight: 1.55,
                }}
              >
                Hoàn thành captcha trượt để tiếp tục đăng nhập.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                color: "#475569",
                padding: 4,
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {captchaLoading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 240,
                color: "#475569",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "4px solid #dbeAFE",
                  borderTopColor: "#2563eb",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  marginBottom: 14,
                }}
              />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                Đang tải captcha...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : captchaError && !captchaSession ? (
            <div style={{ textAlign: "center", minHeight: 220 }}>
              <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 16 }}>
                {captchaError}
              </p>
              <button
                type="button"
                onClick={handleReload}
                style={{
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 20px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Thử lại
              </button>
            </div>
          ) : captchaSession ? (
            <SliderCaptcha
              session={captchaSession}
              onComplete={handleCaptchaComplete}
              onFail={handleCaptchaFail}
              onReload={handleReload}
            />
          ) : null}

          {captchaError && captchaSession && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 12,
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {captchaError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaptchaModal;
