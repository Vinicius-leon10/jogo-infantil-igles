import { Music, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { isMusicEnabled, onMusicEnabledChange, setMusicEnabled } from "@/lib/sound";

function useMusicEnabled() {
  const [on, setOn] = useState(isMusicEnabled);
  useEffect(() => onMusicEnabledChange(setOn), []);
  return on;
}

/** Big labeled on/off switch for the background music. */
export function MusicToggle() {
  const on = useMusicEnabled();
  return (
    <button
      onClick={() => setMusicEnabled(!on)}
      role="switch"
      aria-checked={on}
      aria-label="Música de fundo"
      className="w-full mb-6 rounded-3xl bg-card px-5 py-4 flex items-center gap-4 btn-3d btn-3d-soft"
    >
      <span
        className="size-11 rounded-full flex items-center justify-center shrink-0"
        style={{ background: on ? "color-mix(in oklab, var(--sprout) 25%, transparent)" : "var(--muted)" }}
      >
        {on ? <Music className="size-5 text-primary" /> : <VolumeX className="size-5 text-muted-foreground" />}
      </span>
      <span className="flex-1 text-left">
        <span className="block font-bold">Música</span>
        <span className="block text-xs text-muted-foreground">{on ? "Ligada · toque para desligar" : "Desligada · toque para ligar"}</span>
      </span>
      <span
        className="w-14 h-8 rounded-full p-1 flex transition-colors shrink-0"
        style={{ background: on ? "var(--sprout)" : "var(--muted)", justifyContent: on ? "flex-end" : "flex-start" }}
      >
        <span className="size-6 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}
