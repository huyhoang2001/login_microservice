import React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import "../styles/history.css";
const f = React;
const e = { jsx, jsxs };
const ne = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s_-]+/g, " ")
      .trim(),
  Q = (s) => ne(s).split(/\s+/).filter(Boolean),
  P = (s, r) => {
    const i = new Map(),
      l = new Set();
    return (
      s.forEach((o, c) => {
        (l.add(c),
          r.forEach((x, d) => {
            new Set(Q(x(o))).forEach((h) => {
              const t = `${d}:${h}`;
              (i.has(t) || i.set(t, new Set()), i.get(t).add(c));
            });
          }));
      }),
      { allIds: l, tokenMap: i }
    );
  },
  R = (s, r) => {
    const i = Q(r);
    if (i.length === 0) return s.allIds;
    let l = null;
    return (
      i.forEach((o) => {
        const c = new Set();
        (s.tokenMap.forEach((x, d) => {
          (d.includes(":") ? d.slice(d.indexOf(":") + 1) : d).includes(o) &&
            x.forEach((h) => c.add(h));
        }),
          l === null ? (l = c) : (l = new Set([...l].filter((x) => c.has(x)))));
      }),
      l || new Set()
    );
  },
  U = (s) => {
    const r = (s == null ? void 0 : s.date) || {},
      i = r.year == null ? 0 : Number.parseInt(r.year, 10) || 0,
      l = Number.parseInt(r.month, 10) || 0;
    return { day: Number.parseInt(r.day, 10) || 0, month: l, year: i };
  },
  ie = (s, r) => {
    const { month: i, year: l } = U(s),
      o = String((s == null ? void 0 : s.recurring_type) || "").toLowerCase();
    if (!l) return !0;
    const c = r.getFullYear(),
      x = r.getMonth() + 1;
    return o === "annual" || o === "lunar_annual"
      ? !i || i === x
      : l !== c
        ? !1
        : i
          ? i === x
          : !0;
  },
  le = (s, r) => {
    const { day: i, month: l, year: o } = U(s),
      c = String((s == null ? void 0 : s.recurring_type) || "").toLowerCase();
    return !(
      !r ||
      (c !== "annual" && c !== "lunar_annual" && o && o !== r.year) ||
      (l && l !== r.month) ||
      (i && i !== r.day)
    );
  },
  A = ["#b91c1c", "#1d4ed8", "#15803d", "#b45309", "#7c3aed", "#0891b2"],
  ce = {
    "Quân sự": "fa-solid fa-shield-halved",
    "Chính trị": "fa-solid fa-scroll",
    "Văn hóa": "fa-solid fa-book-open",
    "Ngoại giao": "fa-solid fa-handshake",
    "Thành tích": "fa-solid fa-trophy",
    "Bi kịch": "fa-solid fa-heart-crack",
    "Tiểu sử": "fa-solid fa-user",
    Khác: "fa-solid fa-circle",
  },
  re = {
    "Quân sự": "#dc2626",
    "Chính trị": "#7c3aed",
    "Văn hóa": "#0891b2",
    "Ngoại giao": "#16a34a",
    "Thành tích": "#d97706",
    "Bi kịch": "#6b7280",
    "Tiểu sử": "#2563eb",
    Khác: "#6b7280",
  };
const INT = (d) => Math.floor(d);
const jdFromDate = (dd, mm, yy) => {
  const a = INT((14 - mm) / 12),
    y = yy + 4800 - a,
    m = mm + 12 * a - 3;
  let jd =
    dd +
    INT((153 * m + 2) / 5) +
    365 * y +
    INT(y / 4) -
    INT(y / 100) +
    INT(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }
  return jd;
};
const getNewMoonDay = (k, timeZone) => {
  const T = k / 1236.85,
    T2 = T * T,
    T3 = T2 * T,
    dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3,
    Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3,
    F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  const C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * dr * M) -
    0.4068 * Math.sin(Mpr * dr) +
    0.0161 * Math.sin(2 * dr * Mpr) -
    0.0004 * Math.sin(3 * dr * Mpr) +
    0.0104 * Math.sin(2 * dr * F) -
    0.0051 * Math.sin((M + Mpr) * dr) -
    0.0074 * Math.sin((M - Mpr) * dr) +
    0.0004 * Math.sin((2 * F + M) * dr) -
    0.0004 * Math.sin((2 * F - M) * dr) -
    0.0006 * Math.sin((2 * F + Mpr) * dr) +
    0.001 * Math.sin((2 * F - Mpr) * dr) +
    0.0005 * Math.sin((2 * Mpr + M) * dr);
  const deltat =
    T < -11
      ? 0.001 +
        0.000839 * T +
        0.0002261 * T2 -
        0.00000845 * T3 -
        0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return INT(Jd1 + C1 - deltat + 0.5 + timeZone / 24);
};
const getSunLongitude = (jdn, timeZone) => {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525,
    T2 = T * T,
    dr = Math.PI / 180,
    M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2,
    L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2,
    DL =
      (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * dr * M) +
      0.00029 * Math.sin(3 * dr * M);
  let L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * INT(L / (Math.PI * 2));
  return INT((L / Math.PI) * 6);
};
const getLunarMonth11 = (yy, timeZone) => {
  const off = jdFromDate(31, 12, yy) - 2415021,
    k = INT(off / 29.530588853),
    nm = getNewMoonDay(k, timeZone),
    sunLong = getSunLongitude(nm, timeZone);
  return sunLong >= 9 ? getNewMoonDay(k - 1, timeZone) : nm;
};
const getLeapMonthOffset = (a11, timeZone) => {
  const k = INT((a11 - 2415021.076998695) / 29.530588853);
  let last = 0,
    i = 1,
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i += 1;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
};
const getVietnameseLunarDate = (dd, mm, yy) => {
  const timeZone = 7,
    dayNumber = jdFromDate(dd, mm, yy),
    k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
  let a11 = getLunarMonth11(yy, timeZone),
    b11 = a11,
    lunarYear;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1,
    diff = INT((monthStart - a11) / 29);
  let lunarLeap = false,
    lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
};
const lunarMonthColors = [
  "#dc2626",
  "#d97706",
  "#ca8a04",
  "#65a30d",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#c026d3",
  "#db2777",
  "#e11d48",
];
const getLunarMonthColor = (month) =>
  lunarMonthColors[(Math.max(1, month) - 1) % lunarMonthColors.length];
const formatLunarDate = (date) =>
  date.day === 1 ? `1/${date.month}${date.leap ? "N" : ""}` : `${date.day}`;

const isLunarEvent = (event) => {
  const recurringType = String(event?.recurring_type || "").toLowerCase();
  const calendarType = String(
    event?.calendar_type || event?.date?.calendar_type || "",
  ).toLowerCase();
  return (
    event?.date?.lunar === true ||
    !!event?.lunar_date ||
    recurringType.includes("lunar") ||
    calendarType === "lunar"
  );
};
const getNativeEventDate = (event) => {
  if (isLunarEvent(event)) return event?.lunar_date || event?.date || {};
  return event?.solar_date || event?.date || {};
};

/**
 * Convert lunar date to solar (gregorian) calendar for the given year
 * Uses the existing getVietnameseLunarDate function to find the matching solar date
 * by checking dates in the expected month range
 */
