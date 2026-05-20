import { useMemo } from "react";
import {
    createFieldHashMapIndex,
    searchHashMapIndex,
} from "../utils/searchIndex";

export const DynastyManager = ({
  dynastyData,
  detailedData,
  matchedIndexes,
  onDelete,
  onEdit,
  onAdd,
  searchQuery = "",
}) => {
  const searchIndex = useMemo(
    () =>
      createFieldHashMapIndex(dynastyData, [
        (dynasty) => dynasty.name,
        (dynasty) => dynasty.tag,
        (dynasty) => dynasty.period,
      ]),
    [dynastyData],
  );
  const matchedIds = useMemo(
    () => searchHashMapIndex(searchIndex, searchQuery),
    [searchIndex, searchQuery],
  );
  const filteredData = dynastyData.filter((_, index) => {
    if (!matchedIds.has(index)) return false;
    if (!matchedIndexes || matchedIndexes.size === 0) return true;
    return matchedIndexes.has(index);
  });

  if (filteredData.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <i className="fa-solid fa-landmark"></i>
        </div>
        <h3 className="empty-state-title">Chưa có triều đại</h3>
        <p className="empty-state-desc">Thêm triều đại đầu tiên.</p>
        <button onClick={onAdd} className="btn btn-primary mt-4">
          <i className="fa-solid fa-plus"></i>
          <span>Thêm triều đại mới</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="table-header">
        <div>#</div>
        <div>Tên triều đại</div>
        <div>Thời kỳ</div>
        <div>Kinh đô</div>
        <div>Đời vua</div>
        <div>Thao tác</div>
      </div>
      <div className="table-body">
        {filteredData.map((dynasty, idx) => {
          const originalIndex = dynastyData.indexOf(dynasty);
          const detailed = detailedData.find(
            (item) => item.name === dynasty.name,
          );
          const kingCount = detailed?.kings?.length || dynasty.king_count || 0;

          return (
            <div
              key={`${dynasty.name}-${originalIndex}`}
              className="table-row"
              data-search={`${dynasty.name} ${dynasty.period} ${dynasty.capital} ${dynasty.tag || ""}`}
            >
              <div className="row-number">{idx + 1}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>
                  {dynasty.name}
                </div>
                <span className="tag tag-primary" style={{ marginTop: "4px" }}>
                  {dynasty.tag || "N/A"}
                </span>
              </div>
              <div style={{ fontSize: "14px" }}>{dynasty.period}</div>
              <div style={{ fontSize: "14px" }}>{dynasty.capital}</div>
              <div>
                <span className="status-badge success">
                  <i
                    className="fa-solid fa-crown"
                    style={{ fontSize: "10px" }}
                  ></i>{" "}
                  {kingCount} đời
                </span>
              </div>
              <div className="row-actions">
                <button
                  onClick={() => onEdit(originalIndex)}
                  className="row-action-btn edit"
                  title="Sửa"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  onClick={() => onDelete(originalIndex)}
                  className="row-action-btn delete"
                  title="Xóa"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
