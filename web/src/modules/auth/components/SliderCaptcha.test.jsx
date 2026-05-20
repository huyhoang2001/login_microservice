/**
 * Quick Test File for SliderCaptcha Component
 * Verifies the component structure and props
 */

import SliderCaptcha from "./SliderCaptcha.jsx";

// Mock session data
const mockSession = {
  sessionId: "test-123",
  backgroundImage: "data:image/png;base64,...",
  puzzleImage: "data:image/png;base64,...",
  canvasWidth: 300,
  canvasHeight: 200,
  puzzleWidth: 60,
  puzzleHeight: 60,
  puzzleX: 120,
  puzzleY: 70,
};

// Mock callback handlers
const mockHandlers = {
  onComplete: (data) => {
    console.log("✓ Captcha completed:", data);
    // Expected: { sessionId, userX, duration, dragHistoryCount }
  },
  onFail: (error) => {
    console.log("✗ Captcha failed:", error.message);
  },
  onReload: () => {
    console.log("🔄 Captcha reloaded");
  },
};

// Test Component Render
export function TestSliderCaptcha() {
  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>SliderCaptcha Test</h2>
      <SliderCaptcha
        session={mockSession}
        onComplete={mockHandlers.onComplete}
        onFail={mockHandlers.onFail}
        onReload={mockHandlers.onReload}
      />
    </div>
  );
}

export default TestSliderCaptcha;

/**
 * Test Scenarios:
 *
 * 1. ✓ PASS: Natural drag 1s-5s, accuracy 88-99.8%
 * 2. ✗ FAIL: Too fast (<800ms) → "Quá nhanh — thử lại chậm hơn"
 * 3. ✗ FAIL: Too slow (>12s) → "Quá chậm — thử lại nhanh hơn"
 * 4. ✗ FAIL: Robot pattern → "Chuyển động quá đều đặn — thử lại"
 * 5. ✗ FAIL: Low accuracy → "Ghép chưa đúng — thử lại"
 * 6. ✓ Keyboard: Arrow keys to control, Enter to submit
 * 7. ✓ Visual: Yellow highlight when near target (88%+)
 * 8. ✓ Animation: Fade-in messages, shake on error
 *
 * Expected Log Output:
 * - On success: ✓ Captcha completed: { sessionId, userX, duration, dragHistoryCount }
 * - On failure: ✗ Captcha failed: [specific error message]
 * - On reload: 🔄 Captcha reloaded
 */
