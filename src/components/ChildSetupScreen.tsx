import { useState } from "react";
import { Sprout } from "./Sprout";
import type { ChildProfileInput } from "@/hooks/useChildProfile";

type Props = {
  onSave: (input: ChildProfileInput) => Promise<unknown>;
  initial?: Partial<ChildProfileInput>;
};

export function ChildSetupScreen({ onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState<number>(initial?.age ?? 5);
  const [sex, setSex] = useState<"boy" | "girl" | null>(initial?.sex ?? null);
  const [canRead, setCanRead] = useState<boolean | null>(
    initial?.can_read === undefined ? null : initial.can_read,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 30 && sex !== null && canRead !== null && age >= 1 && age <= 18;

  const handleSubmit = async () => {
    if (!valid || sex === null || canRead === null) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: trimmed, age, sex, can_read: canRead });
    } catch (e) {
      setError("Não conseguimos salvar. Tente novamente.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-aurora flex flex-col px-6 py-8">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sprout size={48} />
          <h1 className="text-xl font-bold" style={{ fontFamily: "Fredoka, sans-serif" }}>
            Sobre a criança
          </h1>
        </div>
      </header>

      <p className="text-sm text-muted-foreground mb-6">
        Vamos personalizar o aprendizado do seu pequeno broto 🌱
      </p>

      <div className="space-y-6 flex-1">
        {/* Name */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Nome da criança
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Ex.: Lia"
            className="w-full rounded-2xl bg-card px-4 py-4 text-lg font-bold outline-none focus:ring-2"
            style={{ caretColor: "var(--sprout)" }}
          />
        </div>

        {/* Age */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Idade: <span style={{ color: "var(--sprout)" }}>{age} anos</span>
          </label>
          <input
            type="range"
            min={1}
            max={12}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full accent-[var(--sprout)]"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span><span>12</span>
          </div>
        </div>

        {/* Sex */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Quem é o brotinho?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Choice active={sex === "boy"} onClick={() => setSex("boy")} emoji="👦" label="Menino" />
            <Choice active={sex === "girl"} onClick={() => setSex("girl")} emoji="👧" label="Menina" />
          </div>
        </div>

        {/* Reading */}
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Já sabe ler?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Choice active={canRead === true} onClick={() => setCanRead(true)} emoji="📖" label="Sim, já leio" />
            <Choice active={canRead === false} onClick={() => setCanRead(false)} emoji="🎧" label="Ainda não" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Se ainda não lê, os exercícios mostram só imagem e som.
          </p>
        </div>

        {error && <p className="text-sm text-destructive font-semibold">{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!valid || saving}
        className="mt-6 w-full rounded-2xl py-4 font-bold text-lg active:scale-95 transition-transform glow-sprout disabled:opacity-40 disabled:saturate-50"
        style={{
          background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
          color: "var(--primary-foreground)",
        }}
      >
        {saving ? "Salvando..." : "Começar a aventura 🚀"}
      </button>
    </div>
  );
}

function Choice({
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
      className="rounded-2xl p-4 text-center transition-all active:scale-95"
      style={
        active
          ? {
              background: "color-mix(in oklab, var(--sprout) 25%, var(--card))",
              boxShadow: "0 0 0 2px var(--sprout)",
            }
          : { background: "var(--card)" }
      }
    >
      <div className="text-4xl mb-1">{emoji}</div>
      <div className="text-sm font-bold">{label}</div>
    </button>
  );
}
