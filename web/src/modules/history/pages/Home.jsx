import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { Link } from "react-router-dom";

const Home = () => {
  const { isAuthenticated, user, logout } = useAuth();

  console.log("Home page - User:", user, "isAuthenticated:", isAuthenticated);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Trang chủ</h1>

      {isAuthenticated ? (
        <div>
          <h2>Chào mừng, {user?.fullName}!</h2>
          <p>Email: {user?.email}</p>
          <div style={{ marginTop: "20px" }}>
            <Link
              to="/profile"
              style={{
                marginRight: "20px",
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
              }}
            >
              Xem hồ sơ
            </Link>
            <a
              href="/history"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginRight: "20px",
                padding: "10px 20px",
                backgroundColor: "#17a2b8",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
              }}
            >
              Sử Việt Toàn Thư
            </a>
            <Link
              to="/history/admin"
              style={{
                marginRight: "20px",
                padding: "10px 20px",
                backgroundColor: "#ffc107",
                color: "black",
                textDecoration: "none",
                borderRadius: "4px",
              }}
            >
              Admin Panel
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
      ) : (
        <div>
          <p>Vui lòng đăng nhập để tiếp tục.</p>
          <div style={{ marginTop: "20px" }}>
            <Link
              to="/login"
              style={{
                marginRight: "20px",
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
              }}
            >
              Đăng nhập
            </Link>
            <Link
              to="/signup"
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
              }}
            >
              Đăng ký
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
