import { Music, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { isMusicEnabled, onMusicEnabledChange, setMusicEnabled } from "@/lib/sound";

export function MusicToggle() {
  const [on, setOn] = useState(isMusicEnabled);
  useEffect(() => onMusicEnabledChange(setOn), []);
  return (
    <button
      onClick={() => setMusicEnabled(!on)}
      className="size-9 rounded-full bg-card flex items-center justify-center active:scale-95"
      aria-label={on ? "Desligar música" : "Ligar música"}
      aria-pressed={on}
    >
      {on ? <Music className="size-4 text-primary" /> : <VolumeX className="size-4 text-muted-foreground" />}
    </button>
  );
}
