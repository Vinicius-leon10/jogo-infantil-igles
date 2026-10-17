import { motion } from "framer-motion";
import { Sprout } from "./Sprout";

type Props = { onDone: () => void };

/**
 * Opening screen. It waits for a tap because browsers only allow sound after one:
 * that tap unlocks audio, so the music starts as soon as the app opens.
 */
export function WelcomeSplash({ onDone }: Props) {
  return (
    <motion.div
      onClick={onDone}
      className="fixed inset-0 z-[70] bg-aurora flex flex-col items-center justify-center gap-6 px-6 cursor-pointer"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="relative"
      >
        <Sprout size={160} mood="excited" />
        <motion.div
          className="absolute -right-3 top-6 text-5xl"
          initial={{ rotate: 0, opacity: 0, scale: 0 }}
          animate={{ rotate: [0, -25, 20, -20, 15, 0], opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1.6, ease: "easeInOut" }}
          style={{ transformOrigin: "70% 90%" }}
          aria-hidden
        >
          👋
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-center"
      >
        <h1
          className="text-5xl font-bold mb-2"
          style={{ fontFamily: "Fredoka, sans-serif", color: "var(--sprout-ink)" }}
        >
          Olá!
        </h1>
        <p className="text-lg text-muted-foreground">Bem-vindo ao Sprout 🌱</p>
      </motion.div>

      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
        className="mt-4 rounded-full px-8 py-4 text-lg font-extrabold btn-3d"
        style={{
          background: "linear-gradient(135deg, var(--sprout), var(--sprout-glow))",
          color: "var(--primary-foreground)",
          marginBottom: "var(--safe-bottom)",
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: [1, 1.06, 1] }}
        transition={{ opacity: { delay: 0.7 }, scale: { delay: 0.7, duration: 1.4, repeat: Infinity } }}
      >
        Toque para começar 🎵
      </motion.button>
    </motion.div>
  );
}
