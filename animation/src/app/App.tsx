import { useState, useEffect } from "react";
import { motion } from "motion/react";

const MAX_TONS = 520;
const CHART_H = 380; // above-ground px
const BELOW_H = 72;  // below-ground px (for 35-ton segment + label)
const ARROW_W = 28;  // px width of arrow column
const BAR_OUTER = 130; // outer column width
const BAR_INNER = 126; // inner bar width

/* ─── Animation step definitions ──────────────────────────────────────── */
const STEP_DELAYS = [
  1200, 1200, 900, 1200, 900, 1200, 900, 1200, 900, 1400,
];
// For each bar: [visibleAtStep, fadeColoredAtStep | null]
const barSteps: [number, number | null][] = [
  [0, null], [1, 2], [3, 4], [5, 6], [7, 8], [9, null],
];

const scaleH = (tons: number) => (tons / MAX_TONS) * CHART_H;

type Segment = {
  tons: number;
  color: string;
  textColor?: string;
  insideLabel?: string;
};

type BelowSeg = {
  tons: number;
  color: string;
  label: string;
};

type BarDef = {
  id: string;
  capLabel?: string;
  aboveSegments: Segment[];
  belowSegment?: BelowSeg;
  bottomLabel?: string;
  isQuestion?: boolean;
};

// Colors
const C_GRAY    = "#c9cdd4"; // 剩餘垃圾
const C_TEAL    = "#4dab9a"; // 廚餘再利用
const C_ORANGE  = "#e07a40"; // 資源再回收
const C_BLUE    = "#5b9bd5"; // 優化焚化爐
const C_PURPLE  = "#7c5cbf"; // 區域聯防  ← new distinct color
const C_RED     = "#c0392b"; // 多出的35噸餘裕
const C_QMARK   = "#adb5bd"; // 名間焚化爐

const barsData: BarDef[] = [
  {
    id: "b1",
    aboveSegments: [
      { tons: 259, color: C_GRAY, textColor: "#374151", insideLabel: "剩餘垃圾量\n259 噸" },
    ],
    bottomLabel: "目前南投\n要處理的垃圾量",
  },
  {
    id: "b2",
    // capLabel: "廚餘再利用\n26 噸",
    aboveSegments: [
      { tons: 233, color: C_GRAY, textColor: "#374151", insideLabel: "剩餘垃圾量\n233 噸" },
      { tons: 26,  color: C_TEAL, textColor: "#fff", insideLabel: "廚餘再利用 26 噸" },
    ],
  },
  {
    id: "b3",
    // capLabel: "資源再回收\n75 噸",
    aboveSegments: [
      { tons: 158, color: C_GRAY, textColor: "#374151", insideLabel: "剩餘垃圾量\n158 噸" },
      { tons: 75,  color: C_ORANGE, textColor: "#fff", insideLabel: "資源再回收\n75 噸" },
    ],
  },
  {
    id: "b4",
    // capLabel: "優化現有焚化爐\n60 噸",
    aboveSegments: [
      { tons: 98, color: C_GRAY, textColor: "#374151", insideLabel: "剩餘垃圾量\n98 噸" },
      { tons: 60, color: C_BLUE, textColor: "#fff", insideLabel: "優化現有焚化爐\n60 噸" },
    ],
  },
  {
    id: "b5",
    // capLabel: "區域聯防\n133 噸",
    aboveSegments: [
      { tons: 98, color: C_PURPLE, textColor: "#fff", insideLabel: "區域聯防\n98 噸" },
    ],
    belowSegment: { tons: 35, color: C_RED, label: "多出的 35 噸餘裕" },
  },
  {
    id: "b6",
    isQuestion: true,
    aboveSegments: [
      { tons: 500, color: C_QMARK },
    ],
    bottomLabel: "500 噸\n名間焚化爐",
  },
];

