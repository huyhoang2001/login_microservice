import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "../components/AdminHeader";
import { ImagePreview, Modal } from "../components/Modal";
import { Sidebar } from "../components/Sidebar";
import { ToastContainer } from "../components/Toast";
import { useAdminData } from "../hooks/useAdminData";
import { collectImageAssets } from "../managers/AssetManager";
import { CalendarEventManager } from "../managers/CalendarEventManager";
import { CharacterManager } from "../managers/CharacterManager";
import { DynastyManager } from "../managers/DynastyManager";
import { TimelineEditor } from "../managers/TimelineEditor";
import {
  createFieldHashMapIndex,
  searchHashMapIndex,
} from "../utils/searchIndex";
import { PlaceholderView } from "./PlaceholderView";
import { SettingsView } from "./SettingsView";

// Helper functions
const exportData = (detailedData, dynastyData) => {
  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  download(
    new Blob([JSON.stringify(detailedData, null, 2)], {
      type: "application/json",
    }),
    `data_detailed_${new Date().toISOString().split("T")[0]}.json`,
  );
  setTimeout(() => {
    download(
      new Blob([JSON.stringify(dynastyData, null, 2)], {
        type: "application/json",
      }),
      `data_trieudai_${new Date().toISOString().split("T")[0]}.json`,
    );
  }, 200);
  window.showToast("✅ Đã xuất 2 file JSON!", "success");
};

