const formatDateLabel = (date) => {
  if (!date) return "";
  if (date.display) return date.display;
  const day = Number(date.day) || 0;
  const month = Number(date.month) || 0;
  const year = date.year == null ? 0 : Number(date.year) || 0;
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

const DATE_LABEL = (event) => {
  const solarLabel = formatDateLabel(event?.solar_date);
  const lunarLabel = formatDateLabel(event?.lunar_date);
  if (solarLabel && lunarLabel)
    return `Dương: ${solarLabel} / Âm: ${lunarLabel}`;
  if (solarLabel) return solarLabel;
  if (lunarLabel) return lunarLabel;
  return formatDateLabel(event?.date);
};
export const CalendarEventManager = ({
  events = [],
  searchQuery = "",
  onAdd,
  onEdit,
  onDelete,
}) => {
  const q = String(searchQuery || "")
    .trim()
    .toLowerCase();
  const filtered = (
    !q
      ? events
      : events.filter((event) =>
          [
            event.title,
            event.category,
            event.related_dynasty,
            event.related_king,
            DATE_LABEL(event),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
  ).map((event) => ({ event, originalIndex: events.indexOf(event) }));

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>Sự kiện niên biểu</h3>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Tiêu đề
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Loại
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Ngày
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Liên kết
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "10px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ event, originalIndex }, idx) => (
              <tr key={event.id || originalIndex || idx}>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  {event.title}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  {event.category || "-"}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  {DATE_LABEL(event) || "-"}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  {[event.related_dynasty, event.related_king]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid var(--border-color)",
                    textAlign: "right",
                  }}
                >
                  <button
                    className="btn btn-icon"
                    onClick={() => onEdit(originalIndex)}
                    title="Sửa"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button
                    className="btn btn-icon"
                    onClick={() => onDelete(originalIndex)}
                    title="Xóa"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--text-sub)",
                  }}
                >
                  Không có sự kiện phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
