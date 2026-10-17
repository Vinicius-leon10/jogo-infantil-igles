import { categories } from "@/data/content";

// Illustrations in src/assets/<category>/, named by word id (dog.png, one.png, ...).
const files = import.meta.glob("../assets/{animals,numbers}/*.{png,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const artById: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const id = path.split("/").pop()!.replace(/\.(png|svg)$/, "");
  artById[id] = url;
}

/** Emoji character → illustration URL, for every word that has art. */
const artByEmoji: Record<string, string> = {};
for (const c of categories) {
  for (const w of c.words) {
    if (artById[w.id]) artByEmoji[w.emoji] = artById[w.id];
  }
}

type Props = { char: string; label?: string; className?: string };

/**
 * Renders a word's illustration when one exists, otherwise the emoji itself.
 * The image is sized in `em`, so it follows the surrounding text-size classes.
 */
export function Emoji({ char, label, className }: Props) {
  const src = artByEmoji[char];
  if (!src) return <span className={className}>{char}</span>;
  return (
    <img
      src={src}
      alt={label ?? ""}
      draggable={false}
      className={`inline-block align-middle select-none ${className ?? ""}`}
      style={{ width: "1.3em", height: "1.3em", objectFit: "contain" }}
    />
  );
}
