import HistoryAdmin from "@/modules/admin/pages/HistoryAdmin";
import { AuthProvider } from "@/modules/auth/contexts/AuthContext";
import Login from "@/modules/auth/pages/Login";
import Profile from "@/modules/auth/pages/Profile";
import Signup from "@/modules/auth/pages/Signup";
import HistoryPublic from "@/modules/history/pages/HistoryPublic";
import Home from "@/modules/history/pages/Home";
import AdminRoute from "@/router/AdminRoute";
import ProtectedRoute from "@/router/ProtectedRoute";
import "@/shared/styles/App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<HistoryPublic />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/history/admin/*" element={<HistoryAdmin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
