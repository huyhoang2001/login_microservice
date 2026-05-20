import { useState } from "react";

const EVENT_TYPES = [
  "Quân sự",
  "Chính trị",
  "Văn hóa",
  "Ngoại giao",
  "Tiểu sử",
  "Thành tích",
  "Bi kịch",
  "Khác",
];

const normalizeEventDate = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "0/0/0";
  const parts = raw.split("/").map((p) => p.trim());
  if (parts.length === 3) {
    const [d, m, y] = parts.map((p) => parseInt(p, 10) || 0);
    return `${d}/${m}/${y}`;
  }

  const year = parseInt(raw, 10);
  if (!Number.isNaN(year)) return `0/0/${year}`;
  return "0/0/0";
};

const TimelineEventCard = ({ event, index, onRemove, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate(index, { ...event, [field]: value });
  };

  return (
    <div className="timeline-event-card" id={`eventCard${index}`}>
      <div className="timeline-event-header">
        <span className="timeline-event-number">#{index + 1}</span>
        <button
          onClick={() => onRemove(index)}
          className="timeline-event-remove"
        >
          <i className="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Thời gian (DD/MM/YYYY)</label>
          <input
            type="text"
            className="form-input"
            value={event.year || ""}
            placeholder="0/0/999 hoặc 0/1/999 hoặc 1/2/999"
            onChange={(e) => handleChange("year", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Loại</label>
          <select
            className="form-select"
            value={event.type || "Khác"}
            onChange={(e) => handleChange("type", e.target.value)}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Tiêu đề</label>
        <input
          type="text"
          className="form-input"
          value={event.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Mô tả</label>
        <textarea
          className="form-textarea"
          rows="2"
          value={event.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Tác động</label>
        <input
          type="text"
          className="form-input"
          value={event.impact || ""}
          onChange={(e) => handleChange("impact", e.target.value)}
        />
      </div>
    </div>
  );
};

export const TimelineEditor = ({ king, dynastyName, onSave }) => {
  const [overview, setOverview] = useState(king.overview || "");
  const [legacy, setLegacy] = useState(king.legacy || "");
  const [achievements, setAchievements] = useState(
    (king.achievements || []).join("\n"),
  );
  const [timeline, setTimeline] = useState(king.timeline || []);

  const addEvent = () => {
    setTimeline([
      ...timeline,
      { year: "0/0/0", type: "Khác", title: "", description: "", impact: "" },
    ]);
  };

  const removeEvent = (index) => {
    const card = document.getElementById(`eventCard${index}`);
    if (card) {
      card.style.opacity = "0";
      card.style.transform = "translateX(50px)";
      card.style.transition = "all .3s";
      setTimeout(() => {
        setTimeline(timeline.filter((_, i) => i !== index));
      }, 300);
    } else {
      setTimeline(timeline.filter((_, i) => i !== index));
    }
  };

  const updateEvent = (index, updatedEvent) => {
    const newTimeline = [...timeline];
    newTimeline[index] = updatedEvent;
    setTimeline(newTimeline);
  };

  const handleSave = () => {
    const processedTimeline = timeline
      .filter((ev) => ev.title)
      .map((ev) => ({ ...ev, year: normalizeEventDate(ev.year) }));

    onSave({
      overview,
      legacy,
      achievements: achievements
        .split("\n")
        .map((a) => a.trim())
        .filter((a) => a),
      timeline: processedTimeline,
    });
  };

  return (
    <>
      <div className="form-section">
        <h4 className="form-section-title">
          <i className="fa-solid fa-book"></i> Tổng quan & Di sản
        </h4>
        <div className="form-grid full">
          <div className="form-group">
            <label className="form-label">Overview</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Legacy</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={legacy}
              onChange={(e) => setLegacy(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Achievements (mỗi dòng 1 thành tựu)
            </label>
            <textarea
              className="form-textarea"
              rows="4"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="form-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h4
            className="form-section-title"
            style={{ margin: 0, padding: 0, border: 0 }}
          >
            <i className="fa-solid fa-timeline"></i> Sự kiện Timeline
          </h4>
          <button onClick={addEvent} className="btn btn-outline text-sm">
            <i className="fa-solid fa-plus"></i> Thêm
          </button>
        </div>
        <div id="timelineEventsContainer" className="space-y-4">
          {timeline.length === 0 && (
            <p className="text-sub text-center py-8">Chưa có sự kiện</p>
          )}
          {timeline.map((event, i) => (
            <TimelineEventCard
              key={i}
              event={event}
              index={i}
              onRemove={removeEvent}
              onUpdate={updateEvent}
            />
          ))}
        </div>
      </div>
      <div
        className="modal-footer"
        style={{ marginTop: "24px", padding: "0", borderTop: "none" }}
      >
        <button onClick={handleSave} className="btn btn-primary">
          <i className="fa-solid fa-check"></i>
          <span>Lưu thay đổi</span>
        </button>
      </div>
    </>
  );
};
