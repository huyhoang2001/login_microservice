const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getAssetUrl = (relativePath) => {
  if (!relativePath) return '/placeholder-image.png';
  if (relativePath.startsWith('http')) return relativePath;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${API_URL}/${cleanPath}`;
};