const getLunarToSolarDate = (lunarDay, lunarMonth, year) => {
  if (!year || !lunarMonth || !lunarDay) {
    return { day: 0, month: 0, year: 0 };
  }

  const refYear = year || new Date().getFullYear();

  // Map lunar month to approximate solar month range
  // Lunar calendar is typically 29-30 days, offset from solar by ~1 month
  const monthRanges = [
    { lunar: 1, solarMonthStart: 1, solarMonthEnd: 2 }, // Lunar 1 -> Solar Jan-Feb
    { lunar: 2, solarMonthStart: 2, solarMonthEnd: 3 }, // Lunar 2 -> Solar Feb-Mar
    { lunar: 3, solarMonthStart: 3, solarMonthEnd: 4 }, // Lunar 3 -> Solar Mar-Apr (e.g., 10/3 lunar = ~4/26 solar)
    { lunar: 4, solarMonthStart: 4, solarMonthEnd: 5 }, // Lunar 4 -> Solar Apr-May
    { lunar: 5, solarMonthStart: 5, solarMonthEnd: 6 }, // Lunar 5 -> Solar May-Jun
    { lunar: 6, solarMonthStart: 6, solarMonthEnd: 7 }, // Lunar 6 -> Solar Jun-Jul
    { lunar: 7, solarMonthStart: 7, solarMonthEnd: 8 }, // Lunar 7 -> Solar Jul-Aug
    { lunar: 8, solarMonthStart: 8, solarMonthEnd: 9 }, // Lunar 8 -> Solar Aug-Sep
    { lunar: 9, solarMonthStart: 9, solarMonthEnd: 10 }, // Lunar 9 -> Solar Sep-Oct
    { lunar: 10, solarMonthStart: 10, solarMonthEnd: 11 }, // Lunar 10 -> Solar Oct-Nov
    { lunar: 11, solarMonthStart: 11, solarMonthEnd: 12 }, // Lunar 11 -> Solar Nov-Dec
    { lunar: 12, solarMonthStart: 12, solarMonthEnd: 1 }, // Lunar 12 -> Solar Dec-Jan (next year)
  ];

  const range = monthRanges.find((r) => r.lunar === lunarMonth);
  if (!range) {
    // Fallback conversion
    return {
      day: Math.min(lunarDay, 28),
      month: (lunarMonth % 12) + 1,
      year: refYear,
    };
  }

  // Search for the solar date that corresponds to this lunar date
  // Check dates in the month range
  const searchMonths = [range.solarMonthStart, range.solarMonthEnd];
  for (let m = 0; m < searchMonths.length; m++) {
    let searchMonth = searchMonths[m];
    let yearForSearch = refYear;

    // Handle year overflow for month 1 when lunar month is 12
    if (searchMonth === 1 && range.lunar === 12) {
      yearForSearch = refYear + 1;
    }
    if (searchMonth > 12) {
      searchMonth = searchMonth - 12;
      yearForSearch = refYear + 1;
    }

    // Get the number of days in this month
    const daysInMonth = new Date(yearForSearch, searchMonth, 0).getDate();

    // Check each day in this month to find the lunar match
    for (let solarDay = 1; solarDay <= daysInMonth; solarDay++) {
      const convertedLunar = getVietnameseLunarDate(
        solarDay,
        searchMonth,
        yearForSearch,
      );

      // Check if this solar date converts to our target lunar date
      if (
        convertedLunar.day === lunarDay &&
        convertedLunar.month === lunarMonth
      ) {
        return {
          day: solarDay,
          month: searchMonth,
          year: yearForSearch,
        };
      }
    }
  }

  // If no exact match found in the range, return an approximation
  // Lunar 3, day 10 -> approximately solar 4, day 26
  const approximateMonths = {
    1: 2,
    2: 3,
    3: 4,
    4: 5,
    5: 6,
    6: 7,
    7: 8,
    8: 9,
    9: 10,
    10: 11,
    11: 12,
    12: 1,
  };
  const approxSolarMonth = approximateMonths[lunarMonth] || lunarMonth + 1;
  const approxSolarDay = Math.min(lunarDay + 15, 28); // Lunar days +~15-20 gives approximate solar day

  return {
    day: approxSolarDay,
    month: approxSolarMonth,
    year: approxSolarMonth === 1 ? refYear + 1 : refYear,
  };
};

const eventMatchesNativeMonth = (event, visibleDate) => {
  const recurringType = String(event?.recurring_type || "").toLowerCase();
  const nativeDate = getNativeEventDate(event);
  const {
    day: nativeDay,
    month: nativeMonth,
    year: nativeYear,
  } = U({ date: nativeDate });

  const displayYear = visibleDate.getFullYear();
  const displayMonth = visibleDate.getMonth() + 1;

  // For lunar events, convert to solar calendar for comparison
  let compareMonth = nativeMonth;
  let compareYear = nativeYear;

  if (isLunarEvent(event) && recurringType === "lunar_annual") {
    // Convert lunar date to solar for display year
    const solarDate = getLunarToSolarDate(nativeDay, nativeMonth, displayYear);
    compareMonth = solarDate.month;
    compareYear = solarDate.year;
  }

  // Check if event matches the visible month
  if (recurringType === "annual" || recurringType === "lunar_annual") {
    return compareMonth ? compareMonth === displayMonth : true;
  }

  if (nativeYear && nativeYear !== displayYear) return false;
  if (compareMonth) return compareMonth === displayMonth;
  return Boolean(nativeYear && !nativeDay);
};

const eventMatchesSelectedDate = (event, selectedDate) => {
  if (!selectedDate) return false;

  const recurringType = String(event?.recurring_type || "").toLowerCase();
  const nativeDate = getNativeEventDate(event);
  const {
    day: nativeDay,
    month: nativeMonth,
    year: nativeYear,
  } = U({ date: nativeDate });

  // For lunar events, convert both to same calendar for comparison
  let compareDate = selectedDate;

  if (isLunarEvent(event)) {
    // Selected date is always solar, convert lunar event to solar
    if (recurringType === "lunar_annual" || recurringType === "annual") {
      const solarDate = getLunarToSolarDate(
        nativeDay,
        nativeMonth,
        selectedDate.year,
      );
      compareDate = {
        day: solarDate.day,
        month: solarDate.month,
        year: solarDate.year,
      };
    } else {
      // For non-recurring lunar events, use native lunar date
      compareDate = { day: nativeDay, month: nativeMonth, year: nativeYear };
    }
  }

  if (nativeDay && nativeDay !== compareDate.day) return false;
  if (nativeMonth && nativeMonth !== compareDate.month) return false;
  if (recurringType === "annual" || recurringType === "lunar_annual")
    return true;
  if (nativeYear && nativeYear !== compareDate.year) return false;
  return Boolean(nativeDay || nativeMonth);
};
const getEventDisplayDate = (event) => {
  const date = getNativeEventDate(event);
  if (date.display) return date.display;
  const { day, month, year } = U({ date });
  if (day && month && year) return `${day}/${month}/${year}`;
  if (month && year) return `0/${month}/${year}`;
  if (year) return `Năm ${year}`;
  return "";
};
const eventCategoryLabels = {
  holiday: "Kì nghỉ",
  birthday: "Ngày sinh",
  death: "Ngày mất",
  battle: "Trận chiến",
  cultural: "Văn hóa",
  political: "Chính trị",
  event: "Sự kiện",
};
const getEventCategoryLabel = (category) => {
  const key = String(category || "event").toLowerCase();
  return eventCategoryLabels[key] || category || "Sự kiện";
};

