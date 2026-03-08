import { useMemo } from "react";
import { motion } from "framer-motion";

interface RadarChart3DProps {
  data: { label: string; parent: number; child: number }[];
  maxValue?: number;
}

const RadarChart3D = ({ data, maxValue = 5 }: RadarChart3DProps) => {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 140;
  const levels = 5;
  const angleSlice = (Math.PI * 2) / data.length;

  // 3D perspective tilt
  const tiltX = 0.85; // Compress Y axis for 3D effect
  const offsetY = 10; // Slight downward shift

  const getPoint = (index: number, value: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle) * tiltX + offsetY,
    };
  };

  const getPolygonPoints = (values: number[]) =>
    values.map((v, i) => {
      const pt = getPoint(i, v);
      return `${pt.x},${pt.y}`;
    }).join(" ");

  const gridLevels = useMemo(() => {
    return Array.from({ length: levels }, (_, i) => {
      const levelValue = ((i + 1) / levels) * maxValue;
      const points = data.map((_, j) => {
        const pt = getPoint(j, levelValue);
        return `${pt.x},${pt.y}`;
      }).join(" ");
      return { points, level: i + 1 };
    });
  }, [data.length]);

  const axisLines = useMemo(() => {
    return data.map((_, i) => {
      const pt = getPoint(i, maxValue);
      return { x1: cx, y1: cy + offsetY, x2: pt.x, y2: pt.y };
    });
  }, [data.length]);

  const parentPoints = getPolygonPoints(data.map((d) => d.parent));
  const childPoints = getPolygonPoints(data.map((d) => d.child));

  // Label positions (pushed outward)
  const labelPositions = data.map((d, i) => {
    const pt = getPoint(i, maxValue + 0.7);
    return { ...pt, label: d.label };
  });

  return (
    <div className="relative w-full flex items-center justify-center">
      {/* Glow background */}
      <div
        className="absolute rounded-full blur-3xl opacity-20"
        style={{
          width: radius * 2.2,
          height: radius * 2.2 * tiltX,
          background: "radial-gradient(ellipse, hsl(25 95% 55% / 0.4), hsl(210 70% 50% / 0.2), transparent)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -45%)",
        }}
      />

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[420px] drop-shadow-lg"
        style={{ filter: "drop-shadow(0 8px 32px hsl(25 95% 55% / 0.15))" }}
      >
        <defs>
          {/* Parent gradient */}
          <linearGradient id="parentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25, 95%, 60%)" />
            <stop offset="100%" stopColor="hsl(340, 75%, 55%)" />
          </linearGradient>
          <linearGradient id="parentStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25, 95%, 55%)" />
            <stop offset="100%" stopColor="hsl(340, 75%, 50%)" />
          </linearGradient>

          {/* Child gradient */}
          <linearGradient id="childGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(175, 45%, 45%)" />
            <stop offset="100%" stopColor="hsl(210, 70%, 55%)" />
          </linearGradient>
          <linearGradient id="childStroke" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(175, 45%, 40%)" />
            <stop offset="100%" stopColor="hsl(210, 70%, 50%)" />
          </linearGradient>

          {/* Glow filters */}
          <filter id="glowParent" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="hsl(25, 95%, 55%)" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glowChild" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="hsl(210, 70%, 50%)" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 3D shadow for base */}
          <radialGradient id="baseShadow" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="hsl(220, 20%, 15%)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base shadow ellipse for 3D depth */}
        <ellipse
          cx={cx}
          cy={cy + offsetY + 12}
          rx={radius + 20}
          ry={(radius + 20) * tiltX * 0.3}
          fill="url(#baseShadow)"
        />

        {/* Grid levels with gradient fill for depth */}
        {gridLevels.map(({ points, level }) => (
          <polygon
            key={level}
            points={points}
            fill={level === levels ? "hsl(220, 20%, 95%)" : "none"}
            fillOpacity={level === levels ? 0.5 : 0}
            stroke="hsl(220, 15%, 82%)"
            strokeWidth={level === levels ? 1.5 : 0.5}
            strokeOpacity={1 - (level - 1) * 0.15}
            strokeDasharray={level === levels ? "none" : "4 3"}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="hsl(220, 15%, 82%)"
            strokeWidth="0.7"
            strokeOpacity="0.6"
          />
        ))}

        {/* Child data polygon (behind) */}
        <motion.polygon
          points={childPoints}
          fill="url(#childGrad)"
          fillOpacity={0.2}
          stroke="url(#childStroke)"
          strokeWidth={2.5}
          filter="url(#glowChild)"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: `${cx}px ${cy + offsetY}px` }}
        />

        {/* Parent data polygon (front) */}
        <motion.polygon
          points={parentPoints}
          fill="url(#parentGrad)"
          fillOpacity={0.25}
          stroke="url(#parentStroke)"
          strokeWidth={2.5}
          filter="url(#glowParent)"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: `${cx}px ${cy + offsetY}px` }}
        />

        {/* Data points - Parent */}
        {data.map((d, i) => {
          const pt = getPoint(i, d.parent);
          return (
            <motion.circle
              key={`p-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill="hsl(25, 95%, 55%)"
              stroke="white"
              strokeWidth={2}
              filter="url(#glowParent)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
            />
          );
        })}

        {/* Data points - Child */}
        {data.map((d, i) => {
          const pt = getPoint(i, d.child);
          return (
            <motion.circle
              key={`c-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill="hsl(210, 70%, 50%)"
              stroke="white"
              strokeWidth={2}
              filter="url(#glowChild)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.05, duration: 0.4 }}
            />
          );
        })}

        {/* Labels - multi-line support for full names */}
        {labelPositions.map((pos, i) => {
          const isLeft = pos.x < cx - 20;
          const isRight = pos.x > cx + 20;
          const anchor = isLeft ? "end" : isRight ? "start" : "middle";
          const label = data[i].label;
          const words = label.split(" ");
          // Split into max 2 lines
          let lines: string[];
          if (words.length <= 1 || label.length <= 12) {
            lines = [label];
          } else {
            const mid = Math.ceil(words.length / 2);
            lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
          }

          return (
            <motion.text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor={anchor}
              dominantBaseline="central"
              className="fill-muted-foreground"
              style={{ fontSize: 9.5, fontFamily: "var(--font-body)", fontWeight: 600 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.05 }}
            >
              {lines.map((line, li) => (
                <tspan key={li} x={pos.x} dy={li === 0 ? 0 : 12}>
                  {line}
                </tspan>
              ))}
            </motion.text>
          );
        })}

        {/* Level numbers on the right axis */}
        {Array.from({ length: levels }, (_, i) => {
          const val = i + 1;
          const pt = getPoint(0, val); // top axis
          return (
            <text
              key={`lvl-${i}`}
              x={pt.x + 8}
              y={pt.y + 2}
              className="fill-muted-foreground"
              style={{ fontSize: 9, fontFamily: "var(--font-body)" }}
              opacity={0.5}
            >
              {val}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default RadarChart3D;