/* ─── Above-ground bar column ─────────────────────────────────────────── */
function BarAbove({ bar, visible, fadeColored }: { bar: BarDef; visible: boolean; fadeColored: boolean }) {
  const totalTons = bar.aboveSegments.reduce((s, seg) => s + seg.tons, 0);
  const grayTons = bar.aboveSegments
    .filter((s) => s.color === C_GRAY)
    .reduce((s, seg) => s + seg.tons, 0);
  const fullH = scaleH(totalTons);
  const grayH = scaleH(grayTons);
  const targetH = !visible ? 0 : fadeColored ? grayH : fullH;

  return (
    <div className="flex flex-col items-center select-none" style={{ width: BAR_OUTER }}>
      {/* Cap label area */}
      <div
        className="flex flex-col items-center justify-end mb-1"
        style={{ minHeight: 58, width: "100%" }}
      >
        {bar.capLabel && !bar.isQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-center whitespace-pre-line leading-snug"
            style={{ fontSize: 11, fontWeight: 700, color: "#1f2937" }}
          >
            {bar.capLabel}
          </motion.div>
        )}
        {bar.isQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center whitespace-pre-line leading-snug"
            style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}
          >
            {bar.bottomLabel}
          </motion.div>
        )}
      </div>

      {/* Bar area */}
      <div className="relative" style={{ height: CHART_H, width: BAR_INNER }}>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: targetH }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%",
            position: "absolute",
            bottom: 0,
            borderRadius: "4px 4px 0 0",
            overflow: "hidden",
          }}
        >
          {bar.isQuestion ? (
            <div
              className="w-full h-full flex flex-col items-center justify-around"
              style={{ background: C_QMARK, position: "relative" }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.22) 1.5px, transparent 1.5px)",
                  backgroundSize: "8px 8px",
                }}
              />
              {["?", "?", "?"].map((q, i) => (
                <span
                  key={i}
                  style={{ fontSize: i === 0 ? 52 : 36, fontWeight: 900, color: "#fff", lineHeight: 1, position: "relative", zIndex: 1 }}
                >
                  {q}
                </span>
              ))}
            </div>
          ) : (
            <div className="relative w-full h-full">
              {bar.aboveSegments.map((seg, si) => {
                const segH = scaleH(seg.tons);
                const bottomOffset = bar.aboveSegments.slice(0, si).reduce((a, s) => a + scaleH(s.tons), 0);
                const isColored = seg.color !== C_GRAY;
                return (
                  <motion.div
                    key={si}
                    className="absolute left-0 right-0 flex items-center justify-center"
                    animate={{ opacity: fadeColored && isColored ? 0 : 1 }}
                    transition={{ duration: 0.4 }}
                    style={{ bottom: bottomOffset, height: segH, background: seg.color, overflow: "visible", zIndex: 2 }}
                  >
                    {seg.insideLabel && (
                      <span
                        className="font-bold whitespace-pre-line text-center leading-tight"
                        style={{ fontSize: 14, color: seg.textColor }}
                      >
                        {seg.insideLabel}
                      </span>
                    )}
                  </motion.div>
                );
              })}
              {/* Texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
                  backgroundSize: "7px 7px",
                }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Below-ground bar column ─────────────────────────────────────────── */
function BarBelow({ bar, visible }: { bar: BarDef; visible: boolean }) {
  const seg = bar.belowSegment;
  const segH = seg ? scaleH(seg.tons) : 0;

  return (
    <div className="flex flex-col items-center select-none" style={{ width: BAR_OUTER }}>
      {/* Below-ground segment (grows downward from ground line) */}
      <div className="relative" style={{ height: BELOW_H, width: BAR_INNER }}>
        {seg && (
          <>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={visible ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                transformOrigin: "top",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: segH,
                background: seg.color,
                borderRadius: "0 0 4px 4px",
                overflow: "hidden",
              }}
            >
              {/* Diagonal stripe overlay for "excess" feel */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 4px, transparent 4px, transparent 12px)",
                }}
              />
            </motion.div>

            {/* Label below segment */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="absolute left-0 right-0 text-center"
              style={{ top: segH + 4 }}
            >
              <span
                className="font-semibold whitespace-pre-line leading-tight"
                style={{ fontSize: 10, color: seg.color }}
              >
                {seg.label}
              </span>
            </motion.div>
          </>
        )}

        {/* Bottom text label for non-question bars */}
        {!bar.isQuestion && bar.bottomLabel && !seg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="pt-2 text-center"
          >
            <p className="whitespace-pre-line leading-tight" style={{ fontSize: 11, color: "#4b5563" }}>
              {bar.bottomLabel}
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom label for b1 (no below segment) */}
      {!bar.isQuestion && bar.bottomLabel && !seg && (
        <div style={{ height: 0 }} />
      )}
    </div>
  );
}

