import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sprout } from "./Sprout";

type Props = { onDone: () => void };

export function WelcomeSplash({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-aurora flex flex-col items-center justify-center gap-6 px-6"
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
          style={{ fontFamily: "Fredoka, sans-serif", color: "var(--sprout)" }}
        >
          Olá!
        </h1>
        <p className="text-lg text-muted-foreground">Bem-vindo ao Sprout 🌱</p>
      </motion.div>

      <motion.div
        className="absolute bottom-12 flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
