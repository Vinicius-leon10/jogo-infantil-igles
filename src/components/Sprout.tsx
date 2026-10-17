type Props = {
  size?: number;
  mood?: "happy" | "excited" | "wink" | "love";
  className?: string;
};

export function Sprout({ size = 120, mood = "happy", className }: Props) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id="sproutBody" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="oklch(0.88 0.22 145)" />
            <stop offset="100%" stopColor="oklch(0.65 0.22 145)" />
          </radialGradient>
          <radialGradient id="sproutCheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.75 0.18 25 / 0.7)" />
            <stop offset="100%" stopColor="oklch(0.75 0.18 25 / 0)" />
          </radialGradient>
        </defs>

        {/* leaves */}
        <path d="M100 30 Q80 10 65 25 Q85 35 100 50 Z" fill="oklch(0.7 0.2 145)" />
        <path d="M100 30 Q120 8 138 22 Q118 35 100 50 Z" fill="oklch(0.78 0.22 140)" />
        <rect x="97" y="40" width="6" height="18" rx="3" fill="oklch(0.55 0.18 145)" />

        {/* body */}
        <ellipse cx="100" cy="120" rx="65" ry="60" fill="url(#sproutBody)" />

        {/* cheeks */}
        <circle cx="60" cy="135" r="14" fill="url(#sproutCheek)" />
        <circle cx="140" cy="135" r="14" fill="url(#sproutCheek)" />

        {/* eyes */}
        {mood === "wink" ? (
          <>
            <circle cx="78" cy="115" r="9" fill="#0c0c12" />
            <circle cx="80" cy="112" r="3" fill="white" />
            <path d="M114 115 Q122 110 130 115" stroke="#0c0c12" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="78" cy="115" r="9" fill="#0c0c12" />
            <circle cx="122" cy="115" r="9" fill="#0c0c12" />
            <circle cx="80" cy="112" r="3" fill="white" />
            <circle cx="124" cy="112" r="3" fill="white" />
          </>
        )}

        {/* mouth */}
        {mood === "excited" ? (
          <path d="M85 140 Q100 160 115 140 Q100 152 85 140 Z" fill="#0c0c12" />
        ) : mood === "love" ? (
          <path d="M100 145 l-7 -7 a4 4 0 1 1 7 -4 a4 4 0 1 1 7 4 z" fill="oklch(0.6 0.25 20)" />
        ) : (
          <path d="M88 142 Q100 152 112 142" stroke="#0c0c12" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        )}

        {/* heart on belly */}
        <path d="M100 165 l-6 -6 a3 3 0 1 1 6 -3 a3 3 0 1 1 6 3 z" fill="oklch(0.55 0.18 145)" opacity="0.5" />
      </svg>
    </div>
  );
}
