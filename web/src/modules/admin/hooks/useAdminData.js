import { useCallback, useEffect, useState } from 'react';
import { authAPI } from '@/shared/api/auth';

const STORAGE_KEY = 'adminData';

const SAMPLE_DYNASTY_DATA = [
  {
    name: "Nhà Ngô",
    period: "939 - 967",
    description: "Chấm dứt hơn 1000 năm Bắc thuộc sau chiến thắng Bạch Đằng năm 938, mở ra kỷ nguyên độc lập.",
    king_count: 4,
    capital: "Cổ Loa (Hà Nội)",
    start_year: 939,
    tag: "Phục Hồi",
    images: { banner: "", map: "", emblem: "" },
    cultural_highlights: []
  }
];

const SAMPLE_DETAILED_DATA = [
  {
    name: "Nhà Ngô",
    period: "939 - 967",
    images: { banner: "", map: "", artifacts: [] },
    kings: [
      {
        name: "Ngô Quyền",
        title: "Tiền Ngô Vương",
        birth_death: "898 - 944",
        reign: "939 - 944",
        summary: "Người anh hùng dân tộc với chiến thắng Bạch Đằng năm 938, chấm dứt thời kỳ Bắc thuộc.",
        images: { portrait: "", statue: "", gallery: [] },
        overview: "",
        timeline: [],
        achievements: [],
        legacy: ""
      }
    ]
  }
];

const MOJIBAKE_MARKERS = ["Ã", "Â", "Ä", "Æ", "á»", "áº", "â", "ðŸ"];

const fixMojibakeText = (value) => {
  if (typeof value !== "string") return value;
  if (!MOJIBAKE_MARKERS.some((marker) => value.includes(marker))) return value;

  try {
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(
      Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff),
    );
    return repaired.includes("�") ? value : repaired;
  } catch {
    return value;
  }
};

const normalizeMojibake = (value) => {
  if (Array.isArray(value)) return value.map(normalizeMojibake);
  if (value && typeof value === "object") {
    const out = {};
    Object.entries(value).forEach(([key, val]) => {
      out[key] = normalizeMojibake(val);
    });
    return out;
  }
  return fixMojibakeText(value);
};

export const useAdminData = () => {
  const [detailedData, setDetailedData] = useState([]);
  const [dynastyData, setDynastyData] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [dataModified, setDataModified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sanitizeData = useCallback((data) => {
    const sanitized = [...data];
    sanitized.forEach(d => {
      if (!d.images) d.images = { banner: '', map: '', artifacts: [] };
      if (d.kings) {
        d.kings.forEach(k => {
          if (!k.timeline) k.timeline = [];
          if (!k.overview) k.overview = '';
          if (!k.legacy) k.legacy = '';
          if (!k.achievements) k.achievements = [];
          if (!k.images) k.images = { portrait: '', statue: '', gallery: [] };
        });
      }
    });
    return sanitized;
  }, []);

  const sanitizeDynastyData = useCallback((data) => {
    const sanitized = [...data];
    sanitized.forEach(d => {
      if (!d.images) d.images = { banner: '', map: '', emblem: '' };
      if (!d.cultural_highlights) d.cultural_highlights = [];
    });
    return sanitized;
  }, []);

  const loadSavedData = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.detailedData) {
          setDetailedData(sanitizeData(normalizeMojibake(parsed.detailedData)));
        }
        if (parsed.dynastyData) {
          setDynastyData(sanitizeDynastyData(normalizeMojibake(parsed.dynastyData)));
        }
        if (parsed.calendarData) setCalendarData(normalizeMojibake(parsed.calendarData));
        if (parsed.uploadedImages) setUploadedImages(normalizeMojibake(parsed.uploadedImages));
        setDataModified(true);
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, [sanitizeData, sanitizeDynastyData]);

  const loadSampleData = useCallback(() => {
    setDynastyData(sanitizeDynastyData(SAMPLE_DYNASTY_DATA));
    setDetailedData(sanitizeData(SAMPLE_DETAILED_DATA));
    setDataModified(true);
  }, [sanitizeData, sanitizeDynastyData]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { detailedData: detailed, dynastyData: dynasty, calendarData: calendar } =
        await authAPI.request('/history/admin/data');

      setDetailedData(sanitizeData(normalizeMojibake(detailed)));
      setDynastyData(sanitizeDynastyData(normalizeMojibake(dynasty)));
      setCalendarData(normalizeMojibake(Array.isArray(calendar) ? calendar : []));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      loadSampleData();
      setIsLoading(false);
    }
  }, [sanitizeData, sanitizeDynastyData, loadSampleData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAllCharacters = useCallback(() => {
    const characters = [];
    detailedData.forEach((d, di) => {
      if (d.kings) {
        d.kings.forEach((k, ki) => {
          characters.push({
            ...k,
            dynastyName: d.name,
            dynastyIndex: di,
            kingIndex: ki,
            hasTimeline: k.timeline && k.timeline.length > 0,
            hasOverview: k.overview && k.overview.length > 0
          });
        });
      }
    });
    return characters;
  }, [detailedData]);

  const saveAllData = useCallback(async (nextData = {}) => {
    const dataToSave = {
      detailedData: normalizeMojibake(nextData.detailedData || detailedData),
      dynastyData: normalizeMojibake(nextData.dynastyData || dynastyData),
      calendarData: normalizeMojibake(nextData.calendarData || calendarData),
      uploadedImages: normalizeMojibake(nextData.uploadedImages || uploadedImages),
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      await authAPI.request('/history/admin/data', {
        method: 'PUT',
        body: JSON.stringify({
          detailedData: dataToSave.detailedData,
          dynastyData: dataToSave.dynastyData,
          calendarData: dataToSave.calendarData,
        }),
      });

      window.dispatchEvent(new CustomEvent('historyDataUpdated', {
        detail: {
          detailedData: dataToSave.detailedData,
          dynastyData: dataToSave.dynastyData,
          calendarData: dataToSave.calendarData
        }
      }));

      setDataModified(true);
      return true;
    } catch (e) {
      console.error('Error saving data:', e);
      return false;
    }
  }, [detailedData, dynastyData, calendarData, uploadedImages]);

  const updateDynastyData = useCallback((newData) => {
    setDynastyData(sanitizeDynastyData(normalizeMojibake(newData)));
    setDataModified(true);
  }, [sanitizeDynastyData]);

  const updateDetailedData = useCallback((newData) => {
    setDetailedData(sanitizeData(normalizeMojibake(newData)));
    setDataModified(true);
  }, [sanitizeData]);

  const updateCalendarData = useCallback((newData) => {
    setCalendarData(normalizeMojibake(Array.isArray(newData) ? newData : []));
    setDataModified(true);
  }, []);

  const updateKingsCount = useCallback(() => {
    const updatedDynasty = dynastyData.map(dyn => {
      const detailed = detailedData.find(dd => dd.name === dyn.name);
      return { ...dyn, king_count: detailed?.kings?.length || 0 };
    });
    setDynastyData(updatedDynasty);
  }, [dynastyData, detailedData]);

  return {
    detailedData,
    dynastyData,
    calendarData,
    uploadedImages,
    dataModified,
    isLoading,
    getAllCharacters,
    saveAllData,
    reloadData: fetchData,
    updateDynastyData,
    updateDetailedData,
    updateCalendarData,
    updateKingsCount,
    setUploadedImages
  };
};
