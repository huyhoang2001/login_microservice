import { getAllHistoryData, saveAllHistoryData } from './admin.service.js';

export const getAdminData = async (req, res, next) => {
  try {
    const data = await getAllHistoryData();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const saveAdminData = async (req, res, next) => {
  try {
    await saveAllHistoryData(req.body || {});
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const saveCalendarEvents = async (req, res, next) => {
  try {
    const current = await getAllHistoryData();
    const { calendarData, mode = 'overwrite' } = req.body || {};
    if (!Array.isArray(calendarData)) {
      const error = new Error('calendarData khong hop le');
      error.status = 400;
      throw error;
    }
    if (mode !== 'overwrite') {
      const error = new Error('mode khong hop le');
      error.status = 400;
      throw error;
    }

    await saveAllHistoryData({
      detailedData: current.detailedData,
      dynastyData: current.dynastyData,
      calendarData,
    });
    res.json({ success: true, mode, count: calendarData.length });
  } catch (error) {
    next(error);
  }
};