function oe() {
  const [s, r] = f.useState(!1),
    [i, l] = f.useState(!1),
    [o, c] = f.useState("nien-bieu"),
    [x, d] = f.useState(!1),
    [m, h] = f.useState(null),
    [t, n] = f.useState([]),
    [j, N] = f.useState([]),
    [C, b] = f.useState([]),
    [E, S] = f.useState(!0),
    [V, a] = f.useState(""),
    [p, y] = f.useState(""),
    [O, L] = f.useState([]),
    [D, H] = f.useState(new Date(2026, 4, 1)),
    [I, Y] = f.useState("month");
  f.useRef(null);
  const F = (g) => (g < 0 ? "TCN" : "CN"),
    z = () => {
      const g = !s;
      (r(g),
        document.documentElement.setAttribute(
          "data-theme",
          g ? "dark" : "light",
        ),
        localStorage.setItem("theme", g ? "dark" : "light"));
    },
    W = () => {
      const g = !i;
      (l(g), localStorage.setItem("sidebarHidden", String(g)));
    },
    G = (g) => {
      const v = new Date(D);
      (I === "month"
        ? v.setMonth(D.getMonth() + g)
        : I === "week"
          ? v.setDate(D.getDate() + g * 7)
          : I === "year" && v.setFullYear(D.getFullYear() + g),
        H(v),
        d(!1));
    },
    J = () => {
      const g = document.getElementById("jump-year"),
        v = document.getElementById("jump-era");
      if (g && v) {
        const w = parseInt(g.value),
          T = v.value;
        if (!isNaN(w)) {
          const M = new Date(D);
          (M.setFullYear(T === "TCN" ? -w : w), H(M), d(!1));
        }
      }
    },
    X = () => {
      (H(new Date()), d(!1));
    },
    Z = (g) => {
      const v = new Date(D);
      (v.setDate(1), v.setMonth(g), H(v), Y("month"), d(!1));
    },
    ee = (g) => {
      (c(g), d(!1));
    },
    _ = (g, v) => {
      const w = [];
      return (
        v.forEach((T, M) => {
          const B = A[M % A.length];
          T.kings &&
            T.kings.forEach((k) => {
              var $;
              const u = k.birth_death.split(" - ");
              w.push({
                name: k.name,
                title: k.title,
                era: T.name,
                birth: u[0] ? u[0].trim() : "?",
                death: u[1] ? u[1].trim() : "?",
                rank: "Hoàng Đế / Quân Vương",
                desc: k.summary,
                img: (($ = k.images) == null ? void 0 : $.portrait) || "",
                color: B,
                overview: k.overview || "",
                timeline: k.timeline || [],
                achievements: k.achievements || [],
                legacy: k.legacy || "",
              });
            });
        }),
        w
      );
    };
  f.useEffect(() => {
    const g = localStorage.getItem("sidebarHidden") === "true";
    l(g);
    const v = localStorage.getItem("theme") || "light";
    localStorage.getItem("theme") || localStorage.setItem("theme", "light");
    const w = v === "dark";
    (r(w),
      document.documentElement.setAttribute(
        "data-theme",
        w ? "dark" : "light",
      ));
    const T = async () => {
        S(!0);
        try {
          const u = await fetch("/api/history/public/data");
          if (!u.ok) throw new Error("Không thể tải dữ liệu lịch sử");
          const {
            detailedData: $,
            dynastyData: q,
            calendarData: K,
          } = await u.json();
          (n(q), N($), b(_(q, $)), L(Array.isArray(K) ? K : []));
        } catch (u) {
          console.error("Error loading history data:", u);
        } finally {
          S(!1);
        }
      },
      M = (u) => {
        !(u != null && u.detailedData) ||
          !(u != null && u.dynastyData) ||
          (n(u.dynastyData),
          N(u.detailedData),
          b(_(u.dynastyData, u.detailedData)),
          L(Array.isArray(u.calendarData) ? u.calendarData : []),
          S(!1));
      },
      B = (u) => {
        M(u.detail);
      },
      k = (u) => {
        if (!(u.key !== "adminData" || !u.newValue))
          try {
            M(JSON.parse(u.newValue));
          } catch ($) {
            console.error("Error applying saved history data:", $);
          }
      };
    return (
      T(),
      window.addEventListener("historyDataUpdated", B),
      window.addEventListener("storage", k),
      () => {
        (window.removeEventListener("historyDataUpdated", B),
          window.removeEventListener("storage", k));
      }
    );
  }, []);
  const ae = () => {
      if (o !== "nien-bieu")
        return (
          {
            "trieu-dai": "Dòng thời gian các Triều đại",
            "nhan-vat": "Danh nhân lịch sử Việt Nam",
            "Van-hoa": "Văn hoá & Di sản",
            "ban-do": "Bản đồ lịch sử",
          }[o] || ""
        );
      const g = D.getFullYear(),
        v = D.getMonth(),
        w = F(g);
      return I === "month"
        ? `Tháng ${v + 1}, ${Math.abs(g)} ${w}`
        : I === "week"
          ? `Tuần, ${D.getFullYear()}`
          : `Năm ${D.getFullYear()}`;
    },
    se = (g, v, w) => {
      const T = F(w);
      (h({ day: g, month: v, year: w, era: T }), d(!0));
    },
    te = () => {
      (d(!1), h(null));
    };
  return e.jsxs("div", {
    className: `app-layout ${i ? "sidebar-hidden" : ""}`,
    children: [
      e.jsx(de, {
        currentSection: o,
        onShowSection: ee,
        isDark: s,
        onToggleTheme: z,
      }),
      e.jsxs("main", {
        className: "flex flex-col overflow-hidden",
        children: [
          e.jsx(he, {
            currentSection: o,
            dateLabel: ae(),
            viewMode: I,
            onViewModeChange: Y,
            onNavigate: G,
            onJumpYear: J,
            onGoToToday: X,
            onToggleSidebar: W,
            searchDynasty: V,
            onSearchDynasty: a,
            searchCharacter: p,
            onSearchCharacter: y,
          }),
          e.jsxs("div", {
            className: "main-view",
            children: [
              E &&
                e.jsx("div", {
                  className: "content-section active",
                  children: e.jsx("div", {
                    className: "empty-state",
                    children: "Đang tải dữ liệu...",
                  }),
                }),
              !E &&
                o === "nien-bieu" &&
                e.jsx(me, {
                  curDate: D,
                  viewMode: I,
                  isViewingDetail: x,
                  selectedDate: m,
                  onOpenDetail: se,
                  onCloseDetail: te,
                  onSelectMonth: Z,
                  mockHistEvents: O,
                }),
              !E &&
                o === "trieu-dai" &&
                e.jsx(ge, {
                  dynastyData: t,
                  detailedData: j,
                  searchQuery: V,
                  onSearch: a,
                }),
              !E &&
                o === "nhan-vat" &&
                e.jsx(je, { characters: C, searchQuery: p, onSearch: y }),
              !E && o === "ban-do" && e.jsx(fe, {}),
              !E && o === "Van-hoa" && e.jsx(Ne, {}),
            ],
          }),
        ],
      }),
    ],
  });
}
function de({
  currentSection: s,
  onShowSection: r,
  isDark: i,
  onToggleTheme: l,
}) {
  const o = [
    { id: "nien-bieu", icon: "fa-solid fa-calendar-days", label: "Niên biểu" },
    { id: "trieu-dai", icon: "fa-solid fa-landmark", label: "Triều đại" },
    { id: "nhan-vat", icon: "fa-solid fa-user-tie", label: "Nhân vật" },
    { id: "Van-hoa", icon: "fa-solid fa-map-marked-alt", label: "Văn hóa" },
    { id: "ban-do", icon: "fa-solid fa-map-marked-alt", label: "Bản đồ sử" },
  ];
  return e.jsxs("aside", {
    className: "sidebar ai-style-change-2",
    children: [
      e.jsxs("div", {
        className: "history-brand",
        children: [e.jsx("i", { className: "fa-solid fa-scroll" }), " Sử Việt"],
      }),
      e.jsx("nav", {
        className: "flex-1",
        children: o.map((c) =>
          e.jsxs(
            "div",
            {
              className: `nav-item ${s === c.id ? "active" : ""}`,
              onClick: () => r(c.id),
              children: [
                e.jsx("i", { className: `${c.icon} w-5` }),
                " ",
                c.label,
              ],
            },
            c.id,
          ),
        ),
      }),
      e.jsx("div", {
        className: "mt-auto border-t border-gray-200 dark:border-gray-700 pt-4",
        children: e.jsxs("button", {
          onClick: l,
          className: "btn-base w-full flex items-center justify-center gap-2",
          children: [
            e.jsx("i", {
              id: "theme-icon",
              className: i ? "fa-solid fa-moon" : "fa-solid fa-sun",
            }),
            e.jsx("span", {
              id: "theme-text",
              children: i ? "Chế độ tối" : "Chế độ sáng",
            }),
          ],
        }),
      }),
    ],
  });
}
function he({
  currentSection: s,
  dateLabel: r,
  viewMode: i,
  onViewModeChange: l,
  onNavigate: o,
  onJumpYear: c,
  onGoToToday: x,
  onToggleSidebar: d,
  searchDynasty: m,
  onSearchDynasty: h,
  searchCharacter: t,
  onSearchCharacter: n,
}) {
  if (s !== "nien-bieu") {
    const j = s === "trieu-dai" ? m : s === "nhan-vat" ? t : "",
      N = s === "trieu-dai" ? h : s === "nhan-vat" ? n : () => {};
    return e.jsxs("header", {
      className: "toolbar",
      children: [
        e.jsxs("div", {
          className: "toolbar-group",
          children: [
            e.jsx("button", {
              className: "btn-hamburger",
              onClick: d,
              children: e.jsx("i", { className: "fa-solid fa-bars" }),
            }),
            e.jsx("h2", { className: "text-xl font-bold ml-2", children: r }),
          ],
        }),
        (s === "trieu-dai" || s === "nhan-vat") &&
          e.jsxs("div", {
            className: "search-container",
            children: [
              e.jsx("i", { className: "fa-solid fa-search" }),
              e.jsx("input", {
                type: "text",
                className: "search-input",
                placeholder:
                  s === "trieu-dai"
                    ? "Tìm kiếm triều đại..."
                    : "Tìm kiếm nhân vật...",
                value: j,
                onChange: (C) => N(C.target.value),
              }),
            ],
          }),
      ],
    });
  }
  return e.jsxs("header", {
    className: "toolbar",
    children: [
      e.jsxs("div", {
        className: "toolbar-group",
        children: [
          e.jsx("button", {
            className: "btn-hamburger",
            onClick: d,
            children: e.jsx("i", { className: "fa-solid fa-bars" }),
          }),
          e.jsx("button", {
            className: "btn-base",
            onClick: x,
            children: "Hôm nay",
          }),
          e.jsxs("div", {
            className: "calendar-nav-buttons",
            children: [
              e.jsx("button", {
                className: "calendar-nav-button",
                onClick: () => o(-1),
                children: e.jsx("i", { className: "fa-solid fa-chevron-left" }),
              }),
              e.jsx("button", {
                className: "calendar-nav-button",
                onClick: () => o(1),
                children: e.jsx("i", {
                  className: "fa-solid fa-chevron-right",
                }),
              }),
            ],
          }),
          e.jsx("h2", { className: "text-xl font-bold ml-2", children: r }),
        ],
      }),
      e.jsxs("div", {
        className: "toolbar-group",
        children: [
          e.jsxs("div", {
            className: "input-jump-container",
            children: [
              e.jsx("input", {
                type: "number",
                id: "jump-year",
                placeholder: "Nhập năm cần tra cứu...",
              }),
              e.jsxs("select", {
                id: "jump-era",
                className: "border-none bg-transparent font-bold text-red-600",
                children: [
                  e.jsx("option", { value: "CN", children: "CN" }),
                  e.jsx("option", { value: "TCN", children: "TCN" }),
                ],
              }),
            ],
          }),
          e.jsx("button", {
            onClick: c,
            className:
              "bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700",
            children: "Đi",
          }),
          e.jsx("div", {
            className: "view-mode-icons",
            role: "group",
            "aria-label": "View mode",
            children: [
              { value: "month", icon: "fa-calendar-days", label: "Month" },
              { value: "week", icon: "fa-calendar-week", label: "Week" },
              { value: "year", icon: "fa-calendar", label: "Year" },
            ].map((j) =>
              e.jsx(
                "button",
                {
                  type: "button",
                  className: `view-mode-icon ${i === j.value ? "active" : ""}`,
                  onClick: () => l(j.value),
                  "aria-label": j.label,
                  "aria-pressed": i === j.value,
                  title: j.label,
                  children: e.jsx("i", { className: `fa-solid ${j.icon}` }),
                },
                j.value,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
function me({
  curDate: s,
  viewMode: r,
  isViewingDetail: i,
  selectedDate: l,
  onOpenDetail: o,
  onCloseDetail: c,
  onSelectMonth: x,
  mockHistEvents: d,
}) {
  const m = d.filter((h) => eventMatchesNativeMonth(h, s));
  if (i && l) {
    const h = d.filter((N) => eventMatchesSelectedDate(N, l)),
      t = h.length > 0 ? h : m,
      n =
        t.length > 0
          ? t[0]
          : {
              title: "Chưa có sự kiện phù hợp",
              description: "Chưa có dữ liệu cho mốc thời gian này.",
              category: "event",
            },
      j = String(n.category || "").toLowerCase() === "holiday";
    return e.jsx("div", {
      className: "content-section active",
      children: e.jsxs("div", {
        className: "detail-layout",
        children: [
          e.jsxs("div", {
            className: "detail-content",
            children: [
              e.jsxs("button", {
                onClick: c,
                className: "detail-back-button",
                children: [
                  e.jsx("i", { className: "fa-solid fa-arrow-left" }),
                  " TRỞ LẠI NIÊN BIỂU",
                ],
              }),
              e.jsx("div", {
                className: "flex items-center gap-3 mb-4",
                children: e.jsx("span", {
                  className:
                    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  children: "Tư liệu chính thống",
                }),
              }),
              e.jsxs("h2", {
                className: "text-4xl font-black mb-8 leading-tight",
                children: [
                  "Ngày ",
                  l.day,
                  " Tháng ",
                  l.month,
                  ", Năm",
                  " ",
                  Math.abs(l.year),
                  " ",
                  l.era,
                ],
              }),
              e.jsxs("div", {
                className: "history-text text-lg leading-relaxed",
                children: [
                  e.jsxs("p", {
                    className: "mb-6",
                    children: [
                      "Căn cứ vào các bộ chính sử như ",
                      e.jsx("i", { children: "Đại Việt Sử Ký Toàn Thư" }),
                      " và",
                      " ",
                      e.jsx("i", {
                        children: "Khâm Định Việt Sử Thông Giám Cương Mục",
                      }),
                      ", thời điểm này ghi nhận những dấu ấn quan trọng sau:",
                    ],
                  }),
                  e.jsxs("div", {
                    className: "event-main-card",
                    children: [
                      e.jsxs("h4", {
                        className:
                          "font-bold text-red-600 mb-3 flex items-center gap-2 text-xl",
                        children: [
                          e.jsx("i", { className: "fa-solid fa-star" }),
                          " Sự kiện chính:",
                        ],
                      }),
                      j &&
                        e.jsxs("div", {
                          className:
                            "mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700",
                          children: [
                            e.jsx("i", { className: "fa-solid fa-bullhorn" }),
                            "sự kiện lễ lớn",
                          ],
                        }),
                      e.jsx("p", {
                        className: "font-medium italic",
                        children: n.title,
                      }),
                      e.jsx("p", {
                        className: "mt-2 text-sm",
                        children: n.description || n.desc || "",
                      }),
                    ],
                  }),
                  e.jsx("p", {
                    className: "mb-6 opacity-90",
                    children:
                      "Ngoài ra, triều đình còn thực hiện các chính sách về tô thuế và tuyển chọn hiền tài thông qua các kỳ thi Hương, thi Hội, góp phần ổn định xã hội.",
                  }),
                ],
              }),
            ],
          }),
          e.jsxs("aside", {
            className: "media-panel",
            children: [
              e.jsx("h3", {
                className:
                  "font-bold border-b border-gray-200 dark:border-gray-700 pb-3 mb-4 uppercase text-xs tracking-widest text-gray-500",
                children: "Minh họa trực quan",
              }),
              e.jsxs("div", {
                className: "space-y-6",
                children: [
                  e.jsxs("div", {
                    className: "group",
                    children: [
                      e.jsx("img", {
                        src: "",
                        className:
                          "rounded-lg w-full h-44 object-cover border-2 border-transparent group-hover:border-red-500 transition-all shadow-lg",
                        alt: "Bản đồ cổ",
                      }),
                      e.jsx("p", {
                        className:
                          "text-[10px] mt-2 italic text-gray-500 text-center",
                        children: "Bản đồ địa giới hành chính cổ",
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "group",
                    children: [
                      e.jsx("img", {
                        src: "",
                        className:
                          "rounded-lg w-full h-44 object-cover border-2 border-transparent group-hover:border-red-500 transition-all shadow-lg",
                        alt: "Di vật",
                      }),
                      e.jsx("p", {
                        className:
                          "text-[10px] mt-2 italic text-gray-500 text-center",
                        children: "Di vật ấn tín triều đình",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    });
  }
  return e.jsx("div", {
    className: "content-section active",
    children: e.jsxs("div", {
      className: "flex flex-col gap-5",
      children: [
        e.jsxs("div", {
          className: "calendar-row",
          children: [
            e.jsx(xe, {
              curDate: s,
              viewMode: r,
              onOpenDetail: o,
              onSelectMonth: x,
              events: d,
            }),
            e.jsx(ue, {}),
          ],
        }),
        e.jsxs("footer", {
          className: "results-panel",
          children: [
            e.jsxs("h4", {
              className: "font-bold mb-4 flex items-center gap-2",
              children: [
                e.jsx("i", {
                  className: "fa-solid fa-clock-rotate-left text-red-600",
                }),
                " Các sự kiện lịch sử tiêu biểu giai đoạn này",
              ],
            }),
            e.jsxs("div", {
              className: "grid grid-cols-1 md:grid-cols-2 gap-4",
              children: [
                m.map((h, t) => {
                  var n;
                  return e.jsxs(
                    "div",
                    {
                      className: "result-item",
                      children: [
                        e.jsxs("strong", {
                          className: "text-red-600 text-xs",
                          children: [
                            "[",
                            getEventCategoryLabel(h.category),
                            "] ",
                            getEventDisplayDate(h) || "-",
                          ],
                        }),
                        e.jsx("span", {
                          className: `ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isLunarEvent(h)
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-sky-100 text-sky-700"
                          }`,
                          children: isLunarEvent(h) ? "Âm lịch" : "Dương lịch",
                        }),
                        String(h.category || "").toLowerCase() === "holiday" &&
                          e.jsx("span", {
                            className:
                              "ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700",
                            children: "Ngày lễ lớn",
                          }),
                        e.jsx("p", {
                          className: "text-sm mt-1",
                          children: h.title,
                        }),
                        e.jsx("p", {
                          className: "text-xs mt-1 opacity-80",
                          children: h.description,
                        }),
                      ],
                    },
                    t,
                  );
                }),
                m.length === 0 &&
                  e.jsxs("div", {
                    className: "result-item",
                    children: [
                      e.jsx("strong", {
                        className: "text-red-600 text-xs",
                        children: "[info]",
                      }),
                      e.jsx("p", {
                        className: "text-sm mt-1",
                        children:
                          "Không có sự kiện trong mốc thời gian đang xem.",
                      }),
                    ],
                  }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
function xe({
  curDate: s,
  viewMode: r,
  onOpenDetail: i,
  onSelectMonth: l,
  events: o = [],
}) {
  if (r === "month") {
    const c = s.getFullYear(),
      x = s.getMonth(),
      d = new Date(c, x + 1, 0).getDate(),
      m = new Date(c, x, 1).getDay(),
      h = m === 0 ? 6 : m - 1,
      t = [];
    for (let n = 0; n < h; n++) t.push(null);
    for (let n = 1; n <= d; n++) t.push(n);
    return e.jsxs("div", {
      className: "calendar-card",
      children: [
        e.jsxs("div", {
          className: "grid-header",
          children: [
            e.jsx("div", { children: "Thứ 2" }),
            e.jsx("div", { children: "Thứ 3" }),
            e.jsx("div", { children: "Thứ 4" }),
            e.jsx("div", { children: "Thứ 5" }),
            e.jsx("div", { children: "Thứ 6" }),
            e.jsx("div", { children: "Thứ 7" }),
            e.jsx("div", { children: "Chủ nhật" }),
          ],
        }),
        e.jsx("div", {
          className: "month-grid",
          children: t.map((n, j) => {
            if (n === null)
              return e.jsx("div", { className: "day-cell opacity-20" }, j);
            const N =
                n === new Date().getDate() &&
                x === new Date().getMonth() &&
                c === new Date().getFullYear(),
              lunarDate = getVietnameseLunarDate(n, x + 1, c),
              C = o.some((b) => {
                if (
                  String(
                    (b == null ? void 0 : b.category) || "",
                  ).toLowerCase() !== "holiday"
                )
                  return !1;
                const S = getNativeEventDate(b),
                  V = Number.parseInt(S.day, 10) || 0,
                  a = Number.parseInt(S.month, 10) || 0,
                  p = S.year == null ? 0 : Number.parseInt(S.year, 10) || 0,
                  y = String(
                    (b == null ? void 0 : b.recurring_type) || "",
                  ).toLowerCase();
                const target = isLunarEvent(b)
                  ? {
                      day: lunarDate.day,
                      month: lunarDate.month,
                      year: lunarDate.year,
                    }
                  : { day: n, month: x + 1, year: c };
                return a !== target.month || V !== target.day
                  ? !1
                  : y === "annual" || y === "lunar_annual"
                    ? !0
                    : !p || p === target.year;
              }),
              lunarLabel = formatLunarDate(lunarDate);
            return e.jsxs(
              "div",
              {
                className: `day-cell ${N ? "is-today" : ""}`,
                style: { "--lunar-color": getLunarMonthColor(lunarDate.month) },
                onClick: () => i(n, x + 1, c),
                children: [
                  e.jsx("div", { className: "day-num", children: n }),
                  e.jsx("div", {
                    className: "lunar-date",
                    title: `Âm lịch ${lunarDate.day}/${lunarDate.month}/${lunarDate.year}${lunarDate.leap ? " nhuận" : ""}`,
                    children: lunarLabel,
                  }),
                  C &&
                    e.jsx("div", {
                      className:
                        "mt-1 text-[9px] font-bold bg-red-600 text-white px-1 rounded truncate",
                      children: "Sự kiện lớn",
                    }),
                ],
              },
              j,
            );
          }),
        }),
      ],
    });
  }
  if (r === "year") {
    const c = s.getFullYear(),
      x = [];
    for (let d = 0; d < 12; d++) {
      const m = new Date(c, d + 1, 0).getDate();
      x.push({ month: d + 1, days: m });
    }
    return e.jsx("div", {
      className: "year-view-grid col-span-2",
      children: x.map((d, m) =>
        e.jsxs(
          "div",
          {
            className: "year-month-card",
            onClick: () => l(m),
            children: [
              e.jsxs("h4", {
                className:
                  "font-bold text-red-600 border-b pb-2 mb-2 flex justify-between items-center",
                children: [
                  "Tháng ",
                  d.month,
                  e.jsx("i", {
                    className: "fa-solid fa-arrow-right text-[10px] opacity-50",
                  }),
                ],
              }),
              e.jsx("div", {
                className: "grid grid-cols-7 gap-1 text-[10px] opacity-60",
                children: Array.from({ length: Math.min(d.days, 30) }, (h, t) =>
                  e.jsx(
                    "div",
                    { className: "p-0.5 text-center", children: t + 1 },
                    t,
                  ),
                ),
              }),
            ],
          },
          m,
        ),
      ),
    });
  }
  return e.jsx("div", {
    className: "calendar-card",
    children: e.jsx("div", {
      className: "week-grid p-4 text-center",
      children: "Đang hiển thị lịch tuần...",
    }),
  });
}
function ue() {
  return e.jsxs("aside", {
    className: "media-panel",
    children: [
      e.jsx("h3", {
        className: "font-bold border-b pb-2 mb-4 text-sm",
        children: "HÌNH ẢNH TIÊU BIỂU",
      }),
      e.jsxs("div", {
        className: "space-y-4",
        children: [
          e.jsx("img", {
            src: "",
            className: "rounded w-full h-40 object-cover shadow",
            alt: "Minh họa",
          }),
          e.jsx("img", {
            src: "",
            className: "rounded w-full h-40 object-cover shadow",
            alt: "Di tích",
          }),
        ],
      }),
    ],
  });
}
function ge({
  dynastyData: s,
  detailedData: r,
  searchQuery: i = "",
  onSearch: l = () => {},
}) {
  var h;
  const [o, c] = f.useState(null),
    x = P(s, [(t) => t.name, (t) => t.period, (t) => t.tag, (t) => t.capital]),
    d = R(x, i),
    m = s.filter((t, n) => d.has(n));
  if (o) {
    const t = s.find((N) => N.name === o),
      n = r.find((N) => N.name === o);
    let j = null;
    return (
      n && n.kings && n.kings.length > 0
        ? (j = n.kings.map((N, C) =>
            e.jsxs(
              "div",
              {
                className: "king-card",
                style: { animationDelay: `${C * 50}ms` },
                children: [
                  e.jsxs("div", {
                    className: "king-header",
                    children: [
                      e.jsx("h4", { children: N.name }),
                      e.jsx("span", {
                        className: "king-title",
                        children: N.title,
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "king-info",
                    children: [
                      e.jsxs("p", {
                        children: [
                          e.jsx("i", {
                            className: "fa-solid fa-hourglass-half w-4",
                          }),
                          " ",
                          N.birth_death,
                        ],
                      }),
                      e.jsxs("p", {
                        children: [
                          e.jsx("i", { className: "fa-solid fa-crown w-4" }),
                          " Trị vì: ",
                          N.reign,
                        ],
                      }),
                    ],
                  }),
                  e.jsx("p", {
                    className: "king-summary",
                    children: N.summary,
                  }),
                ],
              },
              C,
            ),
          ))
        : (j = e.jsxs("div", {
            className: "col-span-full text-center py-12 text-[var(--text-sub)]",
            children: [
              e.jsx("i", {
                className: "fa-solid fa-box-open text-5xl mb-4 opacity-50",
              }),
              e.jsx("p", {
                className: "text-lg",
                children: "Danh sách các vị vua đang được cập nhật...",
              }),
            ],
          })),
      e.jsx("div", {
        className: "content-section active",
        children: e.jsxs("div", {
          className: "dynasty-detail-layout fade-in",
          children: [
            e.jsxs("button", {
              className: "char-back-btn",
              onClick: () => c(null),
              children: [
                e.jsx("i", { className: "fa-solid fa-arrow-left" }),
                " Trở lại danh sách triều đại",
              ],
            }),
            e.jsxs("div", {
              className: "mb-8 pb-6 border-b border-[var(--border-color)]",
              children: [
                e.jsx("h2", {
                  className:
                    "text-4xl font-black font-serif text-[var(--text-main)] mb-2",
                  children: t.name,
                }),
                e.jsx("p", {
                  className:
                    "text-lg text-[var(--accent-color)] font-bold mb-4",
                  children: t.period,
                }),
                e.jsx("p", {
                  className: "text-[var(--text-sub)] text-lg leading-relaxed",
                  children: t.description,
                }),
                ((h = t == null ? void 0 : t.images) == null
                  ? void 0
                  : h.banner) &&
                  e.jsx("img", {
                    src: t.images.banner,
                    alt: t.name,
                    style: {
                      marginTop: "16px",
                      width: "100%",
                      maxHeight: "260px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    },
                  }),
              ],
            }),
            e.jsxs("h3", {
              className:
                "text-2xl font-bold mb-6 flex items-center gap-2 text-[var(--text-main)]",
              children: [
                e.jsx("i", {
                  className:
                    "fa-solid fa-chess-king text-[var(--accent-color)]",
                }),
                "Danh sách các vị vua trị vì",
              ],
            }),
            e.jsx("div", { className: "kings-list", children: j }),
          ],
        }),
      })
    );
  }
  return e.jsx("div", {
    className: "content-section active",
    children: e.jsx("div", {
      className: "dynasty-timeline",
      children: m.map((t, n) =>
        e.jsxs(
          "div",
          {
            className: "dynasty-card",
            style: { animationDelay: `${n * 60}ms` },
            onClick: () => c(t.name),
            children: [
              e.jsxs("div", {
                className: "dynasty-card-header",
                children: [
                  e.jsxs("div", {
                    children: [
                      e.jsx("h3", {
                        className: "dynasty-name hover:underline",
                        children: t.name,
                      }),
                      e.jsx("p", {
                        className: "dynasty-period",
                        children: t.period,
                      }),
                    ],
                  }),
                  e.jsx("span", { className: "dynasty-tag", children: t.tag }),
                ],
              }),
              e.jsx("p", {
                className: "dynasty-desc",
                children: t.description,
              }),
              e.jsxs("div", {
                className: "dynasty-stats",
                children: [
                  e.jsxs("div", {
                    className: "dynasty-stat",
                    children: [
                      e.jsx("span", {
                        className: "stat-value",
                        children: t.king_count,
                      }),
                      e.jsx("span", {
                        className: "stat-label",
                        children: "Đời vua",
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "dynasty-stat bordered",
                    children: [
                      e.jsx("span", {
                        className: "stat-value stat-capital",
                        children: t.capital,
                      }),
                      e.jsx("span", {
                        className: "stat-label",
                        children: "Kinh đô",
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "dynasty-stat",
                    children: [
                      e.jsx("span", {
                        className: "stat-value",
                        children: t.start_year,
                      }),
                      e.jsx("span", {
                        className: "stat-label",
                        children: "Khởi thủy",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
          n,
        ),
      ),
    }),
  });
}
function je({ characters: s, searchQuery: r = "", onSearch: i = () => {} }) {
  const [l, o] = f.useState(null),
    [c, x] = f.useState(null),
    [d, m] = f.useState(!1),
    [h, t] = f.useState(0),
    n = 4,
    j = P(s, [(a) => a.name, (a) => a.title, (a) => a.era]),
    N = R(j, r),
    C = s.filter((a, p) => N.has(p)),
    b = (a) => {
      (m(!0),
        setTimeout(() => {
          let p;
          if (a.timeline && a.timeline.length > 0)
            p = {
              overview:
                a.overview ||
                `${a.name} đóng vai trò vô cùng quan trọng trong suốt chiều dài tồn tại của ${a.era}. Những quyết sách và hành động của ông đã để lại dấu ấn lớn trong sử sách nước nhà.`,
              events: a.timeline.map((y) => ({
                year: y.year,
                title: y.title,
                type: y.type || "Khác",
                desc: y.description || "",
                impact: y.impact || "",
              })),
              achievements:
                a.achievements && a.achievements.length > 0
                  ? a.achievements
                  : [
                      "Cải cách hành chính sâu sắc",
                      "Bảo vệ quốc phòng thành công",
                      "Phát triển nền kinh tế",
                      "Nâng cao giáo dục và văn hóa",
                      "Thiết lập ngoại giao ổn định",
                    ],
              legacy:
                a.legacy ||
                `Tên tuổi của ${a.name} mãi được lưu truyền trong sử sách Đại Việt như một minh chứng cho giai đoạn lịch sử ${a.era}. Di sản của ông ảnh hưởng sâu sắc đến các thế hệ sau này.`,
            };
          else {
            const y = a.birth !== "?" ? parseInt(a.birth) : 1e3;
            p = {
              overview: `${a.name} đóng vai trò vô cùng quan trọng trong suốt chiều dài tồn tại của ${a.era}. Những quyết sách và hành động của ông đã để lại dấu ấn lớn trong sử sách nước nhà.`,
              events: [
                {
                  year: a.birth !== "?" ? a.birth : "Không rõ",
                  title: "Ra đời",
                  type: "Thành tích",
                  desc: `Được sinh ra trong giai đoạn lịch sử đầy biến động của ${a.era}.`,
                  impact: "Khởi đầu của một trang sử mới.",
                },
                {
                  year: y + 20,
                  title: "Trưởng thành & Rèn luyện",
                  type: "Chính trị",
                  desc: "Tuổi trẻ học tập, tích lũy kiến thức quốc sự.",
                  impact: "Chuẩn bị cho tương lai.",
                },
                {
                  year: y + 35,
                  title: "Trở thành Quan chức",
                  type: "Chính trị",
                  desc: "Được nhân chứng và giao các vị trí quan trọng trong chính phủ.",
                  impact: "Bước vào chính trường.",
                },
                {
                  year: y + 50,
                  title: "Cải cách Hành chính",
                  type: "Chính trị",
                  desc: "Thực hiện các chính sách cải cách mang tính kỷ lục.",
                  impact: "Thay đổi đất nước.",
                },
                {
                  year: y + 55,
                  title: "Chinh phạt Quân sự",
                  type: "Quân sự",
                  desc: "Lãnh đạo các chiến dịch quân sự để bảo vệ lãnh thổ.",
                  impact: "Quốc phòng vững chắc.",
                },
                {
                  year: a.death !== "?" ? a.death : "Không rõ",
                  title: "Qua đời - Di sản vĩnh cửu",
                  type: "Bi kịch",
                  desc: "Băng hà, để lại di sản to lớn cho nhân dân.",
                  impact: "Di sản vĩnh cửu.",
                },
              ],
              achievements:
                a.achievements && a.achievements.length > 0
                  ? a.achievements
                  : [
                      "Cải cách hành chính sâu sắc",
                      "Bảo vệ quốc phòng thành công",
                      "Phát triển nền kinh tế",
                      "Nâng cao giáo dục và văn hóa",
                      "Thiết lập ngoại giao ổn định",
                    ],
              legacy:
                a.legacy ||
                `Tên tuổi của ${a.name} mãi được lưu truyền trong sử sách Đại Việt như một minh chứng cho giai đoạn lịch sử ${a.era}. Di sản của ông ảnh hưởng sâu sắc đến các thế hệ sau này.`,
            };
          }
          (x(p), t(0), m(!1));
        }, 600));
    },
    E = (a, p) => {
      (o({ ...a, originalIndex: p }), b(a));
    },
    S = () => {
      (o(null), x(null), t(0));
    },
    V = (a) => {
      c &&
        (a === 1 && h + n < c.events.length
          ? t(h + 1)
          : a === -1 && h > 0 && t(h - 1));
    };
  if (l) {
    const a = l,
      p = a.color;
    return e.jsx("div", {
      className: "content-section active",
      children: e.jsxs("div", {
        className: "char-detail-layout fade-in",
        children: [
          e.jsxs("button", {
            className: "char-back-btn",
            onClick: S,
            children: [
              e.jsx("i", { className: "fa-solid fa-arrow-left" }),
              " Trở lại danh sách nhân vật",
            ],
          }),
          e.jsxs("div", {
            className: "char-detail-hero",
            style: { "--char-color": p, borderTopColor: p },
            children: [
              e.jsxs("div", {
                className: "char-detail-img-col",
                children: [
                  e.jsx("img", {
                    src: a.img,
                    className: "char-detail-img",
                    alt: a.name,
                    onError: (y) => (y.target.src = ""),
                  }),
                  e.jsxs("div", {
                    className: "char-detail-badges",
                    children: [
                      e.jsxs("div", {
                        className: "char-badge",
                        children: [
                          e.jsx("i", { className: "fa-solid fa-crown" }),
                          " ",
                          a.rank,
                        ],
                      }),
                      e.jsxs("div", {
                        className: "char-badge",
                        children: [
                          e.jsx("i", { className: "fa-solid fa-landmark" }),
                          " ",
                          a.era,
                        ],
                      }),
                      e.jsxs("div", {
                        className: "char-badge",
                        children: [
                          e.jsx("i", { className: "fa-solid fa-calendar" }),
                          " ",
                          a.birth,
                          " —",
                          " ",
                          a.death,
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "char-detail-info",
                children: [
                  e.jsx("p", {
                    className: "char-detail-era",
                    style: { color: p },
                    children: a.era,
                  }),
                  e.jsx("h1", {
                    className: "char-detail-name",
                    children: a.name,
                  }),
                  e.jsx("p", {
                    className: "char-detail-title-text",
                    children: a.title,
                  }),
                  e.jsx("p", {
                    className: "char-detail-bio",
                    children: a.desc,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs("div", {
            className: "char-timeline-section",
            children: [
              e.jsxs("h2", {
                className: "char-timeline-heading",
                children: [
                  e.jsx("i", {
                    className: "fa-solid fa-timeline",
                    style: { color: p },
                  }),
                  "Dòng thời gian hoạt động",
                ],
              }),
              e.jsx("div", {
                id: "char-timeline-content",
                children: d
                  ? e.jsx("div", {
                      className: "char-timeline-loading",
                      children: e.jsxs("div", {
                        className: "ai-loader",
                        children: [
                          e.jsxs("div", {
                            className: "ai-loader-dots",
                            children: [
                              e.jsx("span", {}),
                              e.jsx("span", {}),
                              e.jsx("span", {}),
                            ],
                          }),
                          e.jsxs("p", {
                            children: [
                              "Đang tra cứu sử liệu về ",
                              a.name,
                              "...",
                            ],
                          }),
                        ],
                      }),
                    })
                  : c
                    ? e.jsx(pe, {
                        data: c,
                        accentColor: p,
                        currentIndex: h,
                        windowSize: n,
                        onScroll: V,
                      })
                    : null,
              }),
            ],
          }),
        ],
      }),
    });
  }
  return e.jsx("div", {
    className: "content-section active",
    children: e.jsx("div", {
      className: "character-grid",
      children: C.map((a, p) =>
        e.jsxs(
          "div",
          {
            className: "character-card",
            style: { animationDelay: `${p * 40}ms` },
            onClick: () => E(a, p),
            children: [
              e.jsxs("div", {
                className: "character-img-wrap",
                children: [
                  e.jsx("img", {
                    src: a.img,
                    className: "character-img",
                    alt: a.name,
                    loading: "lazy",
                    onError: (y) => (y.target.src = ""),
                  }),
                  e.jsx("div", {
                    className: "character-era-badge",
                    style: {
                      background: `${a.color}20`,
                      color: a.color,
                      borderColor: `${a.color}40`,
                    },
                    children: a.era,
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "character-body",
                children: [
                  e.jsx("h4", {
                    className: "character-name",
                    children: a.name,
                  }),
                  e.jsx("p", {
                    className: "character-title",
                    children: a.title,
                  }),
                  e.jsxs("div", {
                    className: "character-lifespan",
                    children: [
                      e.jsx("i", {
                        className: "fa-solid fa-hourglass-half",
                        style: { color: a.color },
                      }),
                      e.jsxs("span", { children: [a.birth, " — ", a.death] }),
                    ],
                  }),
                  e.jsx("p", { className: "character-desc", children: a.desc }),
                  e.jsxs("div", {
                    className: "character-cta",
                    children: [
                      e.jsx("span", { children: "Xem chi tiết lịch sử" }),
                      e.jsx("i", { className: "fa-solid fa-arrow-right" }),
                    ],
                  }),
                ],
              }),
            ],
          },
          p,
        ),
      ),
    }),
  });
}
function pe({
  data: s,
  accentColor: r,
  currentIndex: i,
  windowSize: l,
  onScroll: o,
}) {
  const c = s.events.slice(i, i + l),
    x = i === 0,
    d = i + l >= s.events.length;
  return e.jsxs("div", {
    className: "char-timeline-content",
    children: [
      e.jsxs("div", {
        className: "ct-overview",
        children: [
          e.jsx("div", {
            className: "overview-label",
            children: "Nội dung tóm tắt dòng đời",
          }),
          e.jsx("p", { children: s.overview }),
        ],
      }),
      e.jsxs("div", {
        className: "timeline-roadmap",
        children: [
          e.jsxs("div", {
            className: "roadmap-controls",
            children: [
              e.jsx("button", {
                className: "roadmap-arrow",
                onClick: () => o(-1),
                disabled: x,
                children: e.jsx("i", { className: "fa-solid fa-chevron-left" }),
              }),
              e.jsx("div", {
                className: "roadmap-indicator",
                children: e.jsxs("span", {
                  className: "roadmap-progress",
                  children: [
                    i + 1,
                    "-",
                    Math.min(i + l, s.events.length),
                    " /",
                    " ",
                    s.events.length,
                    " sự kiện",
                  ],
                }),
              }),
              e.jsx("button", {
                className: "roadmap-arrow",
                onClick: () => o(1),
                disabled: d,
                children: e.jsx("i", {
                  className: "fa-solid fa-chevron-right",
                }),
              }),
            ],
          }),
          e.jsx("div", {
            className: "roadmap-window",
            children: e.jsx("div", {
              className: "roadmap-track",
              children: c.map((m, h) => {
                const t = ce[m.type] || "fa-solid fa-circle",
                  n = re[m.type] || r;
                return e.jsxs(
                  "div",
                  {
                    className: "roadmap-card",
                    style: { animationDelay: `${h * 60}ms` },
                    children: [
                      e.jsxs("div", {
                        className: "roadmap-card-header",
                        children: [
                          e.jsx("span", {
                            className: "roadmap-year",
                            style: { color: n },
                            children: m.year,
                          }),
                          e.jsxs("span", {
                            className: "roadmap-type",
                            style: { color: n, background: `${n}15` },
                            children: [
                              e.jsx("i", { className: t }),
                              " ",
                              m.type,
                            ],
                          }),
                        ],
                      }),
                      e.jsx("h4", {
                        className: "roadmap-title",
                        children: m.title,
                      }),
                      e.jsx("p", {
                        className: "roadmap-desc",
                        children: m.desc,
                      }),
                      e.jsxs("div", {
                        className: "roadmap-impact",
                        style: { borderLeft: `3px solid ${n}` },
                        children: [
                          e.jsx("i", {
                            className: "fa-solid fa-lightbulb",
                            style: { color: n },
                          }),
                          e.jsx("span", { children: m.impact }),
                        ],
                      }),
                      e.jsx("div", {
                        className: "roadmap-dot",
                        style: { background: n, boxShadow: `0 0 0 4px ${n}22` },
                      }),
                    ],
                  },
                  h,
                );
              }),
            }),
          }),
          e.jsx("div", {
            className: "roadmap-timeline-bar",
            children: e.jsx("div", {
              className: "timeline-progress",
              style: {
                width: `${Math.min(((i + l) / s.events.length) * 100, 100)}%`,
                background: r,
              },
            }),
          }),
        ],
      }),
      e.jsxs("div", {
        className: "ct-bottom",
        children: [
          e.jsxs("div", {
            className: "ct-achievements",
            children: [
              e.jsxs("h3", {
                className: "ct-section-title",
                children: [
                  e.jsx("i", {
                    className: "fa-solid fa-trophy",
                    style: { color: r },
                  }),
                  " ",
                  "Thành tích nổi bật",
                ],
              }),
              e.jsx("ul", {
                className: "ct-achievement-list",
                children: s.achievements.map((m, h) =>
                  e.jsxs(
                    "li",
                    {
                      children: [
                        e.jsx("i", {
                          className: "fa-solid fa-check",
                          style: { color: r },
                        }),
                        " ",
                        m,
                      ],
                    },
                    h,
                  ),
                ),
              }),
            ],
          }),
          e.jsxs("div", {
            className: "ct-legacy",
            children: [
              e.jsxs("h3", {
                className: "ct-section-title",
                children: [
                  e.jsx("i", {
                    className: "fa-solid fa-monument",
                    style: { color: r },
                  }),
                  " ",
                  "Di sản lịch sử",
                ],
              }),
              e.jsx("p", { children: s.legacy }),
            ],
          }),
        ],
      }),
    ],
  });
}
function fe() {
  return e.jsx("div", {
    className: "content-section active",
    children: e.jsx("div", {
      className:
        "flex items-center justify-center h-[500px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-900/50",
      children: e.jsxs("div", {
        className: "text-center",
        children: [
          e.jsx("i", {
            className:
              "fa-solid fa-map-location-dot text-6xl text-gray-400 mb-4",
          }),
          e.jsx("h3", {
            className: "text-xl font-bold",
            children: "Bản đồ địa giới lịch sử",
          }),
          e.jsx("p", {
            className: "text-gray-500",
            children: "Tính năng đang được phát triển...",
          }),
        ],
      }),
    }),
  });
}
function Ne() {
  return e.jsx("div", {
    className: "content-section active",
    children: e.jsx("div", {
      className:
        "flex items-center justify-center h-[500px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-900/50",
      children: e.jsxs("div", {
        className: "text-center",
        children: [
          e.jsx("i", {
            className: "fa-solid fa-landmark-dome text-6xl text-gray-400 mb-4",
          }),
          e.jsx("h3", {
            className: "text-xl font-bold",
            children: "Văn hóa & Đời sống",
          }),
          e.jsx("p", {
            className: "text-gray-500",
            children:
              "Thông tin phong tục, lễ tiết, kiến trúc đang được cập nhật...",
          }),
        ],
      }),
    }),
  });
}
export default function HistoryPublic() {
  return e.jsx(oe, {});
}
