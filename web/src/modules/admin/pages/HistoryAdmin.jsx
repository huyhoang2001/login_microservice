import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminPanel } from "../panels/AdminPanel";
import "../styles/history-admin.css";

function HistoryAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [initialView, setInitialView] = useState("dynasties");

  useEffect(() => {
    // Extract view from URL path
    // e.g., /history/admin/characters -> characters
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const viewIndex = pathSegments.indexOf("admin");

    if (viewIndex !== -1 && pathSegments[viewIndex + 1]) {
      const view = pathSegments[viewIndex + 1];
      setInitialView(view);
    } else {
      setInitialView("dynasties");
    }
  }, [location.pathname]);

  const handleViewChange = (newView) => {
    navigate(`/history/admin/${newView}`);
  };

  return (
    <AdminPanel initialView={initialView} onViewChange={handleViewChange} />
  );
}

export default HistoryAdmin;
