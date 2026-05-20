import { useMemo } from "react";
import {
    createFieldHashMapIndex,
    searchHashMapIndex,
} from "../utils/searchIndex";

export const CharacterManager = ({
  characters,
  matchedCharacterKeys,
  onEditTimeline,
  onEditInfo,
  onDelete,
  onAdd,
  searchQuery = "",
}) => {
  const searchIndex = useMemo(
    () =>
      createFieldHashMapIndex(characters, [
        (character) => character.name,
        (character) => character.dynastyName,
        (character) => character.title,
      ]),
    [characters],
  );
  const matchedIds = useMemo(
    () => searchHashMapIndex(searchIndex, searchQuery),
    [searchIndex, searchQuery],
  );
  const filteredCharacters = characters.filter((character, index) => {
    if (!matchedIds.has(index)) return false;
    if (!matchedCharacterKeys || matchedCharacterKeys.size === 0) return true;
    return matchedCharacterKeys.has(
      `${character.dynastyIndex}-${character.kingIndex}`,
    );
  });

  if (filteredCharacters.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <i className="fa-solid fa-user-tie"></i>
        </div>
        <h3 className="empty-state-title">Chưa có nhân vật</h3>
        <p className="empty-state-desc">Thêm nhân vật mới.</p>
        <button onClick={onAdd} className="btn btn-primary mt-4">
          <i className="fa-solid fa-plus"></i>
          <span>Thêm nhân vật mới</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="table-header">
        <div>#</div>
        <div>Tên nhân vật</div>
        <div>Tước hiệu</div>
        <div>Triều đại</div>
        <div>Trạng thái</div>
        <div>Thao tác</div>
      </div>
      <div className="table-body">
        {filteredCharacters.map((character, idx) => (
          <div
            key={`${character.dynastyIndex}-${character.kingIndex}-${character.name}`}
            className="table-row"
            data-search={`${character.name} ${character.title} ${character.dynastyName}`}
          >
            <div className="row-number">{idx + 1}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>
                {character.name}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-sub)" }}>
                {character.birth_death || "?"}
              </div>
            </div>
            <div>
              <span className="tag tag-primary">{character.title}</span>
            </div>
            <div style={{ fontSize: "14px" }}>{character.dynastyName}</div>
            <div>
              {character.hasTimeline ? (
                <span className="status-badge success">
                  <i
                    className="fa-solid fa-check"
                    style={{ fontSize: "10px" }}
                  ></i>{" "}
                  Timeline
                </span>
              ) : (
                <span className="status-badge warning">
                  <i
                    className="fa-solid fa-clock"
                    style={{ fontSize: "10px" }}
                  ></i>{" "}
                  Thiếu
                </span>
              )}
            </div>
            <div className="row-actions">
              <button
                onClick={() =>
                  onEditTimeline(character.dynastyIndex, character.kingIndex)
                }
                className="row-action-btn edit"
                title="Timeline"
              >
                <i className="fa-solid fa-timeline"></i>
              </button>
              <button
                onClick={() =>
                  onEditInfo(character.dynastyIndex, character.kingIndex)
                }
                className="row-action-btn view"
                title="Sửa thông tin"
              >
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
              <button
                onClick={() =>
                  onDelete(character.dynastyIndex, character.kingIndex)
                }
                className="row-action-btn delete"
                title="Xóa"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
