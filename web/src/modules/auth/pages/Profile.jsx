import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "@/shared/api/auth";
import { useAuth } from "../contexts/AuthContext";

const Profile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfileData(response.user);
    } catch (error) {
      console.error("Failed to load profile:", error);
      alert("Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>Hồ sơ cá nhân</h1>

      {profileData && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h2>Thông tin cơ bản</h2>
          <p>
            <strong>Họ và tên:</strong> {profileData.fullName}
          </p>
          <p>
            <strong>Email:</strong> {profileData.email}
          </p>
          <p>
            <strong>Ngày tạo tài khoản:</strong>{" "}
            {new Date(profileData.createdAt).toLocaleDateString("vi-VN")}
          </p>
          <p>
            <strong>Lần đăng nhập cuối:</strong>{" "}
            {profileData.lastLogin
              ? new Date(profileData.lastLogin).toLocaleDateString("vi-VN")
              : "Chưa từng đăng nhập"}
          </p>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <Link
          to="/"
          style={{
            marginRight: "20px",
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Về trang chủ
        </Link>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Profile;
