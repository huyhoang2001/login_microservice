import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "@/shared/api/auth";
import CaptchaModal from "../components/CaptchaModal";
import {
  AUTH_FIELD,
  AUTH_PRIMARY_BTN,
  AuthPortalShell,
  COLORS,
} from "../components/AuthPortalShell";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const navigate = useNavigate();

  const clearErrors = () => {
    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  const validateEmail = (emailValue) => {
    if (!emailValue || !emailValue.trim()) {
      return { isValid: false, message: "Vui lòng nhập địa chỉ email" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
      return { isValid: false, message: "Định dạng email không hợp lệ" };
    }
    return { isValid: true };
  };

  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      return { isValid: false, message: "Vui lòng nhập mật khẩu" };
    }
    if (passwordValue.length < 6) {
      return { isValid: false, message: "Mật khẩu phải có ít nhất 6 ký tự" };
    }
    return { isValid: true };
  };

  const validateFullName = (name) => {
    if (!name || !name.trim()) {
      return { isValid: false, message: "Vui lòng nhập họ và tên" };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: "Họ và tên phải có ít nhất 2 ký tự" };
    }
    return { isValid: true };
  };

  const validateConfirmPassword = (passwordValue, confirm) => {
    if (!confirm) {
      return { isValid: false, message: "Vui lòng xác nhận mật khẩu" };
    }
    if (passwordValue !== confirm) {
      return { isValid: false, message: "Mật khẩu xác nhận không khớp" };
    }
    return { isValid: true };
  };

  const validateForm = () => {
    clearErrors();

    const fullNameValidation = validateFullName(fullName);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validateConfirmPassword(
      password,
      confirmPassword,
    );

    if (!fullNameValidation.isValid)
      setFullNameError(fullNameValidation.message);
    if (!emailValidation.isValid) setEmailError(emailValidation.message);
    if (!passwordValidation.isValid)
      setPasswordError(passwordValidation.message);
    if (!confirmPasswordValidation.isValid)
      setConfirmPasswordError(confirmPasswordValidation.message);

    return (
      fullNameValidation.isValid &&
      emailValidation.isValid &&
      passwordValidation.isValid &&
      confirmPasswordValidation.isValid
    );
  };

  const handleSignupClick = () => {
    if (!validateForm()) return;
    setShowCaptcha(true);
  };

  const handleCaptchaVerified = (payload) => {
    setShowCaptcha(false);
    performSignup(payload);
  };

  const handleCaptchaClose = () => {
    setShowCaptcha(false);
  };

  const performSignup = async (payload) => {
    setLoading(true);

    try {
      await authAPI.signup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        ...payload,
      });

      navigate("/login");
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
    } catch (error) {
      console.error("Signup failed:", error);
      alert(error.userMessage || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const fieldBorder = (err) => (err ? "#dc2626" : COLORS.border);

  return (
    <AuthPortalShell
      title="ĐĂNG KÝ"
      footer={
        <div style={{ marginTop: 22, textAlign: "center" }}>
          <Link
            to="/login"
            style={{
              color: COLORS.blueBtn,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      }
    >
      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="Họ và tên"
          autoComplete="name"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (fullNameError) setFullNameError("");
          }}
          style={{ ...AUTH_FIELD, borderColor: fieldBorder(fullNameError) }}
        />
        {fullNameError && (
          <div style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>
            {fullNameError}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
          style={{ ...AUTH_FIELD, borderColor: fieldBorder(emailError) }}
        />
        {emailError && (
          <div style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>
            {emailError}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          type="password"
          placeholder="Mật khẩu"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError("");
          }}
          style={{ ...AUTH_FIELD, borderColor: fieldBorder(passwordError) }}
        />
        {passwordError && (
          <div style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>
            {passwordError}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmPasswordError) setConfirmPasswordError("");
          }}
          style={{
            ...AUTH_FIELD,
            borderColor: fieldBorder(confirmPasswordError),
          }}
        />
        {confirmPasswordError && (
          <div style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>
            {confirmPasswordError}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSignupClick}
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
        {loading ? "Đang đăng ký…" : "Đăng ký"}
      </button>

      <CaptchaModal
        isOpen={showCaptcha}
        onClose={handleCaptchaClose}
        onVerified={handleCaptchaVerified}
      />
    </AuthPortalShell>
  );
};

export default Signup;