export const AdminPanel = ({
  initialView = "dynasties",
  onViewChange = null,
}) => {
  const {
    detailedData,
    dynastyData,
    calendarData,
    isLoading,
    getAllCharacters,
    saveAllData,
    reloadData,
    updateDynastyData,
    updateDetailedData,
    updateCalendarData,
    updateKingsCount,
  } = useAdminData();

  const [currentView, setCurrentView] = useState(initialView);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSubtitle, setModalSubtitle] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const readValue = (id) => document.getElementById(id)?.value ?? "";

  // Restore theme and sidebar state
  useEffect(() => {
    const savedTheme = localStorage.getItem("adminTheme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }

    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed === "true" && window.innerWidth >= 1024) {
      setIsSidebarCollapsed(true);
    }

    // Setup global functions
    window.onImportData = async (e) => {
      let importedDetailed = null;
      let importedDynasty = null;
      let importedCalendar = null;

      for (const file of e.target.files) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (!Array.isArray(data) || !data.length) continue;
          if (data[0].kings !== undefined) importedDetailed = data;
          else if (
            data[0].king_count !== undefined ||
            data[0].capital !== undefined
          )
            importedDynasty = data;
          else if (data[0].date !== undefined || data[0].category !== undefined)
            importedCalendar = data;
        } catch (er) {
          window.showToast(`Lỗi file ${file.name}`, "error");
        }
      }

      if (importedDetailed || importedDynasty || importedCalendar) {
        if (
          confirm(
            `Nhập dữ liệu?\n\n${importedDetailed ? `📋 Chi tiết: ${importedDetailed.length} triều đại\n` : ""}${importedDynasty ? `📋 Triều đại: ${importedDynasty.length} triều đại\n` : ""}${importedCalendar ? `📋 Niên biểu: ${importedCalendar.length} sự kiện\n` : ""}\n⚠ GHI ĐÈ dữ liệu!`,
          )
        ) {
          if (importedDetailed) updateDetailedData(importedDetailed);
          if (importedDynasty) updateDynastyData(importedDynasty);
          if (importedCalendar) updateCalendarData(importedCalendar);
          updateKingsCount();
          saveAllData({
            detailedData: importedDetailed || detailedData,
            dynastyData: importedDynasty || dynastyData,
            calendarData: importedCalendar || calendarData,
          });
          window.showToast(
            `✅ Import ${dynastyData.length} triều đại, ${getAllCharacters().length} nhân vật!`,
            "success",
          );
        }
      } else {
        window.showToast("Không có dữ liệu hợp lệ", "warning");
      }
    };

    window.onResetData = handleResetData;

    return () => {
      delete window.onImportData;
      delete window.onResetData;
    };
  }, [
    updateDetailedData,
    updateDynastyData,
    updateKingsCount,
    saveAllData,
    handleResetData,
    dynastyData.length,
    getAllCharacters,
  ]);

  async function handleResetData() {
    if (
      !confirm(
        "Khôi phục mặc định?\n\nDữ liệu local sẽ được xóa và tải lại từ server.",
      )
    )
      return;
    localStorage.removeItem("adminData");
    await reloadData();
    window.showToast("Đã tải lại dữ liệu", "success");
  }

  const handleSetTheme = (theme) => {
    setIsDarkMode(theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("adminTheme", theme);
  };

  const toggleTheme = () => handleSetTheme(isDarkMode ? "light" : "dark");

  const handleSwitchView = (view) => {
    setCurrentView(view);
    setSearchQuery("");
    if (window.innerWidth < 1024) setIsMobileSidebarOpen(false);
    if (onViewChange) onViewChange(view);
  };

  const handleAddNew = () => {
    if (currentView === "dynasties") handleAddDynasty();
    else if (currentView === "characters") handleAddCharacter();
    else if (currentView === "assets") handleAddAsset();
    else if (currentView === "calendar-events") handleAddCalendarEvent();
  };

  const handleSaveCurrentView = async () => {
    if (currentView !== "calendar-events") {
      return saveAllData();
    }

    try {
      const response = await fetch("/api/history/admin/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: "overwrite",
          calendarData,
        }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          // Fallback for servers that have not deployed the dedicated calendar endpoint yet.
          return saveAllData({ detailedData, dynastyData, calendarData });
        }
        throw new Error("Không thể lưu niên biểu");
      }

      const saved = {
        detailedData,
        dynastyData,
        calendarData,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("adminData", JSON.stringify(saved));
      window.dispatchEvent(
        new CustomEvent("historyDataUpdated", { detail: saved }),
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // Dynasty handlers
  const handleAddDynasty = () => {
    setModalTitle("Thêm triều đại mới");
    setModalSubtitle("Điền thông tin để tạo triều đại mới");
    setModalContent(
      <div className="form-section">
        <h4 className="form-section-title">
          <i className="fa-solid fa-info-circle"></i> Thông tin cơ bản
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              Tên triều đại <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              id="dynastyName"
              placeholder="VD: Nhà Ngô"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phân loại</label>
            <select className="form-select" id="dynastyTag">
              {[
                "Khởi Thủy",
                "Kiến Thiết",
                "Phục Hồi",
                "Thống Nhất",
                "Kháng Chiến",
                "Hưng Thịnh",
                "Hào Hùng",
                "Cải Cách",
                "Thịnh Trị",
                "Biến Động",
                "Phân Tranh",
                "Quật Khởi",
                "Cuối Cùng",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Thời kỳ</label>
            <input
              type="text"
              className="form-input"
              id="dynastyPeriod"
              placeholder="VD: 0/0/939 - 0/0/967"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Năm bắt đầu</label>
            <input
              type="text"
              className="form-input"
              id="dynastyStartYear"
              placeholder="VD: 0/0/939"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kinh đô</label>
            <input
              type="text"
              className="form-input"
              id="dynastyCapital"
              placeholder="VD: Cổ Loa (Hà Nội)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Số đời vua</label>
            <input
              type="number"
              className="form-input"
              id="dynastyKingCount"
              value={0}
              min={0}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ảnh banner</label>
            <input
              type="file"
              className="form-input"
              id="dynastyBannerFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ảnh bản đồ</label>
            <input
              type="file"
              className="form-input"
              id="dynastyMapFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ảnh biểu tượng</label>
            <input
              type="file"
              className="form-input"
              id="dynastyEmblemFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
        </div>
        <div className="form-grid full">
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-textarea"
              id="dynastyDesc"
              rows={3}
              placeholder="Mô tả về triều đại..."
            />
          </div>
        </div>
      </div>,
    );
    setModalOpen(true);

    // Save handler for modal
    const saveHandler = async () => {
      const name = document.getElementById("dynastyName").value.trim();
      if (!name) {
        window.showToast("Vui lòng nhập tên triều đại", "warning");
        return;
      }
      if (dynastyData.find((d) => d.name === name)) {
        window.showToast("Tên triều đại đã tồn tại!", "warning");
        return;
      }

      const newDynasty = {
        name,
        tag: document.getElementById("dynastyTag").value,
        period: document.getElementById("dynastyPeriod").value,
        start_year: document.getElementById("dynastyStartYear").value,
        capital: document.getElementById("dynastyCapital").value,
        king_count:
          parseInt(document.getElementById("dynastyKingCount").value) || 0,
        description: document.getElementById("dynastyDesc").value,
        images: { banner: "", map: "", emblem: "" },
        cultural_highlights: [],
      };

      const bannerFile =
        document.getElementById("dynastyBannerFile")?.files?.[0];
      const mapFile = document.getElementById("dynastyMapFile")?.files?.[0];
      const emblemFile =
        document.getElementById("dynastyEmblemFile")?.files?.[0];
      if (bannerFile)
        newDynasty.images.banner = await uploadHistoryImage(
          bannerFile,
          getFolderByField("banner"),
          "banner",
        );
      if (mapFile)
        newDynasty.images.map = await uploadHistoryImage(
          mapFile,
          getFolderByField("map"),
          "map",
        );
      if (emblemFile)
        newDynasty.images.emblem = await uploadHistoryImage(
          emblemFile,
          getFolderByField("emblem"),
          "emblem",
        );

      updateDynastyData([...dynastyData, newDynasty]);
      updateDetailedData([
        ...detailedData,
        {
          name,
          period: document.getElementById("dynastyPeriod").value,
          images: { banner: "", map: "", artifacts: [] },
          kings: [],
        },
      ]);
      await saveAllData();
      setModalOpen(false);
      window.showToast(`Đã thêm "${name}"!`, "success");
    };

    const originalHandler = window.handleModalSave;
    window.handleModalSave = saveHandler;
    return () => {
      window.handleModalSave = originalHandler;
    };
  };

  const handleEditDynasty = (index) => {
    const dynasty = dynastyData[index];
    if (!dynasty) return;

    setModalTitle("Sửa triều đại");
    setModalSubtitle(dynasty.name);
    setModalContent(
      <div className="form-section">
        <h4 className="form-section-title">
          <i className="fa-solid fa-info-circle"></i> Thông tin
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              Tên <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              id="dynastyName"
              defaultValue={dynasty.name}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phân loại</label>
            <select
              className="form-select"
              id="dynastyTag"
              defaultValue={dynasty.tag}
            >
              {[
                "Khởi Thủy",
                "Kiến Thiết",
                "Phục Hồi",
                "Thống Nhất",
                "Kháng Chiến",
                "Hưng Thịnh",
                "Hào Hùng",
                "Cải Cách",
                "Thịnh Trị",
                "Biến Động",
                "Phân Tranh",
                "Quật Khởi",
                "Cuối Cùng",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Thời kỳ</label>
            <input
              type="text"
              className="form-input"
              id="dynastyPeriod"
              defaultValue={dynasty.period}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Năm bắt đầu</label>
            <input
              type="text"
              className="form-input"
              id="dynastyStartYear"
              defaultValue={dynasty.start_year}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kinh đô</label>
            <input
              type="text"
              className="form-input"
              id="dynastyCapital"
              defaultValue={dynasty.capital}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Số đời vua</label>
            <input
              type="number"
              className="form-input"
              id="dynastyKingCount"
              defaultValue={dynasty.king_count || 0}
              min={0}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Thay banner</label>
            <input
              type="file"
              className="form-input"
              id="dynastyBannerFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Thay bản đồ</label>
            <input
              type="file"
              className="form-input"
              id="dynastyMapFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Thay biểu tượng</label>
            <input
              type="file"
              className="form-input"
              id="dynastyEmblemFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
        </div>
        <div className="form-grid full">
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-textarea"
              id="dynastyDesc"
              rows={3}
              defaultValue={dynasty.description}
            />
          </div>
        </div>
      </div>,
    );
    setModalOpen(true);

    const saveHandler = async () => {
      const oldName = dynasty.name;
      const newName = document.getElementById("dynastyName").value.trim();
      if (!newName) {
        window.showToast("Vui lòng nhập tên!", "warning");
        return;
      }

      dynasty.name = newName;
      dynasty.tag = document.getElementById("dynastyTag").value;
      dynasty.period = document.getElementById("dynastyPeriod").value;
      dynasty.start_year = document.getElementById("dynastyStartYear").value;
      dynasty.capital = document.getElementById("dynastyCapital").value;
      dynasty.king_count =
        parseInt(document.getElementById("dynastyKingCount").value) || 0;
      dynasty.description = document.getElementById("dynastyDesc").value;
      dynasty.images = dynasty.images || { banner: "", map: "", emblem: "" };
      const bannerFile =
        document.getElementById("dynastyBannerFile")?.files?.[0];
      const mapFile = document.getElementById("dynastyMapFile")?.files?.[0];
      const emblemFile =
        document.getElementById("dynastyEmblemFile")?.files?.[0];
      if (bannerFile)
        dynasty.images.banner = await uploadHistoryImage(
          bannerFile,
          getFolderByField("banner"),
          "banner",
        );
      if (mapFile)
        dynasty.images.map = await uploadHistoryImage(
          mapFile,
          getFolderByField("map"),
          "map",
        );
      if (emblemFile)
        dynasty.images.emblem = await uploadHistoryImage(
          emblemFile,
          getFolderByField("emblem"),
          "emblem",
        );

      if (oldName !== newName) {
        const detailed = detailedData.find((d) => d.name === oldName);
        if (detailed) detailed.name = newName;
      }

      updateDynastyData([...dynastyData]);
      updateDetailedData([...detailedData]);
      await saveAllData();
      setModalOpen(false);
      window.showToast("Đã cập nhật!", "success");
    };

    window.handleModalSave = saveHandler;
  };

  const handleDeleteDynasty = (index) => {
    const dynasty = dynastyData[index];
    if (!dynasty) return;
    if (
      !confirm(
        `Xóa triều đại "${dynasty.name}"?\n\nTẤT CẢ vua sẽ bị xóa!\nThao tác không thể hoàn tác!`,
      )
    )
      return;

    const newDynastyData = dynastyData.filter((_, i) => i !== index);
    const newDetailedData = detailedData.filter((d) => d.name !== dynasty.name);
    updateDynastyData(newDynastyData);
    updateDetailedData(newDetailedData);
    saveAllData();
    window.showToast(`Đã xóa "${dynasty.name}"`, "warning");
  };

  // Character handlers
  const handleAddCharacter = () => {
    setModalTitle("Thêm nhân vật mới");
    setModalSubtitle("Điền thông tin nhân vật lịch sử");
    setModalContent(
      <div className="form-section">
        <h4 className="form-section-title">
          <i className="fa-solid fa-info-circle"></i> Thông tin
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              Triều đại <span className="required">*</span>
            </label>
            <select className="form-select" id="charDynasty">
              <option value="">-- Chọn triều đại --</option>
              {detailedData.map((d, i) => (
                <option key={i} value={i}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              Tên <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              id="charName"
              placeholder="VD: Ngô Quyền"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tước hiệu</label>
            <input
              type="text"
              className="form-input"
              id="charTitle"
              placeholder="VD: Tiền Ngô Vương"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Năm sinh - mất</label>
            <input
              type="text"
              className="form-input"
              id="charBD"
              placeholder="VD: 0/0/898 - 0/0/944"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Trị vì</label>
            <input
              type="text"
              className="form-input"
              id="charReign"
              placeholder="VD: 0/0/939 - 0/0/944"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Portrait image</label>
            <input
              type="file"
              className="form-input"
              id="charPortraitFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Statue image</label>
            <input
              type="file"
              className="form-input"
              id="charStatueFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
        </div>
        <div className="form-grid full">
          <div className="form-group">
            <label className="form-label">Tóm tắt</label>
            <textarea
              className="form-textarea"
              id="charSummary"
              rows={3}
              placeholder="Mô tả ngắn..."
            />
          </div>
        </div>
      </div>,
    );
    setModalOpen(true);

    const saveHandler = async () => {
      const dynastyIndex = parseInt(
        document.getElementById("charDynasty").value,
      );
      const name = document.getElementById("charName").value.trim();

      if (isNaN(dynastyIndex)) {
        window.showToast("Chọn triều đại!", "warning");
        return;
      }
      if (!name) {
        window.showToast("Nhập tên!", "warning");
        return;
      }

      const newDetailed = [...detailedData];
      let portrait = "";
      let statue = "";
      const portraitFile =
        document.getElementById("charPortraitFile")?.files?.[0];
      const statueFile = document.getElementById("charStatueFile")?.files?.[0];
      if (portraitFile)
        portrait = await uploadHistoryImage(
          portraitFile,
          getFolderByField("portrait", "character"),
          "portrait",
        );
      if (statueFile)
        statue = await uploadHistoryImage(
          statueFile,
          getFolderByField("statue", "character"),
          "statue",
        );
      newDetailed[dynastyIndex].kings.push({
        name,
        title: document.getElementById("charTitle").value || "Chưa rõ",
        birth_death: document.getElementById("charBD").value || "0/0/0 - 0/0/0",
        reign: document.getElementById("charReign").value || "",
        summary: document.getElementById("charSummary").value || "",
        images: { portrait, statue, gallery: [] },
        overview: "",
        timeline: [],
        achievements: [],
        legacy: "",
      });

      updateDetailedData(newDetailed);
      updateKingsCount();
      await saveAllData();
      setModalOpen(false);
      window.showToast(`Đã thêm ${name}!`, "success");
    };

    window.handleModalSave = saveHandler;
  };

  const handleEditCharacterInfo = (dynastyIndex, kingIndex) => {
    const king = detailedData[dynastyIndex]?.kings?.[kingIndex];
    if (!king) return;

    setModalTitle(`Sửa: ${king.name}`);
    setModalSubtitle(detailedData[dynastyIndex].name);
    setModalContent(
      <div className="form-section">
        <h4 className="form-section-title">
          <i className="fa-solid fa-info-circle"></i> Thông tin
        </h4>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Tên</label>
            <input
              type="text"
              className="form-input"
              id="charName"
              defaultValue={king.name}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tước hiệu</label>
            <input
              type="text"
              className="form-input"
              id="charTitle"
              defaultValue={king.title}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Năm sinh - mất</label>
            <input
              type="text"
              className="form-input"
              id="charBD"
              defaultValue={king.birth_death}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Trị vì</label>
            <input
              type="text"
              className="form-input"
              id="charReign"
              defaultValue={king.reign}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Replace portrait</label>
            <input
              type="file"
              className="form-input"
              id="charPortraitFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Replace statue</label>
            <input
              type="file"
              className="form-input"
              id="charStatueFile"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            />
          </div>
        </div>
        <div className="form-grid full">
          <div className="form-group">
            <label className="form-label">Tóm tắt</label>
            <textarea
              className="form-textarea"
              id="charSummary"
              rows={3}
              defaultValue={king.summary}
            />
          </div>
        </div>
      </div>,
    );
    setModalOpen(true);

    const saveHandler = async () => {
      const newDetailed = [...detailedData];
      newDetailed[dynastyIndex].kings[kingIndex].name =
        document.getElementById("charName").value;
      newDetailed[dynastyIndex].kings[kingIndex].title =
        document.getElementById("charTitle").value;
      newDetailed[dynastyIndex].kings[kingIndex].birth_death =
        document.getElementById("charBD").value;
      newDetailed[dynastyIndex].kings[kingIndex].reign =
        document.getElementById("charReign").value;
      newDetailed[dynastyIndex].kings[kingIndex].summary =
        document.getElementById("charSummary").value;
      newDetailed[dynastyIndex].kings[kingIndex].images = newDetailed[
        dynastyIndex
      ].kings[kingIndex].images || { portrait: "", statue: "", gallery: [] };
      const portraitFile =
        document.getElementById("charPortraitFile")?.files?.[0];
      const statueFile = document.getElementById("charStatueFile")?.files?.[0];
      if (portraitFile)
        newDetailed[dynastyIndex].kings[kingIndex].images.portrait =
          await uploadHistoryImage(
            portraitFile,
            getFolderByField("portrait", "character"),
            "portrait",
          );
      if (statueFile)
        newDetailed[dynastyIndex].kings[kingIndex].images.statue =
          await uploadHistoryImage(
            statueFile,
            getFolderByField("statue", "character"),
            "statue",
          );

      updateDetailedData(newDetailed);
      await saveAllData();
      setModalOpen(false);
      window.showToast("Đã cập nhật!", "success");
    };

    window.handleModalSave = saveHandler;
  };

  const handleEditCharacterTimeline = (dynastyIndex, kingIndex) => {
    const king = detailedData[dynastyIndex]?.kings?.[kingIndex];
    if (!king) {
      window.showToast("Không tìm thấy nhân vật", "error");
      return;
    }

    setModalTitle(`Dòng thời gian: ${king.name}`);
    setModalSubtitle(`${king.title} - ${detailedData[dynastyIndex].name}`);
    setModalContent(
      <TimelineEditor
        king={king}
        dynastyName={detailedData[dynastyIndex].name}
        onSave={(updatedData) => {
          const newDetailed = [...detailedData];
          newDetailed[dynastyIndex].kings[kingIndex].overview =
            updatedData.overview;
          newDetailed[dynastyIndex].kings[kingIndex].legacy =
            updatedData.legacy;
          newDetailed[dynastyIndex].kings[kingIndex].achievements =
            updatedData.achievements;
          newDetailed[dynastyIndex].kings[kingIndex].timeline =
            updatedData.timeline;

          updateDetailedData(newDetailed);
          saveAllData();
          setModalOpen(false);
          window.showToast(
            `Đã lưu timeline (${updatedData.timeline.length} sự kiện)!`,
            "success",
          );
        }}
      />,
    );
    setModalOpen(true);
  };

  const handleDeleteCharacter = (dynastyIndex, kingIndex) => {
    const king = detailedData[dynastyIndex]?.kings?.[kingIndex];
    if (!king) return;
    if (!confirm(`Xóa "${king.name}"?`)) return;

    const newDetailed = [...detailedData];
    newDetailed[dynastyIndex].kings.splice(kingIndex, 1);
    updateDetailedData(newDetailed);
    updateKingsCount();
    saveAllData();
    window.showToast(`Đã xóa ${king.name}`, "warning");
  };

  const allCharacters = useMemo(
    () => getAllCharacters(),
    [getAllCharacters, detailedData],
  );

  const allAssets = useMemo(
    () => collectImageAssets(dynastyData, detailedData),
    [dynastyData, detailedData],
  );

  const globalSearchItems = useMemo(
    () => [
      ...dynastyData.map((dynasty, index) => ({
        dataset: "dynasty",
        index,
        characterName: "",
        dynastyName: dynasty.name,
        imageLibrary: "",
      })),
      ...allCharacters.map((character) => ({
        dataset: "character",
        index: `${character.dynastyIndex}-${character.kingIndex}`,
        characterName: character.name,
        dynastyName: character.dynastyName || "",
        imageLibrary: "",
      })),
      ...allAssets.map((asset, index) => ({
        dataset: "asset",
        index,
        characterName: "",
        dynastyName: asset.label || "",
        imageLibrary: `${asset.field} ${asset.url || ""} ${asset.source}`,
      })),
      ...calendarData.map((event, index) => ({
        dataset: "calendar",
        index,
        characterName: event.related_king || event.related_person?.name || "",
        dynastyName: event.related_dynasty || event.title || "",
        imageLibrary: `${event.category || ""} ${event.date?.display || ""} ${(event.tags || []).join(" ")}`,
      })),
    ],
    [dynastyData, allCharacters, allAssets, calendarData],
  );

  const globalSearchIndex = useMemo(
    () =>
      createFieldHashMapIndex(globalSearchItems, [
        (item) => item.characterName,
        (item) => item.dynastyName,
        (item) => item.imageLibrary,
      ]),
    [globalSearchItems],
  );

  const globalMatchedIds = useMemo(
    () => searchHashMapIndex(globalSearchIndex, searchQuery),
    [globalSearchIndex, searchQuery],
  );

  const globalMatchedItems = useMemo(
    () => globalSearchItems.filter((_, index) => globalMatchedIds.has(index)),
    [globalSearchItems, globalMatchedIds],
  );

  const matchedDynastyIndexes = useMemo(
    () =>
      new Set(
        globalMatchedItems
          .filter((item) => item.dataset === "dynasty")
          .map((item) => item.index),
      ),
    [globalMatchedItems],
  );

  const matchedCharacterKeys = useMemo(
    () =>
      new Set(
        globalMatchedItems
          .filter((item) => item.dataset === "character")
          .map((item) => item.index),
      ),
    [globalMatchedItems],
  );

  const parseEventDateInput = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return null;
    // Match DD/MM/YYYY format
    const full = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{1,4})$/);
    if (full) {
      return {
        day: Number.parseInt(full[1], 10) || 0,
        month: Number.parseInt(full[2], 10) || 0,
        year: Number.parseInt(full[3], 10) || 0,
      };
    }
    // Match DD/MM format (for lunar dates without year, like 10/3)
    const dayMonth = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (dayMonth) {
      return {
        day: Number.parseInt(dayMonth[1], 10) || 0,
        month: Number.parseInt(dayMonth[2], 10) || 0,
        year: 0,
      };
    }
    // Match year-only format
    const yearOnly = raw.match(/^\d{1,4}$/);
    if (yearOnly) {
      return { day: 0, month: 0, year: Number.parseInt(raw, 10) || 0 };
    }
    return null;
  };

  const formatEventDateDisplay = (dateBits) => {
    if (!dateBits) return "";
    const { day, month, year } = dateBits;
    // Full date with year
    if (day && month && year) return `${day}/${month}/${year}`;
    // Day and month only (lunar dates without year, like 10/3)
    if (day && month && !year) return `${day}/${month}`;
    // Month and year only
    if (month && year && !day) return `0/${month}/${year}`;
    // Year only
    if (year && !day && !month) return `Năm ${year}`;
    return "";
  };

  const hasDayMonth = (dateBits) => Boolean(dateBits?.day && dateBits?.month);
  const hasFullDate = (dateBits) =>
    Boolean(dateBits?.day && dateBits?.month && dateBits?.year);

  const syncCalendarDateInput = () => {
    const recurringType = readValue("calRecurringType") || "none";
    const activeDateInput =
      recurringType === "lunar_annual"
        ? "calLunarDateInput"
        : "calSolarDateInput";
    const sharedInput = document.getElementById("calDateInput");
    if (sharedInput) sharedInput.value = readValue(activeDateInput);
  };

  const openCalendarModal = (eventItem = null, editIndex = -1) => {
    const isEdit = editIndex >= 0;
    const initial = eventItem || {};
    const initialDate = initial.date || {};
    const initialSolarDate =
      initial.solar_date || (!initialDate.lunar ? initialDate : null);
    const initialLunarDate =
      initial.lunar_date || (initialDate.lunar ? initialDate : null);
    const initialSolarDateValue = initialSolarDate?.display || "";
    const initialLunarDateValue = initialLunarDate?.display || "";
    const initialDateValue =
      initialDate.display || initialSolarDateValue || initialLunarDateValue;
    const initialIsLunar =
      initialDate.lunar === true ||
      initial.lunar_date ||
      initial.calendar_type === "lunar" ||
      initial.recurring_type === "lunar_annual";
    setModalTitle(isEdit ? "Sửa sự kiện niên biểu" : "Thêm sự kiện niên biểu");
    setModalSubtitle(
      "Chuẩn hóa ngày theo DD/MM/YYYY hoặc 0/MM/YYYY hoặc 0/0/YYYY",
    );
    setModalContent(
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Mã sự kiện</label>
          <input
            className="form-input"
            id="calId"
            defaultValue={initial.id || `evt_${Date.now()}`}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Danh mục</label>
          <select
            className="form-select"
            id="calCategory"
            defaultValue={initial.category || "cultural"}
          >
            <option value="holiday">Kì nghỉ</option>
            <option value="birthday">Ngày sinh</option>
            <option value="death">Ngày mất</option>
            <option value="battle">Trận chiến</option>
            <option value="cultural">Văn hóa</option>
            <option value="political">Chính trị</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tiêu đề</label>
          <input
            className="form-input"
            id="calTitle"
            defaultValue={initial.title || ""}
          />
        </div>
        <input
          type="hidden"
          id="calDateInput"
          defaultValue={initialDateValue}
        />
        <div className="form-group">
          <label className="form-label">Ngày dương lịch (DD/MM/YYYY)</label>
          <input
            className="form-input"
            id="calSolarDateInput"
            defaultValue={initialSolarDateValue}
            onInput={syncCalendarDateInput}
            placeholder="30/4/1975 hoặc 0/0/938"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Ngày âm lịch (DD/MM/YYYY)</label>
          <input
            className="form-input"
            id="calLunarDateInput"
            defaultValue={initialLunarDateValue}
            onInput={syncCalendarDateInput}
            placeholder="10/3/2026 hoặc 10/3/0"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mức độ</label>
          <select
            className="form-select"
            id="calSignificance"
            defaultValue={initial.significance || "cultural"}
          >
            <option value="national">Quốc gia</option>
            <option value="regional">Khu vực</option>
            <option value="cultural">Văn hóa</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Lặp lại</label>
          <select
            className="form-select"
            id="calRecurringType"
            defaultValue={initial.recurring_type || "none"}
            onChange={syncCalendarDateInput}
          >
            <option value="none">Không lặp lại</option>
            <option value="annual">Hàng năm</option>
            <option value="lunar_annual">Hàng năm âm lịch</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Triều đại liên quan</label>
          <input
            className="form-input"
            id="calDynasty"
            defaultValue={initial.related_dynasty || ""}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Nhân vật/Vua liên quan</label>
          <input
            className="form-input"
            id="calKing"
            defaultValue={initial.related_king || ""}
          />
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">Mô tả</label>
          <textarea
            className="form-textarea"
            id="calDescription"
            defaultValue={initial.description || ""}
            rows={3}
          />
        </div>
      </div>,
    );
    setModalOpen(true);

    window.handleModalSave = async () => {
      const id = readValue("calId") || `evt_${Date.now()}`;
      const recurringType = readValue("calRecurringType") || "none";
      const solarDateBits = parseEventDateInput(readValue("calSolarDateInput"));
      const lunarDateBits = parseEventDateInput(readValue("calLunarDateInput"));
      const isLunarEvent =
        recurringType === "lunar_annual" || (!solarDateBits && !!lunarDateBits);
      if (lunarDateBits && !hasDayMonth(lunarDateBits)) {
        window.showToast("Ngày âm lịch cần có ngày và tháng", "warning");
        return;
      }
      if (recurringType === "none" && !hasFullDate(solarDateBits)) {
        window.showToast(
          "Sự kiện một lần cần ngày dương lịch đầy đủ",
          "warning",
        );
        return;
      }
      const dateBits = isLunarEvent ? lunarDateBits : solarDateBits;
      const solarDate = solarDateBits
        ? {
            day: solarDateBits.day,
            month: solarDateBits.month,
            year: solarDateBits.year || null,
            lunar: false,
            calendar_type: "solar",
            display: formatEventDateDisplay(solarDateBits),
          }
        : null;
      const lunarDate = lunarDateBits
        ? {
            day: lunarDateBits.day,
            month: lunarDateBits.month,
            year: lunarDateBits.year || null,
            lunar: true,
            calendar_type: "lunar",
            display: formatEventDateDisplay(lunarDateBits),
          }
        : null;
      const nextEvent = {
        ...(initial || {}),
        id,
        category: readValue("calCategory") || "cultural",
        title: readValue("calTitle") || "",
        description: readValue("calDescription") || "",
        date: dateBits
          ? {
              day: dateBits.day,
              month: dateBits.month,
              year: dateBits.year || null,
              lunar: isLunarEvent,
              calendar_type: isLunarEvent ? "lunar" : "solar",
              display: formatEventDateDisplay(dateBits),
            }
          : null,
        solar_date: solarDate,
        lunar_date: lunarDate,
        calendar_type: isLunarEvent ? "lunar" : "solar",
        recurring: recurringType !== "none",
        recurring_type: recurringType,
        significance: readValue("calSignificance") || "cultural",
        related_dynasty: readValue("calDynasty") || null,
        related_king: readValue("calKing") || null,
        location: initial.location || "",
        source: initial.source || "",
        tags: Array.isArray(initial.tags) ? initial.tags : [],
      };

      const next = [...calendarData];
      if (isEdit) next[editIndex] = nextEvent;
      else next.push(nextEvent);
      updateCalendarData(next);
      await saveAllData({ detailedData, dynastyData, calendarData: next });
      setModalOpen(false);
      window.showToast("Đã lưu sự kiện niên biểu", "success");
    };
  };

  const handleAddCalendarEvent = () => openCalendarModal();
  const handleEditCalendarEvent = (index) =>
    openCalendarModal(calendarData[index], index);
  const handleDeleteCalendarEvent = async (index) => {
    const item = calendarData[index];
    if (!item) return;
    if (!confirm(`Xóa sự kiện "${item.title}"?`)) return;
    const next = calendarData.filter((_, i) => i !== index);
    updateCalendarData(next);
    await saveAllData({ detailedData, dynastyData, calendarData: next });
    window.showToast("Đã xóa sự kiện niên biểu", "warning");
  };

  const getFolderByField = (field, source = "") => {
    const key = String(field || "").toLowerCase();
    if (key === "map") return "maps";
    if (key === "emblem") return "icons";
    if (key === "portrait" || key === "statue" || key === "gallery")
      return "characters";
    if (source === "character") return "characters";
    return "dynasties";
  };

  const uploadHistoryImage = async (file, folder, field = "") => {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
    const lowerName = String(file?.name || "").toLowerCase();
    const hasValidExt = allowedExt.some((ext) => lowerName.endsWith(ext));
    if (!allowedTypes.has(file?.type) || !hasValidExt) {
      throw new Error("Chỉ hỗ trợ JPG, JPEG, PNG, WEBP");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Dung lượng ảnh phải nhỏ hơn 5MB");
    }
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);
    formData.append("field", field);

    const response = await fetch("/api/history/admin/images", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) throw new Error("Không thể tải ảnh lên");
    const payload = await response.json();
    return payload.relativePath || payload.path || "";
  };

  const writeAssetPath = (nextDetailed, nextDynasty, asset, value) => {
    const setSingle = (container) => {
      container[asset.field] = value;
    };

    const setArray = (container) => {
      const list = Array.isArray(container[asset.field])
        ? [...container[asset.field]]
        : [];
      if (asset.imageIndex == null) list.push(value);
      else list[asset.imageIndex] = value;
      container[asset.field] = list;
    };

    if (asset.source === "dynasty") {
      const target = nextDynasty[asset.dynastyIndex]?.images;
      if (!target) return;
      if (asset.imageIndex == null) setSingle(target);
      else setArray(target);
      return;
    }

    if (asset.source === "detailed") {
      const target = nextDetailed[asset.dynastyIndex]?.images;
      if (!target) return;
      if (asset.imageIndex == null) setSingle(target);
      else setArray(target);
      return;
    }

    const target =
      nextDetailed[asset.dynastyIndex]?.kings?.[asset.kingIndex]?.images;
    if (!target) return;
    if (asset.imageIndex == null) setSingle(target);
    else setArray(target);
  };

  const renameHistoryImage = async (oldPath, newName) => {
    const response = await fetch("/api/history/admin/images/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ oldPath, newName }),
    });
    if (!response.ok) throw new Error("Không thể đổi tên ảnh");
    const payload = await response.json();
    return payload.newPath;
  };

  const handleAddAsset = () => {
    setModalTitle("Thêm ảnh");
    setModalSubtitle("Chọn nhóm dữ liệu và tải ảnh lên");
    setModalContent(
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nhóm</label>
          <select className="form-select" id="assetSource">
            <option value="dynasty">Danh sách triều đại</option>
            <option value="detailed">Chi tiết triều đại</option>
            <option value="character">Nhân vật</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Triều đại</label>
          <select className="form-select" id="assetDynasty">
            {detailedData.map((d, idx) => (
              <option key={d.name + idx} value={idx}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Nhân vật (nếu có)</label>
          <input
            className="form-input"
            id="assetCharacter"
            placeholder="0, 1, 2... (chỉ số nhân vật)"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Trường ảnh</label>
          <input
            className="form-input"
            id="assetField"
            placeholder="banner/map/portrait..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tải tệp ảnh</label>
          <input
            className="form-input"
            type="file"
            id="assetFile"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Hoặc URL ảnh</label>
          <input
            className="form-input"
            id="assetUrl"
            placeholder="/api/history/images/..."
          />
        </div>
      </div>,
    );
    setModalOpen(true);

    window.handleModalSave = async () => {
      try {
        const source = readValue("assetSource") || "dynasty";
        const dynastyIndex =
          Number.parseInt(readValue("assetDynasty"), 10) || 0;
        const fieldInput = (readValue("assetField") || "").trim();
        const field =
          fieldInput || ASSET_FIELD_OPTIONS[source]?.[0] || "banner";
        const kingIndex = Number.parseInt(readValue("assetCharacter"), 10);
        const file = document.getElementById("assetFile")?.files?.[0];
        let url = (readValue("assetUrl") || "").trim();

        if (file) {
          const folder = getFolderByField(field, source);
          url = await uploadHistoryImage(file, folder, field);
        }

        if (!url) {
          window.showToast("Vui lòng nhập URL hoặc chọn file", "warning");
          return;
        }

        const nextDetailed = structuredClone(detailedData);
        const nextDynasty = structuredClone(dynastyData);
        writeAssetPath(
          nextDetailed,
          nextDynasty,
          { source, dynastyIndex, kingIndex, field, imageIndex: null },
          url,
        );
        updateDetailedData(nextDetailed);
        updateDynastyData(nextDynasty);
        await saveAllData({
          detailedData: nextDetailed,
          dynastyData: nextDynasty,
        });
        setModalOpen(false);
        window.showToast("Đã thêm ảnh", "success");
      } catch (error) {
        window.showToast(error.message || "Không thể thêm ảnh", "error");
      }
    };
  };

  const handleEditAsset = (asset) => {
    setModalTitle("Sửa ảnh");
    setModalSubtitle(asset.label);
    setModalContent(
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Đường dẫn hiện tại</label>
          <input
            className="form-input"
            id="assetUrl"
            defaultValue={asset.url || ""}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Thay bằng file mới</label>
          <input
            className="form-input"
            type="file"
            id="assetFile"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Đổi tên file (không gồm đuôi)</label>
          <input
            className="form-input"
            id="assetRename"
            placeholder="ten-file-moi"
          />
        </div>
      </div>,
    );
    setModalOpen(true);

    window.handleModalSave = async () => {
      try {
        const file = document.getElementById("assetFile")?.files?.[0];
        let url = (readValue("assetUrl") || "").trim();
        if (file) {
          const folder = getFolderByField(asset.field, asset.source);
          url = await uploadHistoryImage(file, folder, asset.field);
        }
        const rename = (readValue("assetRename") || "").trim();
        if (rename && url?.startsWith("/api/history/images/")) {
          url = await renameHistoryImage(url, rename);
        }

        const nextDetailed = structuredClone(detailedData);
        const nextDynasty = structuredClone(dynastyData);
        writeAssetPath(nextDetailed, nextDynasty, asset, url);
        updateDetailedData(nextDetailed);
        updateDynastyData(nextDynasty);
        await saveAllData({
          detailedData: nextDetailed,
          dynastyData: nextDynasty,
        });
        setModalOpen(false);
        window.showToast("Đã cập nhật ảnh", "success");
      } catch (error) {
        window.showToast(error.message || "Không thể cập nhật ảnh", "error");
      }
    };
  };

  const handleDeleteAsset = async (asset) => {
    if (!confirm("Xóa liên kết ảnh này?")) return;
    const nextDetailed = structuredClone(detailedData);
    const nextDynasty = structuredClone(dynastyData);

    if (asset.imageIndex == null) {
      writeAssetPath(nextDetailed, nextDynasty, asset, "");
    } else {
      const target =
        asset.source === "dynasty"
          ? nextDynasty[asset.dynastyIndex]?.images
          : asset.source === "detailed"
            ? nextDetailed[asset.dynastyIndex]?.images
            : nextDetailed[asset.dynastyIndex]?.kings?.[asset.kingIndex]
                ?.images;
      if (target?.[asset.field] && Array.isArray(target[asset.field])) {
        target[asset.field] = target[asset.field].filter(
          (_, idx) => idx !== asset.imageIndex,
        );
      }
    }

    updateDetailedData(nextDetailed);
    updateDynastyData(nextDynasty);
    await saveAllData({ detailedData: nextDetailed, dynastyData: nextDynasty });
    window.showToast("Đã xóa ảnh", "warning");
  };

  // Render helpers
  const getStats = () => {
    const charactersForStats = allCharacters;
    return [
      {
        icon: "fa-landmark",
        value: dynastyData.length,
        label: "Triều đại",
        color: "#ef4444",
      },
      {
        icon: "fa-user-tie",
        value: charactersForStats.length,
        label: "Nhân vật",
        color: "#3b82f6",
      },
      {
        icon: "fa-timeline",
        value: charactersForStats.filter((c) => c.hasTimeline).length,
        label: "Có timeline",
        color: "#16a34a",
      },
      {
        icon: "fa-exclamation-circle",
        value: charactersForStats.filter(
          (c) => !c.hasTimeline || !c.hasOverview,
        ).length,
        label: "Cần cập nhật",
        color: "#d97706",
      },
    ];
  };

  const getViewContent = () => {
    switch (currentView) {
      case "dynasties":
        return (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,.06)",
            }}
          >
            <DynastyManager
              dynastyData={dynastyData}
              matchedIndexes={matchedDynastyIndexes}
              detailedData={detailedData}
              onAdd={handleAddDynasty}
              onEdit={handleEditDynasty}
              onDelete={handleDeleteDynasty}
            />
          </div>
        );
      case "characters":
        return (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,.06)",
            }}
          >
            <CharacterManager
              characters={allCharacters}
              matchedCharacterKeys={matchedCharacterKeys}
              searchQuery={searchQuery}
              onAdd={handleAddCharacter}
              onEditTimeline={handleEditCharacterTimeline}
              onEditInfo={handleEditCharacterInfo}
              onDelete={handleDeleteCharacter}
            />
          </div>
        );
      case "calendar-events":
        return (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,.06)",
            }}
          >
            <CalendarEventManager
              events={calendarData}
              searchQuery={searchQuery}
              onAdd={handleAddCalendarEvent}
              onEdit={handleEditCalendarEvent}
              onDelete={handleDeleteCalendarEvent}
            />
          </div>
        );
      case "culture":
        return <PlaceholderView title="văn hóa" />;
      case "maps":
        return <PlaceholderView title="bản đồ" />;
      case "assets":
        return <PlaceholderView title="thư viện ảnh" />;
      case "settings":
        return (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              padding: "24px",
            }}
          >
            <SettingsView
              isDarkMode={isDarkMode}
              onSetTheme={handleSetTheme}
              onSaveAll={handleSaveCurrentView}
              onExport={() =>
                exportData(detailedData, dynastyData, calendarData)
              }
              onReset={handleResetData}
            />
          </div>
        );
      default:
        return <PlaceholderView title="không xác định" />;
    }
  };

  const getViewConfig = () => {
    const configs = {
      dynasties: {
        title: "Quản lý Triều đại",
        desc: "Thêm, sửa, xóa thông tin các triều đại trong lịch sử Việt Nam",
        bc: "Triều đại",
      },
      characters: {
        title: "Quản lý Nhân vật",
        desc: "Quản lý thông tin, timeline và di sản của các nhân vật lịch sử",
        bc: "Nhân vật",
      },
      culture: {
        title: "Văn hóa & Di sản",
        desc: "Quản lý thông tin văn hóa, hiện vật và di sản",
        bc: "Văn hóa",
      },
      maps: {
        title: "Bản đồ Lịch sử",
        desc: "Quản lý bản đồ qua các thời kỳ lịch sử",
        bc: "Bản đồ",
      },
      assets: {
        title: "Thư viện Ảnh",
        desc: "Quản lý hình ảnh, media và tài nguyên",
        bc: "Thư viện ảnh",
      },
      settings: {
        title: "Cài đặt Hệ thống",
        desc: "Cấu hình ứng dụng, theme và dữ liệu",
        bc: "Cài đặt",
      },
    };
    return configs[currentView] || configs.dynasties;
  };

  const viewConfig = getViewConfig();

  if (isLoading) {
    return (
      <div className="admin-layout">
        <div className="flex-1 flex items-center justify-center">
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                gap: "8px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: "var(--accent-color)",
                  borderRadius: "50%",
                  animation: "bounce 1s infinite",
                }}
              ></div>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: "var(--accent-color)",
                  borderRadius: "50%",
                  animation: "bounce 1s infinite .15s",
                }}
              ></div>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: "var(--accent-color)",
                  borderRadius: "50%",
                  animation: "bounce 1s infinite .3s",
                }}
              ></div>
            </div>
            <p style={{ color: "var(--text-sub)" }}>Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  // Add bounce animation keyframes
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div className="admin-layout">
      <Sidebar
        currentView={currentView}
        onSwitchView={handleSwitchView}
        dynastyCount={dynastyData.length}
        characterCount={allCharacters.length}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => {
          setIsSidebarCollapsed(!isSidebarCollapsed);
          localStorage.setItem("sidebarCollapsed", !isSidebarCollapsed);
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <button
        className="mobile-toggle-btn lg:hidden"
        onClick={() => setIsMobileSidebarOpen(true)}
        aria-label="Menu"
      >
        <i className="fa-solid fa-bars text-xl"></i>
      </button>

      <main className="main-admin" id="mainContent">
        <AdminHeader
          title={viewConfig.title}
          description={viewConfig.desc}
          breadcrumb={viewConfig.bc}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onClearSearch={() => setSearchQuery("")}
          onAddNew={handleAddNew}
          onSaveAll={handleSaveCurrentView}
          onExport={() => exportData(detailedData, dynastyData, calendarData)}
          stats={getStats()}
        />

        <div className="content-area" id="contentArea">
          {getViewContent()}
        </div>
      </main>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        subtitle={modalSubtitle}
      >
        {modalContent}
        <div className="modal-footer" style={{ marginTop: "24px" }}>
          <button
            onClick={() => setModalOpen(false)}
            className="btn btn-secondary"
          >
            <i className="fa-solid fa-xmark"></i>
            <span>Hủy bỏ</span>
          </button>
          <button
            onClick={() => {
              if (window.handleModalSave) {
                window.handleModalSave();
                delete window.handleModalSave;
              }
            }}
            className="btn btn-primary"
          >
            <i className="fa-solid fa-check"></i>
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </Modal>

      <ImagePreview
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
      />

      <ToastContainer />
    </div>
  );
};
