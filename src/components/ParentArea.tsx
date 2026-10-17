import { useMemo, useState } from "react";
import { X, History, UserCog, ShieldCheck, Star } from "lucide-react";
import { phases } from "@/data/content";
import { useProgress } from "@/hooks/useProgress";
import type { ChildProfile, ChildProfileInput } from "@/hooks/useChildProfile";

type Tab = "history" | "edit";

type Props = {
  profile: ChildProfile;
  onSave: (input: ChildProfileInput) => Promise<unknown>;
  onClose: () => void;
};

export function ParentArea({ profile, onSave, onClose }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<Tab>("history");

  // Simple parental gate: solve a small math problem
  const challenge = useMemo(() => {
    const a = Math.floor(Math.random() * 6) + 4; // 4..9
    const b = Math.floor(Math.random() * 6) + 4;
    return { a, b, answer: a + b };
  }, []);

  const tryUnlock = () => {
    if (parseInt(pin, 10) === challenge.answer) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="mx-auto max-w-md px-5 py-4 flex items-center gap-3">
          <ShieldCheck className="size-5" style={{ color: "var(--sprout)" }} />
          <h1 className="flex-1 text-lg font-bold" style={{ fontFamily: "Fredoka, sans-serif" }}>
            Área dos Pais
          </h1>
          <button
            onClick={onClose}
            className="size-10 rounded-full bg-card flex items-center justify-center active:scale-95"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md px-5 py-6">
        {!unlocked ? (
          <div className="rounded-3xl bg-card p-6">
            <h2 className="text-xl font-bold mb-2">Confirma que você é adulto</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Quanto é <strong>{challenge.a} + {challenge.b}</strong>?
            </p>
            <input
              type="number"
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
              placeholder="Resposta"
              className="w-full rounded-2xl bg-background px-4 py-4 text-lg font-bold outline-none focus:ring-2 mb-3"
              autoFocus
            />
            {pinError && (
              <p className="text-sm text-destructive font-semibold mb-3">Resposta errada, tente de novo.</p>
            )}
            <button
              onClick={tryUnlock}
              className="w-full rounded-2xl py-3 font-bold active:scale-95"
              style={{
                background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
                color: "var(--primary-foreground)",
              }}
            >
              Entrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-5">
              <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={<History className="size-4" />}>
                Histórico
              </TabButton>
              <TabButton active={tab === "edit"} onClick={() => setTab("edit")} icon={<UserCog className="size-4" />}>
                Cadastro
              </TabButton>
            </div>

            {tab === "history" ? <HistoryPanel /> : <EditPanel profile={profile} onSave={onSave} />}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-2 transition-all"
      style={
        active
          ? {
              background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
              color: "var(--primary-foreground)",
            }
          : { background: "var(--card)" }
      }
    >
      {icon}
      {children}
    </button>
  );
}

function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec.toString().padStart(2, "0")}s`;
}

function HistoryPanel() {
  const { progress } = useProgress();
  const completed = phases.filter((p) => progress.phases[p.id]);
  const totalStars = completed.reduce((sum, p) => sum + (progress.phases[p.id]?.stars ?? 0), 0);
  const totalPhases = phases.length;
  const totalTimeMs = completed.reduce(
    (sum, p) => sum + (progress.phases[p.id]?.totalDurationMs ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Fases" value={`${completed.length}/${totalPhases}`} />
        <Stat label="Estrelas" value={`${totalStars}`} />
        <Stat label="Tempo" value={formatDuration(totalTimeMs)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="XP" value={`${progress.xp}`} />
        <Stat label="Sequência" value={`${progress.streak} dias`} />
      </div>

      <div className="rounded-3xl bg-card p-4">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Fases jogadas
        </h3>
        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda nenhuma fase concluída.</p>
        ) : (
          <ul className="space-y-2">
            {completed.map((p) => {
              const r = progress.phases[p.id]!;
              return (
                <li key={p.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="text-2xl">{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">Nível {p.level} · Fase {p.id}</div>
                    <div className="font-bold text-sm truncate">{p.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Último: {formatDuration(r.lastDurationMs)}
                      {r.bestDurationMs ? ` · Melhor: ${formatDuration(r.bestDurationMs)}` : ""}
                      {r.attempts ? ` · ${r.attempts}x` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-0.5 justify-end mb-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className="size-3.5"
                          style={{
                            color: s <= r.stars ? "var(--amber)" : "var(--muted)",
                            fill: s <= r.stars ? "currentColor" : "none",
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.bestScore}%</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 text-center">
      <div className="text-xl font-bold" style={{ color: "var(--sprout)" }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</div>
    </div>
  );
}

function EditPanel({
  profile,
  onSave,
}: {
  profile: ChildProfile;
  onSave: (input: ChildProfileInput) => Promise<unknown>;
}) {
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [sex, setSex] = useState<"boy" | "girl">(profile.sex);
  const [canRead, setCanRead] = useState<boolean>(profile.can_read);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 30;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await onSave({ name: trimmed, age, sex, can_read: canRead });
      setSaved(true);
    } catch {
      setError("Não conseguimos salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Field label="Nome">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          className="w-full rounded-2xl bg-card px-4 py-3 font-bold outline-none focus:ring-2"
        />
      </Field>

      <Field label={`Idade: ${age} anos`}>
        <input
          type="range"
          min={1}
          max={12}
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          className="w-full accent-[var(--sprout)]"
        />
      </Field>

      <Field label="Quem é o brotinho?">
        <div className="grid grid-cols-2 gap-3">
          <PickerBtn active={sex === "boy"} onClick={() => setSex("boy")} emoji="👦" label="Menino" />
          <PickerBtn active={sex === "girl"} onClick={() => setSex("girl")} emoji="👧" label="Menina" />
        </div>
      </Field>

      <Field label="Já sabe ler?">
        <div className="grid grid-cols-2 gap-3">
          <PickerBtn active={canRead === true} onClick={() => setCanRead(true)} emoji="📖" label="Sim" />
          <PickerBtn active={canRead === false} onClick={() => setCanRead(false)} emoji="🎧" label="Ainda não" />
        </div>
      </Field>

      {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
      {saved && <p className="text-sm font-semibold" style={{ color: "var(--sprout)" }}>Salvo! ✅</p>}

      <button
        onClick={submit}
        disabled={!valid || saving}
        className="w-full rounded-2xl py-3 font-bold active:scale-95 disabled:opacity-40"
        style={{
          background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
          color: "var(--primary-foreground)",
        }}
      >
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function PickerBtn({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-3 text-center transition-all active:scale-95"
      style={
        active
          ? {
              background: "color-mix(in oklab, var(--sprout) 25%, var(--card))",
              boxShadow: "0 0 0 2px var(--sprout)",
            }
          : { background: "var(--card)" }
      }
    >
      <div className="text-2xl mb-0.5">{emoji}</div>
      <div className="text-xs font-bold">{label}</div>
    </button>
  );
}