/* ─── Arrow between bars ──────────────────────────────────────────────── */
function ArrowAbove({ visible }: { visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
      transition={{ duration: 0.3 }}
      style={{ width: ARROW_W, display: "flex", alignItems: "flex-end", paddingBottom: 2, flexShrink: 0 }}
    >
      <span style={{ fontSize: 22, color: "#9ca3af", lineHeight: 1 }}>⇒</span>
    </motion.div>
  );
}

/* ─── Main App ────────────────────────────────────────────────────────── */
export default function App() {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const t = setTimeout(() => setStep(0), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step < 0 || step >= STEP_DELAYS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_DELAYS[step]);
    return () => clearTimeout(t);
  }, [step]);

  const replay = () => {
    setStep(-1);
    setTimeout(() => setStep(0), 150);
  };

  const titleVisible = step >= STEP_DELAYS.length;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-10 px-6"
      style={{ background: "#f0ebe0", fontFamily: "'Noto Sans TC', 'Noto Sans', sans-serif" }}
    >
      {/* Chart card */}
      <div
        className="rounded-2xl shadow-lg overflow-x-auto"
        style={{ background: "#fff", border: "2px solid #e5e7eb", padding: "32px 28px 20px", maxWidth: 1200, width: "100%" }}
      >
        <div style={{ minWidth: 940, position: "relative" }}>

          {/* ── Above-ground row ─────────────────── */}
          <div className="flex items-end">
            {barsData.map((bar, i) => {
              const [visStep, fadeStep] = barSteps[i];
              const visible = step >= visStep;
              const fadeColored = fadeStep !== null && step >= fadeStep;
              const nextVisible = i < barsData.length - 1 && step >= barSteps[i + 1][0];

              return (
                <div key={bar.id} className="flex items-end" style={{ position: "relative" }}>
                  <BarAbove bar={bar} visible={visible} fadeColored={fadeColored} />
                  {i < barsData.length - 1 && (
                    <ArrowAbove visible={nextVisible} />
                  )}
                  {/* Title card next to 名間焚化爐 */}
                  {i === barsData.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -18 }}
                      animate={titleVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ position: "absolute", right: 110, top: 0, zIndex: 20 }}
                    >
                      <div
                        className="px-8 py-4 rounded-lg"
                        style={{ background: "#fff", border: "3px solid #374151", boxShadow: "6px 6px 0 #374151", whiteSpace: "nowrap" }}
                      >
                        <div style={{ color: "#374151", fontSize: 16, marginBottom: 4 }}>還多 35 噸餘裕！</div>
                        <div style={{ color: "#e07a40", fontSize: 36, fontWeight: 900, letterSpacing: 3 }}>
                          幹麻蓋？
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Ground line ──────────────────────── */}
          <div style={{ height: 3, background: "#374151", borderRadius: 2 }} />

          {/* ── Below-ground row ─────────────────── */}
          <div className="flex items-start">
            {barsData.map((bar, i) => {
              const visible = step >= barSteps[i][0];
              return (
                <div key={bar.id} className="flex items-start">
                  <BarBelow bar={bar} visible={visible} />
                  {i < barsData.length - 1 && <div style={{ width: ARROW_W, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

          {/* ── Bottom labels row ─────────────────── */}
          <div className="flex items-start mt-1">
            {barsData.map((bar, i) => {
              const visible = step >= barSteps[i][0];
              return (
                <div key={bar.id} className="flex items-start">
                  <div className="text-center" style={{ width: BAR_OUTER }}>
                    {!bar.isQuestion && bar.bottomLabel && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={visible ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="whitespace-pre-line leading-tight"
                        style={{ fontSize: 11, color: "#4b5563" }}
                      >
                        {bar.bottomLabel}
                      </motion.p>
                    )}
                  </div>
                  {i < barsData.length - 1 && <div style={{ width: ARROW_W, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Replay */}
      <motion.button
        onClick={replay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="mt-7 cursor-pointer"
        style={{
          background: "#374151",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "10px 28px",
          fontSize: 14,
          boxShadow: "3px 3px 0 #e07a40",
        }}
      >
        🔄 重播動畫
      </motion.button>
    </div>
  );
}
