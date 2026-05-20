export const PlaceholderView = ({ title }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <i className="fa-solid fa-tools"></i>
      </div>
      <h3 className="empty-state-title">
        {title.charAt(0).toUpperCase() + title.slice(1)}
      </h3>
      <p className="empty-state-desc">Đang phát triển...</p>
    </div>
  );
};
