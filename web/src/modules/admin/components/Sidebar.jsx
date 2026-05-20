import { useEffect, useState } from "react";

const normalizeActiveView = (view) => {
  if (["land", "maps"].includes(view)) return "maps";
  if (["image-tools", "image-import", "image-edit", "image-rename", "assets"].includes(view)) return "assets";
  if (["dynasty", "dynasties"].includes(view)) return "dynasties";
  if (["character", "characters"].includes(view)) return "characters";
  if (["calendar-events", "calendar"].includes(view)) return "calendar-events";
  return view;
};

export const Sidebar = ({
  currentView,
  onSwitchView,
  dynastyCount,
  characterCount,
  isDarkMode,
  onToggleTheme,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 1024) onCloseMobile();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onCloseMobile]);

  const activeView = normalizeActiveView(currentView);

  const navItems = [
    { id: "dynasties", label: "Triều đại", icon: "fa-landmark", count: dynastyCount },
    { id: "characters", label: "Nhân vật", icon: "fa-user-tie", count: characterCount },
    { id: "calendar-events", label: "Niên biểu", icon: "fa-calendar-days", count: "Lịch sự kiện" },
    { id: "culture", label: "Văn hóa", icon: "fa-book-open", count: "Sắp ra mắt" },
    { id: "maps", label: "Vùng đất", icon: "fa-map-location-dot", count: "Sắp ra mắt" },
  ];

  const toolItems = [
    { id: "assets", label: "Image Tools", icon: "fa-images" },
    { id: "settings", label: "Cài đặt", icon: "fa-sliders" },
  ];

  const sidebarClasses = `sidebar-admin bg-sidebar border-r border-border ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`;

  return (
    <>
      <aside id="adminSidebar" className={sidebarClasses}>
        <div className="sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="logo-icon">
              <i className="fa-solid fa-dragon text-white text-xl"></i>
            </div>
            <div className="logo-text">
              <h1 className="text-lg font-bold text-accent font-display leading-tight">Sử Việt</h1>
              <p className="text-xs text-sub">Admin Dashboard</p>
            </div>
          </div>
          <button className="sidebar-collapse-btn hidden lg:flex" onClick={onToggleCollapse} title="Thu gọn">
            <i className="fa-solid fa-chevron-left text-sm"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">
              <i className="fa-solid fa-database text-xs"></i>
              <span>Quản lý dữ liệu</span>
            </div>

            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? "active" : ""}`}
                data-view={item.id}
                onClick={() => onSwitchView(item.id)}
              >
                <div className="nav-item-icon">
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <div className="nav-item-content">
                  <span className="nav-item-label">{item.label}</span>
                  <span className="nav-item-count">{item.count}</span>
                </div>
                <i className="fa-solid fa-chevron-right nav-item-arrow"></i>
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">
              <i className="fa-solid fa-toolbox text-xs"></i>
              <span>Công cụ</span>
            </div>

            {toolItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? "active" : ""}`}
                data-view={item.id}
                onClick={() => onSwitchView(item.id)}
              >
                <div className="nav-item-icon">
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <div className="nav-item-content">
                  <span className="nav-item-label">{item.label}</span>
                </div>
                <i className="fa-solid fa-chevron-right nav-item-arrow"></i>
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-actions">
            <button onClick={onToggleTheme} className="sidebar-action-btn group" title="Đổi theme">
              <i className={`fa-solid fa-${isDarkMode ? "moon" : "sun"} text-lg group-hover:text-accent transition-colors`}></i>
              <span className="text-sm font-medium">{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
            </button>
            <a href="/history" className="sidebar-action-btn group" title="Về trang chính">
              <i className="fa-solid fa-arrow-right-from-bracket text-lg group-hover:text-accent transition-colors"></i>
              <span className="text-sm font-medium">Về trang chính</span>
            </a>
          </div>
          <div className="sidebar-user-info">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Admin</p>
              <p className="text-xs text-sub truncate">Quản trị viên</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500" title="Online"></div>
          </div>
        </div>
      </aside>

      <div id="sidebarOverlay" className={`sidebar-overlay ${isMobileOpen ? "" : "hidden"}`} onClick={onCloseMobile} />
    </>
  );
};
