import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { authAPI } from "@/shared/api/auth";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    AUTH_FIELD,
    AUTH_PRIMARY_BTN,
    AuthPortalShell,
    COLORS,
} from "../components/AuthPortalShell";
import CaptchaModal from "../components/CaptchaModal";

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();
  const redirectTo = searchParams.get("redirect") || "/history";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [btnHover, setBtnHover] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    initializeAPI();
  }, []);

  const initializeAPI = async () => {
    try {
      await authAPI.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error("API initialization failed:", error);
      setIsInitialized(true);
    }
  };

  const validateForm = () => {
    let isValid = true;

    if (!email.trim()) {
      setEmailError("Email là bắt buộc");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Email không hợp lệ");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Mật khẩu là bắt buộc");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleLoginClick = () => {
    if (loginSuccess) return;
    if (!validateForm()) return;
    setShowCaptcha(true);
  };

  const handleCaptchaVerified = (payload) => {
    setShowCaptcha(false);
    performLogin(payload);
  };

  const handleCaptchaClose = () => {
    setShowCaptcha(false);
  };

  const performLogin = async (payload) => {
    setLoading(true);

    try {
      const response = await authAPI.login({
        email: email.trim().toLowerCase(),
        password,
        ...payload,
      });

      setLoginSuccess(true);
      setLoggedInEmail(response?.user?.email || email.trim().toLowerCase());

      // Update AuthContext with user data
      if (response.token && response.user) {
        await contextLogin(response.user, response.token);
      }

      // Redirect after successful login
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 1000);
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.userMessage || "Đăng nhập thất bại. Vui lòng thử lại.");
      setLoginSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#fff",
        }}
      >
        Đang tải...
      </div>
    );
  }

  return (
    <AuthPortalShell
      title="ĐĂNG NHẬP"
      footer={
        <div style={{ marginTop: 22, textAlign: "center" }}>
          <Link
            to="/signup"
            style={{
              color: COLORS.blueBtn,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Chưa có tài khoản? Đăng ký
          </Link>
        </div>
      }
    >
      {loginSuccess ? (
        <div
          style={{
            textAlign: "center",
            padding: "12px 0 4px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ecfdf5",
              border: "1px solid #86efac",
              borderRadius: 10,
              padding: "20px 16px",
              marginBottom: 16,
              color: "#166534",
              fontSize: 15,
              lineHeight: 1.55,
            }}
          >
            <strong>Đăng nhập thành công.</strong>
            <br />
            Tài khoản:{" "}
            <span style={{ wordBreak: "break-all" }}>{loggedInEmail}</span>
            <div style={{ marginTop: 12, fontSize: 13, color: "#15803d" }}>
              Đang chuyển hướng đến {redirectTo}...
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoginSuccess(false);
              setPassword("");
            }}
            style={{
              ...AUTH_PRIMARY_BTN,
              marginTop: 0,
              backgroundColor: "#fff",
              color: COLORS.blueBtn,
              border: `2px solid ${COLORS.blueBtn}`,
            }}
          >
            Đăng nhập lại (tài khoản khác)
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <input
              type="email"
              placeholder="Email / Tài khoản"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              style={{
                ...AUTH_FIELD,
                borderColor: emailError ? "#dc2626" : COLORS.border,
              }}
            />
            {emailError && (
              <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 6 }}>
                {emailError}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <input
              type="password"
              placeholder="Mật khẩu"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              style={{
                ...AUTH_FIELD,
                borderColor: passwordError ? "#dc2626" : COLORS.border,
              }}
            />
            {passwordError && (
              <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 6 }}>
                {passwordError}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 4,
              fontSize: 13,
            }}
          >
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{ color: COLORS.red, textDecoration: "none" }}
            >
              Quên mật khẩu?
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{ color: COLORS.blueBtn, textDecoration: "none" }}
            >
              Hướng dẫn sử dụng
            </a>
          </div>

          <button
            type="button"
            onClick={handleLoginClick}
            disabled={loading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              ...AUTH_PRIMARY_BTN,
              backgroundColor: loading
                ? "#94a3b8"
                : btnHover
                  ? COLORS.blueBtnHover
                  : COLORS.blueBtn,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </>
      )}

      <CaptchaModal
        isOpen={showCaptcha}
        onClose={handleCaptchaClose}
        onVerified={handleCaptchaVerified}
      />
    </AuthPortalShell>
  );
};

export default Login;
