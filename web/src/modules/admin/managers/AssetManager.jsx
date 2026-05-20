import { useEffect, useMemo, useState } from "react";
import { createFieldHashMapIndex, searchHashMapIndex } from "../utils/searchIndex";
import { getAssetUrl } from "@/shared/utils/asset";

const IMAGE_FIELDS = ["banner", "map", "emblem", "artifacts", "portrait", "statue", "gallery"];

const CATEGORY_LABELS = {
  dynasty: "Dynasty list",
  detailed: "Dynasty detail",
  character: "Character",
};

const GROUP_TITLES = {
  dynasty: "Danh mục triều đại",
  detailed: "Chi tiết triều đại",
  character: "Nhân vật",
};

const isImageField = (key, value) =>
  IMAGE_FIELDS.includes(key) && (typeof value === "string" || Array.isArray(value));

export const collectImageAssets = (dynastyData, detailedData) => {
  const assets = [];

  dynastyData.forEach((dynasty, dynastyIndex) => {
    Object.entries(dynasty.images || {}).forEach(([field, value]) => {
      if (!isImageField(field, value)) return;
      if (Array.isArray(value)) {
        value.forEach((url, imageIndex) =>
          assets.push({ source: "dynasty", label: dynasty.name, dynastyIndex, field, imageIndex, url }),
        );
      } else {
        assets.push({ source: "dynasty", label: dynasty.name, dynastyIndex, field, imageIndex: null, url: value });
      }
    });
  });

  detailedData.forEach((dynasty, dynastyIndex) => {
    Object.entries(dynasty.images || {}).forEach(([field, value]) => {
      if (!isImageField(field, value)) return;
      if (Array.isArray(value)) {
        value.forEach((url, imageIndex) =>
          assets.push({ source: "detailed", label: dynasty.name, dynastyIndex, field, imageIndex, url }),
        );
      } else {
        assets.push({ source: "detailed", label: dynasty.name, dynastyIndex, field, imageIndex: null, url: value });
      }
    });

    (dynasty.kings || []).forEach((king, kingIndex) => {
      Object.entries(king.images || {}).forEach(([field, value]) => {
        if (!isImageField(field, value)) return;
        if (Array.isArray(value)) {
          value.forEach((url, imageIndex) =>
            assets.push({
              source: "character",
              label: `${king.name} - ${dynasty.name}`,
              dynastyIndex,
              kingIndex,
              field,
              imageIndex,
              url,
            }),
          );
        } else {
          assets.push({
            source: "character",
            label: `${king.name} - ${dynasty.name}`,
            dynastyIndex,
            kingIndex,
            field,
            imageIndex: null,
            url: value,
          });
        }
      });
    });
  });

  return assets;
};

export const AssetManager = ({ dynastyData, detailedData, onEdit, onDelete, onAdd, onPreview, searchQuery = "" }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState("all");

  const assets = useMemo(() => collectImageAssets(dynastyData, detailedData), [dynastyData, detailedData]);
  const searchIndex = useMemo(
    () =>
      createFieldHashMapIndex(assets, [
        (asset) => asset.label,
        (asset) => CATEGORY_LABELS[asset.source] || asset.source,
        (asset) => asset.field,
        (asset) => asset.url,
      ]),
    [assets],
  );

  const matchedIds = useMemo(() => searchHashMapIndex(searchIndex, searchQuery), [searchIndex, searchQuery]);
  const filteredAssets = assets.filter((asset, index) => {
    const categoryMatch = activeCategory === "all" || asset.source === activeCategory;
    return categoryMatch && matchedIds.has(index);
  });

  const categories = [
    { id: "all", label: "All", count: assets.length, icon: "fa-folder-open" },
    ...Object.keys(CATEGORY_LABELS).map((source) => ({
      id: source,
      label: CATEGORY_LABELS[source],
      count: assets.filter((asset) => asset.source === source).length,
      icon: source === "character" ? "fa-user-tie" : "fa-landmark",
    })),
  ];

  const groups = useMemo(() => {
    const map = new Map();
    filteredAssets.forEach((asset) => {
      const key = `${asset.source}:${asset.field}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          source: asset.source,
          field: asset.field,
          title: `${GROUP_TITLES[asset.source] || asset.source} · ${asset.field}`,
          items: [],
        });
      }
      map.get(key).items.push(asset);
    });
    return [...map.values()];
  }, [filteredAssets]);

  useEffect(() => {
    if (groups.length > 0 && !groups.some((group) => group.key === expandedGroup)) {
      setExpandedGroup(groups[0].key);
    }
  }, [groups, expandedGroup]);

  return (
    <div className="asset-library">
      <div className="asset-library-header">
        <div>
          <h3>Image Library</h3>
          <p>{filteredAssets.length} / {assets.length} images</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <i className="fa-solid fa-plus"></i>
          <span>Add image</span>
        </button>
      </div>

      <div className="asset-category-grid">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`asset-category ${activeCategory === category.id ? "active" : ""}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <i className={`fa-solid ${category.icon}`}></i>
            <span>{category.label}</span>
            <strong>{category.count}</strong>
          </button>
        ))}
      </div>

      <div className="asset-workspace">
        <div className="asset-group-stack">
          {groups.map((group) => (
            <section key={group.key} className="asset-group-card">
              <button
                className="asset-group-header"
                onClick={() => setExpandedGroup(expandedGroup === group.key ? "" : group.key)}
              >
                <span>{group.title}</span>
                <strong>{group.items.length}</strong>
              </button>

              {expandedGroup === group.key && (
                <div className="asset-grid">
                  {group.items.map((asset, index) => (
                    <button
                      className={`asset-card ${selectedAsset === asset ? "selected" : ""}`}
                      key={`${asset.source}-${asset.dynastyIndex}-${asset.kingIndex || 0}-${asset.field}-${asset.imageIndex || 0}-${index}`}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="asset-preview">
                        {asset.url ? <img src={getAssetUrl(asset.url)} alt="" /> : <i className="fa-solid fa-image"></i>}
                      </div>
                      <div className="asset-meta">
                        <span className="tag tag-primary">{CATEGORY_LABELS[asset.source] || asset.source}</span>
                        <strong>{asset.label}</strong>
                        <small>{asset.url || "No image path yet"}</small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
        <aside className={`asset-edit-panel ${selectedAsset ? "open" : ""}`}>
          {!selectedAsset ? (
            <div className="asset-detail-empty">
              <i className="fa-solid fa-pen-to-square"></i>
              <p>Chọn một item để mở tab chỉnh sửa nhanh</p>
            </div>
          ) : (
            <div className="asset-edit-inner">
              <div className="asset-detail-preview">
                {selectedAsset.url ? <img src={getAssetUrl(selectedAsset.url)} alt="" /> : <i className="fa-solid fa-image"></i>}
              </div>
              <div className="asset-detail-info">
                <h4>{selectedAsset.label}</h4>
                <p>{selectedAsset.field}</p>
                <small>{selectedAsset.url || "No image path yet"}</small>
              </div>
              <div className="asset-actions">
                <button className="btn btn-outline" onClick={() => onPreview(selectedAsset.url)}>View</button>
                <button className="btn btn-outline" onClick={() => onEdit(selectedAsset)}>Edit</button>
                <button className="btn btn-danger" onClick={() => onDelete(selectedAsset)}>Delete</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
