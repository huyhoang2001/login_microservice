import { useEffect } from "react";
import { createPortal } from "react-dom";
import { getAssetUrl } from "@/shared/utils/asset";

export const Modal = ({ isOpen, onClose, title, subtitle, children }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export const ImagePreview = ({ isOpen, onClose, imageUrl }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="image-preview-container"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={getAssetUrl(imageUrl)} alt="Preview" className="image-preview-img" />
        <div className="image-preview-actions">
          <button onClick={onClose} className="image-preview-close">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <a href={imageUrl} download className="image-preview-download">
            <i className="fa-solid fa-download text-lg"></i>
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
};
