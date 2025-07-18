import React, { useEffect, useRef, useState } from "react";

const LivePCRGauge = ({ value, max = 3 }) => {
  const radius = 100;
  const center = 150;
  const strokeWidth = 14;
  const duration = 500;

  const [animatedValue, setAnimatedValue] = useState(value);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(value);

  useEffect(() => {
    cancelAnimationFrame(animationRef.current);
    startTimeRef.current = null;
    startValueRef.current = animatedValue;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = (timestamp - startTimeRef.current) / duration;
      const eased = Math.min(progress, 1);

      const newVal =
        startValueRef.current + (value - startValueRef.current) * eased;

      setAnimatedValue(newVal);

      if (eased < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [value]);

  const angle = (animatedValue / max) * 180 - 90;

  const segments = [
    { color: "#7e57c2", start: -90, end: -10, range: [0.0, 1.33] },
    { color: "#ec407a", start: -10, end: 25, range: [1.33, 1.91] },
    { color: "#03a9f4", start: 25, end: 50, range: [1.91, 2.33] },
    { color: "#fdd835", start: 50, end: 90, range: [2.33, 3.0] },
  ];

  const getPointerColor = () => {
    const seg = segments.find(
      (s) => animatedValue >= s.range[0] && animatedValue < s.range[1]
    );
    return seg ? seg.color : "#03a9f4";
  };

  const polarToCartesian = (r, angleDeg) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  const describeArc = (r, startAngle, endAngle) => {
    const start = polarToCartesian(r, endAngle);
    const end = polarToCartesian(r, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return [
      "M",
      start.x,
      start.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i <= 18; i++) {
      const deg = -90 + i * 10;
      const pos = polarToCartesian(radius + 18, deg);
      dots.push(<circle key={i} cx={pos.x} cy={pos.y} r="2" fill="#ccc" />);
    }
    return dots;
  };

  const pointerColor = getPointerColor();
  const pointerOuter = polarToCartesian(radius, angle);
  const pointerInner = polarToCartesian(radius, angle);

  return (
    <svg width="100%" height="250" viewBox="0 0 300 220">
      {segments.map((seg, i) => (
        <path
          key={i}
          d={describeArc(radius, seg.start, seg.end)}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}

      {renderDots()}

      <circle
        cx={pointerOuter.x}
        cy={pointerOuter.y}
        r="10"
        fill={pointerColor}
      />
      <circle cx={pointerInner.x} cy={pointerInner.y} r="5" fill="black" />

      <text
        x={150}
        y={135}
        textAnchor="middle"
        fontSize="40"
        fontWeight="700"
        fill="#000"
      >
        {animatedValue.toFixed(2)}
      </text>

      <text x={150} y={165} textAnchor="middle" fontSize="18" fill="#666">
        Live PCR
      </text>
    </svg>
  );
};

export default LivePCRGauge;
