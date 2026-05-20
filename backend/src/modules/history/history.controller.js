import { getAllHistoryData } from './history.service.js';

export const getHistory = async (req, res, next) => {
  try {
    const data = await getAllHistoryData();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
