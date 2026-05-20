/** Khung hai cột kiểu Cổng thông tin (trái branding, phải card form) */

const COLORS = {
  red: "#c41e3a",
  violet: "#5b4dcb",
  blueBtn: "#4285f4",
  blueBtnHover: "#3367d6",
  muted: "#6b7280",
  ink: "#111827",
  inputBg: "#eef3ff",
  border: "#d1d5db",
};

function DNTULogoMini() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <ellipse cx="36" cy="58" rx="14" ry="5" fill="rgba(196,30,58,0.18)" />
      <path
        d="M36 14 L48 42 L38 42 L38 56 L34 56 L34 42 L24 42 Z"
        fill={COLORS.red}
      />
      <path d="M24 26 Q36 14 48 26 L46 29 Q36 18 26 29 Z" fill={COLORS.red} />
      <rect x="22" y="28" width="28" height="6" rx="2" fill={COLORS.red} />
    </svg>
  );
}

export function AuthPortalShell({ title, children, footer }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(32px, 6vw, 72px)",
          padding: "clamp(24px, 4vw, 48px)",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
          flexWrap: "wrap",
          boxSizing: "border-box",
        }}
      >
        <aside
          style={{
            flex: "1 1 280px",
            maxWidth: 440,
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <DNTULogoMini />
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: COLORS.red,
                letterSpacing: "-0.02em",
              }}
            >
              DNTU
            </div>
          </div>
          <div
            style={{
              fontSize: "clamp(15px, 1.55vw, 17px)",
              fontWeight: 700,
              color: COLORS.red,
              lineHeight: 1.35,
              marginBottom: 8,
            }}
          >
            LỊCH SỬ VIỆT NAM
          </div>
          <div
            style={{
              fontSize: "clamp(14px, 1.35vw, 16px)",
              fontWeight: 600,
              color: COLORS.violet,
              lineHeight: 1.35,
              marginBottom: 6,
            }}
          >
            VIETNAM HISTORY
          </div>
          <div
            style={{
              fontSize: 14,
              color: COLORS.muted,
              fontWeight: 500,
              marginBottom: 16,
              letterSpacing: "0.04em",
            }}
          >
            DIGITAL SCHOOL
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(20px, 2.5vw, 26px)",
              fontWeight: 700,
              color: COLORS.ink,
            }}
          >
            Cổng thông tin
          </h1>
          {/* Tuỳ chọn: đặt file public/dntu-branding.png để hiển thị banner trường */}
          <img
            src="/dntu-branding.png"
            alt="Đại học Công nghệ Đồng Nai"
            style={{
              marginTop: 20,
              maxWidth: "100%",
              height: "auto",
              borderRadius: 8,
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </aside>

        <main
          style={{
            flex: "0 1 400px",
            width: "100%",
            maxWidth: 440,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              boxShadow:
                "0 4px 6px rgba(0, 0, 0, 0.06), 0 12px 28px rgba(0, 0, 0, 0.08)",
              padding: "clamp(28px, 5vw, 40px)",
              border: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                margin: "0 0 28px 0",
                textAlign: "center",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: COLORS.ink,
              }}
            >
              {title}
            </h2>
            {children}
            {footer}
          </div>
        </main>
      </div>
    </div>
  );
}

export const AUTH_FIELD = {
  boxSizing: "border-box",
  width: "100%",
  padding: "12px 14px",
  marginBottom: 4,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  fontSize: 15,
  backgroundColor: COLORS.inputBg,
  outline: "none",
};

export const AUTH_PRIMARY_BTN = {
  width: "100%",
  padding: "14px 16px",
  marginTop: 8,
  backgroundColor: COLORS.blueBtn,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  boxSizing: "border-box",
};

export { COLORS };
