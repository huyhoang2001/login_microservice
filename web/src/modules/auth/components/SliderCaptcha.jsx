import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAssetUrl } from "@/shared/utils/asset";

const SLIDER_BUTTON_SIZE = 46;
const MIN_DRAG_POINTS = 4;
const MIN_DURATION_MS = 450;
const MAX_DURATION_MS = 10000;

const SliderCaptcha = ({ session, onComplete, onFail, onReload }) => {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const [puzzleImageLoaded, setPuzzleImageLoaded] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [nearTarget, setNearTarget] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const sliderRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const startTimeRef = useRef(0);
  const dragHistoryRef = useRef([]);
  const trackWidthRef = useRef(0);

  const canvasWidth = session?.canvasWidth || 300;
  const canvasHeight = session?.canvasHeight || 200;
  const puzzleWidth = session?.puzzleWidth || 60;
  const puzzleHeight = session?.puzzleHeight || 60;
  const puzzleY = session?.puzzleY || 70;

  const getFullImageUrl = (relativePath) => {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;
    if (relativePath.startsWith("/"))
      return `http://localhost:3001${relativePath}`;
    return `http://localhost:3001/api/captcha/image/${session?.sessionId}/${relativePath}`;
  };

  const backgroundImageUrl = getFullImageUrl(session?.backgroundImage);

  const puzzleShapeUrl = useMemo(() => {
    if (!session?.sessionId) return "";
    return `http://localhost:3001/api/captcha/image/${session.sessionId}/puzzle`;
  }, [session?.sessionId]);

  useLayoutEffect(() => {
    const trackEl = trackRef.current;
    if (!trackEl || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const trackWidth = trackEl.clientWidth;
      trackWidthRef.current = trackWidth;
      const maxTravel = Math.max(0, trackWidth - SLIDER_BUTTON_SIZE);
      setSliderPosition((value) => Math.min(value, maxTravel));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(trackEl);
    return () => observer.disconnect();
  }, [session?.sessionId]);

  useEffect(() => {
    const updateScale = () => {
      const wrapper = containerRef.current;
      if (!wrapper) return;
      setImageScale(wrapper.offsetWidth / canvasWidth);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [canvasWidth, bgImageLoaded]);

  useEffect(() => {
    if (bgImageLoaded) setPuzzleImageLoaded(true);
  }, [bgImageLoaded]);

  useEffect(() => {
    setSliderPosition(0);
    setStatus("idle");
    setStatusMessage("");
    setBgImageLoaded(false);
    setPuzzleImageLoaded(false);
    setNearTarget(false);
    setIsDragging(false);
    dragHistoryRef.current = [];
    isDraggingRef.current = false;
    startTimeRef.current = 0;
    trackWidthRef.current = 0;
  }, [session?.sessionId]);

  const maxTravel = useMemo(() => {
    return Math.max(0, trackWidthRef.current - SLIDER_BUTTON_SIZE);
  }, [trackWidthRef.current]);

  const puzzleXLogical = useMemo(() => {
    const maxPuzzlePosition = canvasWidth - puzzleWidth;
    if (maxTravel <= 0) return 0;
    return (sliderPosition / maxTravel) * maxPuzzlePosition;
  }, [sliderPosition, maxTravel, canvasWidth, puzzleWidth]);

  const progressPercent = useMemo(() => {
    if (trackWidthRef.current <= 0) return 0;
    const buttonRightEdge = sliderPosition + SLIDER_BUTTON_SIZE;
    return Math.max(
      0,
      Math.min(100, (buttonRightEdge / trackWidthRef.current) * 100),
    );
  }, [sliderPosition, trackWidthRef.current]);

  const displayPuzzleX = puzzleXLogical * imageScale;
  const displayTargetX = -9999;
  const displayPuzzleY = puzzleY * imageScale;
  const displayPuzzleW = puzzleWidth * imageScale;
  const displayPuzzleH = puzzleHeight * imageScale;

  const resetState = useCallback(() => {
    setSliderPosition(0);
    setStatus("idle");
    setStatusMessage("");
    setNearTarget(false);
    setIsDragging(false);
    dragHistoryRef.current = [];
    isDraggingRef.current = false;
    startTimeRef.current = 0;
  }, []);

  const fail = useCallback(
    (message, error) => {
      setStatus("failed");
      setStatusMessage(message);
      setNearTarget(false);
      setTimeout(() => resetState(), 1400);
      onFail?.(error instanceof Error ? error : new Error(message));
    },
    [onFail, resetState],
  );

  const success = useCallback(
    async (userX, duration, dragPoints) => {
      setStatus("verifying");
      setStatusMessage("Đang xác minh…");
      try {
        await onComplete?.({
          sessionId: session?.sessionId,
          userX,
          duration,
          dragHistoryCount: dragPoints,
        });
        setStatus("success");
        setStatusMessage("Xác thực thành công!");
      } catch (error) {
        fail("Xác thực thất bại. Thử lại", error);
      }
    },
    [fail, onComplete, session?.sessionId],
  );

  const handleDragStart = useCallback(
    (clientX) => {
      if (status === "success" || status === "verifying") return;
      if (!trackRef.current || !sliderRef.current) return;
      const knobRect = sliderRef.current.getBoundingClientRect();
      dragOffsetRef.current = clientX - knobRect.left;
      isDraggingRef.current = true;
      setIsDragging(true);
      startTimeRef.current = Date.now();
      dragHistoryRef.current = [{ x: sliderPosition, time: 0 }];
      setStatus("dragging");
      setStatusMessage("");
      setNearTarget(false);
    },
    [sliderPosition, status],
  );

  const handleDragMove = useCallback(
    (clientX) => {
      if (!isDraggingRef.current || !trackRef.current) return;
      const trackRect = trackRef.current.getBoundingClientRect();
      const nextPosition = clientX - trackRect.left - dragOffsetRef.current;
      const clamped = Math.max(0, Math.min(maxTravel, nextPosition));
      setSliderPosition(clamped);
      dragHistoryRef.current = [
        ...dragHistoryRef.current,
        { x: clamped, time: Date.now() - startTimeRef.current },
      ].slice(-30);
      setNearTarget(false);
    },
    [maxTravel],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const duration = Date.now() - startTimeRef.current;
    const points = dragHistoryRef.current.length;

    if (sliderPosition < 5) {
      resetState();
      return;
    }
    if (points < MIN_DRAG_POINTS) {
      fail("Kéo thêm một chút", new Error("Insufficient drag data"));
      return;
    }
    if (duration < MIN_DURATION_MS) {
      fail("Quá nhanh — thử lại chậm hơn", new Error("Duration too fast"));
      return;
    }
    if (duration > MAX_DURATION_MS) {
      fail("Quá chậm — thử lại nhanh hơn", new Error("Duration too slow"));
      return;
    }

    const difference = 0;
    if (difference > 0) {
      fail("Vị trí chưa đúng — kéo lại", new Error("Accuracy check failed"));
      return;
    }

    const velocities = [];
    for (let i = 1; i < dragHistoryRef.current.length; i++) {
      const prev = dragHistoryRef.current[i - 1];
      const next = dragHistoryRef.current[i];
      const dt = next.time - prev.time;
      if (dt > 0) velocities.push((next.x - prev.x) / dt);
    }
    if (velocities.length >= 3) {
      const mean =
        velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
      const variance =
        velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
        velocities.length;
      if (variance < 0.0005) {
        fail(
          "Di chuyển quá đều — thử lại",
          new Error("Robot-like behavior detected"),
        );
        return;
      }
    }

    success(Math.round(puzzleXLogical), duration, points);
  }, [fail, puzzleXLogical, resetState, sliderPosition, success]);

  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      handleDragStart(e.clientX);
    },
    [handleDragStart],
  );
  const onTouchStart = useCallback(
    (e) => {
      handleDragStart(e.touches[0]?.clientX);
    },
    [handleDragStart],
  );

  const onKeyDown = useCallback(
    (event) => {
      if (status === "success" || status === "verifying") return;
      if (
        event.key !== "ArrowRight" &&
        event.key !== "ArrowLeft" &&
        event.key !== "Enter"
      )
        return;
      event.preventDefault();
      if (event.key === "Enter") {
        handleDragEnd();
        return;
      }
      const delta = event.key === "ArrowRight" ? 10 : -10;
      const next = Math.max(0, Math.min(maxTravel, sliderPosition + delta));
      setSliderPosition(next);
      dragHistoryRef.current.push({
        x: next,
        time: Date.now() - startTimeRef.current,
      });
      setStatus("dragging");
      setNearTarget(false);
    },
    [
      handleDragEnd,
      maxTravel,
      sliderPosition,
      status,
    ],
  );

  useEffect(() => {
    const onMouseMove = (e) => handleDragMove(e.clientX);
    const onTouchMove = (e) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        handleDragMove(e.touches[0]?.clientX);
      }
    };
    const onPointerUp = () => handleDragEnd();

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onPointerUp);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onPointerUp);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onPointerUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onPointerUp);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [handleDragEnd, handleDragMove, onKeyDown]);

  const handleReload = () => {
    resetState();
    onReload?.();
  };

  const isReady =
    bgImageLoaded && puzzleImageLoaded && trackWidthRef.current > 0;
  const trackBorderColor =
    status === "success"
      ? "#16a34a"
      : status === "failed"
        ? "#ef4444"
        : "#e5e7eb";

  return (
    <div style={{ width: "100%" }}>
      {/* ===== CAPTCHA CANVAS AREA ===== */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: 360,
          margin: "0 auto 16px",
          borderRadius: 18,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(255,255,255,1), rgba(248,250,252,1))",
          boxShadow: "0 16px 45px rgba(15,23,42,0.12)",
          border: "1px solid rgba(148,163,184,0.18)",
          position: "relative",
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
        }}
      >
        {/* Background image */}
        <img
          src={getAssetUrl(backgroundImageUrl)}
          alt="Captcha background"
          draggable={false}
          onLoad={() => setBgImageLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "none",
          }}
        />

        {/* ============================================ */}
        {/* ✅ TARGET HOLE - Viền rõ nét + Chiều sâu */}
        {/* ============================================ */}
        {isReady && (
          <div
            style={{
              position: "absolute",
              left: displayTargetX,
              top: displayPuzzleY,
              width: displayPuzzleW,
              height: displayPuzzleH,
              pointerEvents: "none",
            }}
          >
            {/* Lớp nền tối tạo chiều sâu bên trong puzzle */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.55)",
                // ✅ Dùng CSS mask để chỉ hiển thị vùng tối theo hình puzzle
                WebkitMaskImage: `url(${puzzleShapeUrl})`,
                WebkitMaskSize: "contain",
                WebkitMaskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                maskImage: `url(${puzzleShapeUrl})`,
                maskSize: "contain",
                maskPosition: "center",
                maskRepeat: "no-repeat",
              }}
            />
            {/* Lớp viền ngoài rõ nét - glow effect */}
            <img
              src={getAssetUrl(puzzleShapeUrl)}
              alt="Puzzle target outline"
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                // ✅ Viền xanh lá glow rõ nét
                filter:
                  "drop-shadow(0 0 5px rgba(255, 255, 255, 1)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))",
                opacity: 0.8,
              }}
            />
          </div>
        )}

        {/* ============================================ */}
        {/* ✅ PUZZLE PIECE - Đổ bóng rõ nét */}
        {/* ============================================ */}
        {isReady && (
          <div
            style={{
              position: "absolute",
              left: Math.min(
                displayPuzzleX,
                (canvasWidth - puzzleWidth) * imageScale,
              ),
              top: displayPuzzleY,
              width: displayPuzzleW,
              height: displayPuzzleH,
              transition: isDragging ? "none" : "left 0.18s ease",
              willChange: isDragging ? "left" : "auto",
              pointerEvents: "none",
              border: "none",
              borderRadius: 0,
              backgroundColor: "transparent",
              boxShadow: "none",
              // ✅ Đổ bóng đa lớp rõ nét
              filter: isDragging
                ? "drop-shadow(0 14px 30px rgba(0,0,0,0.55)) drop-shadow(0 5px 12px rgba(0,0,0,0.35)) drop-shadow(0 0 3px rgba(0,0,0,0.25))"
                : "drop-shadow(0 10px 22px rgba(0,0,0,0.5)) drop-shadow(0 4px 10px rgba(0,0,0,0.3)) drop-shadow(0 0 2px rgba(0,0,0,0.2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "visible",
              zIndex: 10,
            }}
          >
            <img
              src={getAssetUrl(puzzleShapeUrl)}
              alt="Puzzle piece"
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "none",
                opacity: 1,
                display: "block",
                border: "none",
              }}
            />
          </div>
        )}

        {/* Instruction text */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 10,
            display: "flex",
            justifyContent: "center",
            gap: 8,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              backgroundColor: "rgba(15,23,42,0.75)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Kéo thanh trượt để ghép mảnh
          </div>
        </div>

        {/* Success overlay */}
        {status === "success" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(22,163,74,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                padding: "14px 22px",
                borderRadius: 999,
                backgroundColor: "rgba(22,163,74,0.94)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              ✓ Đã xác thực
            </div>
          </div>
        )}
      </div>

      {/* ===== SLIDER TRACK ===== */}
      <div
        ref={trackRef}
        style={{
          width: "100%",
          maxWidth: 360,
          height: 52,
          margin: "0 auto",
          borderRadius: 999,
          backgroundColor: status === "failed" ? "#fef2f2" : "#f8fafc",
          border: `1px solid ${trackBorderColor}`,
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${progressPercent}%`,
            background:
              status === "failed"
                ? "#fee2e2"
                : "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)",
            borderRadius: "999px 0 0 999px",
            transition: isDragging ? "none" : "width 0.18s ease",
            willChange: isDragging ? "width" : "auto",
          }}
        />

        {/* Slider button */}
        <button
          type="button"
          ref={sliderRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onKeyDown={onKeyDown}
          style={{
            position: "absolute",
            left: sliderPosition,
            top: "50%",
            transform: "translateY(-50%)",
            width: SLIDER_BUTTON_SIZE,
            height: SLIDER_BUTTON_SIZE,
            borderRadius: "50%",
            border: "none",
            backgroundColor:
              status === "success"
                ? "#16a34a"
                : status === "failed"
                  ? "#ef4444"
                  : "#ffffff",
            color:
              status === "success" || status === "failed" ? "#fff" : "#475569",
            boxShadow: "0 12px 25px rgba(15,23,42,0.15)",
            cursor:
              status === "success" || status === "verifying"
                ? "default"
                : "grab",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            transition: isDragging
              ? "none"
              : "left 0.18s ease, background-color 0.2s ease",
            willChange: isDragging ? "left" : "auto",
            zIndex: 2,
            touchAction: "none",
          }}
          aria-label="Kéo thanh trượt để hoàn thành captcha"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          tabIndex={status === "success" || status === "verifying" ? -1 : 0}
        >
          {status === "success" ? "✓" : status === "failed" ? "✗" : "⟩"}
        </button>

        {/* Status text */}
        <div
          style={{
            position: "absolute",
            left: SLIDER_BUTTON_SIZE / 2,
            right: SLIDER_BUTTON_SIZE / 2,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 13,
            color: status === "failed" ? "#b91c1c" : "#475569",
            textAlign: "center",
            pointerEvents: "none",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            zIndex: 1,
          }}
        >
          {status === "success"
            ? "Hoàn tất"
            : status === "verifying"
              ? statusMessage
              : status === "failed"
                ? statusMessage
                : isDraggingRef.current
                  ? "đang kéo"
                  : "Giữ và kéo sang phải"}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div
        style={{
          maxWidth: 360,
          margin: "12px auto 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 13,
          color: status === "failed" ? "#b91c1c" : "#475569",
        }}
      >
        <div>
          {status === "failed"
            ? "Thử lại để hoàn thành chính xác"
            : "Mảnh ghép và thanh trượt đi cùng tỉ lệ"}
        </div>
        <button
          type="button"
          onClick={handleReload}
          style={{
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            padding: "10px 14px",
            color: "#475569",
            fontWeight: 600,
            cursor: "pointer",
            minWidth: 108,
          }}
        >
          Tải lại ảnh
        </button>
      </div>
    </div>
  );
};

export default SliderCaptcha;
