export type TreeKind = "apple" | "cherry" | "orange";

type Props = {
  /** Growth stage, 1 = tiny sprout … `stages` = full tree. */
  stage: number;
  stages: number;
  kind: TreeKind;
  size?: number;
  /** Locked phases show a faded silhouette of what will grow there. */
  dim?: boolean;
  className?: string;
};

const PALETTES = {
  apple: {
    leaf: "#7ed957",
    leafDark: "#3fa34d",
    canopy: ["#2e7d32", "#43a047", "#7bd16a"],
    trunk: "#8d5a3b",
    trunkDark: "#6d4126",
  },
  orange: {
    leaf: "#7ed957",
    leafDark: "#3fa34d",
    canopy: ["#2f7d32", "#3f9a43", "#86d36f"],
    trunk: "#8d5a3b",
    trunkDark: "#6d4126",
  },
  cherry: {
    leaf: "#7ed957",
    leafDark: "#3fa34d",
    canopy: ["#d9568a", "#f28bb5", "#ffc7de"],
    trunk: "#7b4a3a",
    trunkDark: "#5c3326",
  },
} as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Canopy made of overlapping round blobs: [dx, dy, r] in units of the canopy radius.
const BLOBS: [number, number, number][] = [
  [0, 0, 1],
  [-0.62, 0.2, 0.72],
  [0.62, 0.2, 0.72],
  [-0.36, -0.44, 0.66],
  [0.38, -0.42, 0.66],
  [0, 0.38, 0.7],
];
const FRUITS: [number, number][] = [
  [-0.55, 0.15], [0.5, 0.05], [-0.15, -0.35], [0.25, 0.45], [-0.35, 0.55], [0.7, 0.5], [0.05, 0.1], [-0.75, -0.15], [0.45, -0.45],
];

/** A plant that grows from a sprout into the level's tree, one stage per phase. */
export function Plant({ stage, stages, kind, size = 96, dim, className }: Props) {
  const t = stages <= 1 ? 1 : Math.min(1, Math.max(0, (stage - 1) / (stages - 1)));
  const p = PALETTES[kind];
  const ground = 112;
  const isTree = t >= 0.34;
  const final = t >= 1;

  let plant: React.ReactNode;
  if (!isTree) {
    // Sprout: a stem with pairs of leaves that multiply and grow.
    const k = t / 0.34;
    const stemH = lerp(16, 40, k);
    const pairs = 1 + Math.floor(k * 2.99);
    const leaves = [];
    for (let i = 0; i < pairs; i++) {
      const y = ground - stemH + (i * stemH) / (pairs + 0.5);
      const s = lerp(10, 20, k) * (1 - i * 0.18);
      const leaf = `M0 0 Q${s * 0.9} ${-s * 0.75} ${s * 2} 0 Q${s * 0.9} ${s * 0.45} 0 0Z`;
      for (const dir of [-1, 1]) {
        leaves.push(
          <g key={`${i}${dir}`} transform={`translate(60 ${y}) scale(${dir} 1) rotate(${-28 + i * 8})`}>
            <path d={leaf} fill={p.leaf} />
            <path d={`M2 0 Q${s} ${-s * 0.2} ${s * 1.8} 0`} stroke={p.leafDark} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>,
        );
      }
    }
    plant = (
      <>
        <path
          d={`M60 ${ground} Q${58 + k * 2} ${ground - stemH / 2} 60 ${ground - stemH}`}
          stroke={p.leafDark}
          strokeWidth={lerp(3, 5, k)}
          fill="none"
          strokeLinecap="round"
        />
        {leaves}
      </>
    );
  } else {
    // Tree: trunk thickens, canopy grows, and the finished tree bears fruit / blossoms.
    const u = (t - 0.34) / 0.66;
    const trunkH = lerp(30, 56, u);
    const w = lerp(5, 13, u);
    const R = lerp(17, 40, u);
    const cy = ground - trunkH - R * 0.45;
    const top = ground - trunkH;
    const blob = (shade: number, dy = 0, scale = 1) =>
      BLOBS.map(([dx, by, r], i) => (
        <circle key={i} cx={60 + dx * R} cy={cy + by * R + dy} r={r * R * scale} fill={p.canopy[shade]} />
      ));
    plant = (
      <>
        <path
          d={`M${60 - w * 0.75} ${ground} Q${60 - w * 0.4} ${ground - trunkH / 2} ${60 - w * 0.35} ${top}
              L${60 + w * 0.35} ${top} Q${60 + w * 0.4} ${ground - trunkH / 2} ${60 + w * 0.75} ${ground}Z`}
          fill={p.trunk}
        />
        <path d={`M${60 + w * 0.1} ${ground - 2} L${60 + w * 0.2} ${top + 4}`} stroke={p.trunkDark} strokeWidth={w * 0.25} strokeLinecap="round" opacity="0.6" />
        {u > 0.3 && (
          <g stroke={p.trunk} strokeWidth={w * 0.35} strokeLinecap="round" fill="none">
            <path d={`M60 ${top + trunkH * 0.35} Q${60 - R * 0.35} ${top + trunkH * 0.1} ${60 - R * 0.55} ${cy + R * 0.2}`} />
            <path d={`M60 ${top + trunkH * 0.45} Q${60 + R * 0.35} ${top + trunkH * 0.2} ${60 + R * 0.55} ${cy + R * 0.25}`} />
          </g>
        )}
        {blob(0, 3)}
        {blob(1)}
        {BLOBS.slice(0, 5).map(([dx, by, r], i) => (
          <circle key={`h${i}`} cx={60 + dx * R - R * 0.12} cy={cy + by * R - R * 0.14} r={r * R * 0.55} fill={p.canopy[2]} opacity="0.55" />
        ))}
        {final &&
          FRUITS.map(([fx, fy], i) =>
            kind === "apple" || kind === "orange" ? (
              <g key={i}>
                <circle cx={60 + fx * R} cy={cy + fy * R} r={R * (kind === "orange" ? 0.15 : 0.13)} fill={kind === "orange" ? "#ff8a1f" : "#e53935"} />
                <circle cx={60 + fx * R - R * 0.04} cy={cy + fy * R - R * 0.04} r={R * 0.045} fill={kind === "orange" ? "#ffc58a" : "#ff9e9e"} />
              </g>
            ) : (
              <g key={i} transform={`translate(${60 + fx * R} ${cy + fy * R})`}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <circle key={a} cx={Math.cos((a * Math.PI) / 180) * R * 0.07} cy={Math.sin((a * Math.PI) / 180) * R * 0.07} r={R * 0.065} fill="#fff" />
                ))}
                <circle r={R * 0.045} fill="#e84a8a" />
              </g>
            ),
          )}
      </>
    );
  }

  return (
    <svg
      viewBox="0 -16 120 140"
      width={size}
      height={size}
      className={className}
      style={dim ? { filter: "grayscale(1) brightness(0.75)", opacity: 0.45 } : undefined}
      role="img"
      aria-label={`Planta, estágio ${stage} de ${stages}`}
      data-stage={stage}
    >
      <ellipse cx="60" cy={ground + 2} rx="36" ry="9" fill="#5b3d2e" />
      <ellipse cx="60" cy={ground} rx="29" ry="5.5" fill="#7d5640" />
      <path d="M30 112 l3 -6 l2 6 M86 112 l3 -7 l2 7 M40 115 l2 -4 l2 4" stroke="#56b04a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {plant}
    </svg>
  );
}
