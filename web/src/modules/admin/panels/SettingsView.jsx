export const SettingsView = ({
  isDarkMode,
  onSetTheme,
  onSaveAll,
  onExport,
  onReset,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>
          Giao diện
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => onSetTheme("light")}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "12px",
              border: `2px solid ${!isDarkMode ? "var(--accent-color)" : "var(--border-color)"}`,
              background: !isDarkMode ? "var(--accent-light)" : "transparent",
              cursor: "pointer",
            }}
          >
            <i className="fa-solid fa-sun text-2xl mb-2 block"></i>
            <span style={{ fontWeight: 600 }}>Sáng</span>
          </button>
          <button
            onClick={() => onSetTheme("dark")}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "12px",
              border: `2px solid ${isDarkMode ? "var(--accent-color)" : "var(--border-color)"}`,
              background: isDarkMode ? "var(--accent-light)" : "transparent",
              cursor: "pointer",
            }}
          >
            <i className="fa-solid fa-moon text-2xl mb-2 block"></i>
            <span style={{ fontWeight: 600 }}>Tối</span>
          </button>
        </div>
      </div>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>
          Dữ liệu
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={onSaveAll}
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            <i className="fa-solid fa-floppy-disk"></i> Lưu dữ liệu
          </button>
          <button
            onClick={onExport}
            className="btn btn-outline"
            style={{ width: "100%" }}
          >
            <i className="fa-solid fa-download"></i> Xuất JSON (2 file)
          </button>
          <button
            className="btn btn-outline"
            style={{ width: "100%" }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.multiple = true;
              input.onchange = (e) => {
                if (window.onImportData) window.onImportData(e);
              };
              input.click();
            }}
          >
            <i className="fa-solid fa-upload"></i> Import JSON
          </button>
          <button
            onClick={onReset}
            className="btn btn-outline"
            style={{ width: "100%", color: "#dc2626", borderColor: "#fecaca" }}
          >
            <i className="fa-solid fa-rotate-left"></i> Khôi phục mặc định
          </button>
        </div>
      </div>
    </div>
  );
};
