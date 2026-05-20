import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/index.js';

const historyDir = path.resolve(config.DATA_DIR, 'history');
const historyImageDir = path.resolve(config.DATA_DIR, '../assets/image_history');

const toLocalHistoryImagePath = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/api/history/images/')) {
    return null;
  }

  const relativePath = value.replace('/api/history/images/', '');
  return path.join(historyImageDir, relativePath);
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const removeMissingImagePaths = async (value) => {
  if (Array.isArray(value)) {
    const items = await Promise.all(value.map(removeMissingImagePaths));
    return items.filter((item) => item !== '');
  }

  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, item]) => [key, await removeMissingImagePaths(item)]),
    );
    return Object.fromEntries(entries);
  }

  const imagePath = toLocalHistoryImagePath(value);
  if (!imagePath) return value;

  return (await fileExists(imagePath)) ? value : '';
};

export const getAllHistoryData = async () => {
  const [detailedRaw, dynastyRaw, calendarRaw] = await Promise.all([
    fs.readFile(path.join(historyDir, 'data_detailed.json'), 'utf-8'),
    fs.readFile(path.join(historyDir, 'data_trieudai.json'), 'utf-8'),
    fs.readFile(path.join(historyDir, 'data_lichnienbieu.json'), 'utf-8')
      .catch(() => fs.readFile(path.join(historyDir, 'data_data_lichnienbieu.json'), 'utf-8'))
      .catch(() => '[]'),
  ]);

  const detailedData = JSON.parse(detailedRaw);
  const dynastyData = JSON.parse(dynastyRaw);

  return {
    detailedData: await removeMissingImagePaths(detailedData),
    dynastyData: await removeMissingImagePaths(dynastyData),
    calendarData: JSON.parse(calendarRaw),
  };
};

export const saveAllHistoryData = async ({ detailedData, dynastyData, calendarData }) => {
  if (!Array.isArray(detailedData) || !Array.isArray(dynastyData) || !Array.isArray(calendarData)) {
    const error = new Error('Du lieu lich su khong hop le');
    error.status = 400;
    throw error;
  }

  await Promise.all([
    fs.writeFile(path.join(historyDir, 'data_detailed.json'), `${JSON.stringify(detailedData, null, 2)}\n`, 'utf-8'),
    fs.writeFile(path.join(historyDir, 'data_trieudai.json'), `${JSON.stringify(dynastyData, null, 2)}\n`, 'utf-8'),
    fs.writeFile(path.join(historyDir, 'data_lichnienbieu.json'), `${JSON.stringify(calendarData, null, 2)}\n`, 'utf-8'),
  ]);
};

export const updateDynasty = async () => null;

export const updateCharacter = async () => null;
