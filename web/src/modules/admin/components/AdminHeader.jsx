import { useState } from "react";

export const AdminHeader = ({
  title,
  description,
  breadcrumb,
  searchQuery,
  onSearch,
  onClearSearch,
  onAddNew,
  onSaveAll,
  onExport,
  stats = [],
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.multiple = true;
    input.onchange = (event) => {
      if (window.onImportData) window.onImportData(event);
    };
    input.click();
    setIsMoreMenuOpen(false);
  };

  const handleReset = () => {
    if (window.onResetData) window.onResetData();
    setIsMoreMenuOpen(false);
  };

  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const ok = await onSaveAll();
      if (ok === false) window.showToast("Không thể lưu dữ liệu", "error");
      else window.showToast("Đã lưu dữ liệu", "success");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <header className="admin-header">
      <div className="header-inner">
        <div className="header-info">
          <nav className="breadcrumb">
            <a href="#" className="breadcrumb-item">
              Admin
            </a>
            <i className="fa-solid fa-chevron-right text-[10px] text-muted"></i>
            <span className="breadcrumb-item active">{breadcrumb}</span>
          </nav>
          <h2 className="header-title">{title}</h2>
          <p className="header-subtitle">{description}</p>
        </div>

        <div className="header-actions">
          <div className="search-wrapper">
            <i className="fa-solid fa-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm tên nhân vật, tên triều đại, thư viện ảnh..."
              value={searchQuery}
              onChange={(event) => onSearch(event.target.value)}
            />
            <button
              className={`search-clear ${!searchQuery ? "hidden" : ""}`}
              onClick={onClearSearch}
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          <div className="action-buttons">
            <button
              type="button"
              onClick={onAddNew}
              className="btn btn-primary"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Thêm mới</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="btn btn-outline"
              disabled={isSaving}
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>{isSaving ? "Đang lưu..." : "Lưu"}</span>
            </button>
            <button
              type="button"
              onClick={onExport}
              className="btn btn-outline"
            >
              <i className="fa-solid fa-file-export"></i>
              <span>Xuất</span>
            </button>
            <div className="relative" id="moreMenuWrapper">
              <button
                onClick={() => setIsMoreMenuOpen((value) => !value)}
                className="btn btn-icon"
                title="Thêm"
              >
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </button>
              {isMoreMenuOpen && (
                <div
                  className="dropdown-menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                  }}
                >
                  <button onClick={handleImport} className="dropdown-item">
                    <i className="fa-solid fa-file-import"></i>
                    <span>Nhập JSON</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="dropdown-item text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                    <span>Khôi phục mặc định</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="header-stats">
          {stats.map((stat, idx) => (
            <div key={idx} className="header-stat-item">
              <div
                className="header-stat-icon"
                style={{ background: `${stat.color}15`, color: stat.color }}
              >
                <i className={`fa-solid ${stat.icon}`}></i>
              </div>
              <div>
                <div className="header-stat-value">{stat.value}</div>
                <div className="header-stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
