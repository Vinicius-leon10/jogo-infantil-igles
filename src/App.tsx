import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getLearnWords, getPoolWords, getQuizWords, phases } from "@/data/content";
import type { Word } from "@/data/content";
import { useProgress } from "@/hooks/useProgress";
import { useChildProfile } from "@/hooks/useChildProfile";
import { WorldMap } from "@/components/WorldMap";
import { LevelsScreen } from "@/components/LevelsScreen";
import { PhaseIntro } from "@/components/PhaseIntro";
import { LearnScreen } from "@/components/LearnScreen";
import { QuizScreen } from "@/components/QuizScreen";
import { ResultScreen } from "@/components/ResultScreen";
import { ChildSetupScreen } from "@/components/ChildSetupScreen";
import { ParentArea } from "@/components/ParentArea";
import { MemoryGame } from "@/components/MemoryGame";
import { Sprout } from "@/components/Sprout";
import { WelcomeSplash } from "@/components/WelcomeSplash";
import { StoriesScreen } from "@/components/StoriesScreen";
import { StoryReader } from "@/components/StoryReader";
import type { Story } from "@/data/stories";
import { setMusicWanted } from "@/lib/sound";


type Screen = "levels" | "map" | "intro" | "learn" | "quiz" | "result" | "minigame" | "stories" | "story";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function ScrollToTop({ screenKey }: { screenKey: string }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screenKey]);
  return null;
}

function LoadingSplash() {
  return (
    <div className="min-h-screen bg-aurora flex flex-col items-center justify-center gap-5">
      <div className="animate-float">
        <Sprout size={140} mood="excited" />
      </div>
      <div className="text-center">
        <h1
          className="text-4xl font-bold"
          style={{ fontFamily: "Fredoka, sans-serif", color: "var(--sprout)" }}
        >
          Sprout
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Aprenda inglês, broto a broto</p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

export function App() {
  const { profile, loading: profileLoading, save: saveProfile } = useChildProfile();
  const { progress, recordPhase } = useProgress();
  const [screen, setScreen] = useState<Screen>("levels");
  const [levelId, setLevelId] = useState<number>(1);
  const [phaseId, setPhaseId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Word[]>([]);
  const [resultScore, setResultScore] = useState(0);
  const [resultStars, setResultStars] = useState<0 | 1 | 2 | 3>(0);
  const [resultPassed, setResultPassed] = useState(false);
  const [parentsOpen, setParentsOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const phaseStartRef = useRef<number>(0);
  const [showWelcome, setShowWelcome] = useState(false);

  // Background music on the menus only; it stops for learning, quiz and stories.
  const musicScreen = screen === "levels" || screen === "map" || screen === "intro" || screen === "stories";
  useEffect(() => {
    setMusicWanted(!!profile && musicScreen);
  }, [profile, musicScreen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem("sprout_welcomed")) {
      setShowWelcome(true);
    }
  }, []);

  const dismissWelcome = () => {
    sessionStorage.setItem("sprout_welcomed", "1");
    setShowWelcome(false);
  };

  const welcomeOverlay = (
    <AnimatePresence>
      {showWelcome && <WelcomeSplash key="welcome" onDone={dismissWelcome} />}
    </AnimatePresence>
  );

  if (profileLoading) return <>{welcomeOverlay}<LoadingSplash /></>;
  if (!profile) {
    return <>{welcomeOverlay}<ChildSetupScreen onSave={saveProfile} /></>;
  }

  const phase = phaseId ? phases.find((p) => p.id === phaseId)! : null;
  const pool = phase ? getPoolWords(phase) : [];
  const learnWords = phase ? getLearnWords(phase) : [];

  const startPhase = (id: number) => {
    const p = phases.find((x) => x.id === id)!;
    const base = getQuizWords(p);
    const poolIds = new Set(getPoolWords(p).map((w) => w.id));
    const baseIds = new Set(base.map((w) => w.id));
    const wrongs = Object.entries(progress.wrongWords || {})
      .filter(([id, count]) => count > 0 && poolIds.has(id) && !baseIds.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => base.concat(getPoolWords(p)).find((w) => w.id === id))
      .filter((w): w is Word => !!w);
    const qs = shuffle([...wrongs, ...base]);
    setPhaseId(id);
    setQuestions(qs);
    phaseStartRef.current = Date.now();
    setScreen("intro");
  };

  const selectLevel = (id: number) => {
    setLevelId(id);
    setScreen("map");
  };

  const goLearn = () => setScreen("learn");
  const goQuiz = () => setScreen("quiz");

  const finishQuiz = (score: number, wrongIds: string[], correctIds: string[]) => {
    if (!phase) return;
    const durationMs = phaseStartRef.current ? Date.now() - phaseStartRef.current : 0;
    phaseStartRef.current = 0;
    const { stars, completed } = recordPhase(
      phase.id,
      score,
      phase.requiredScore,
      wrongIds,
      correctIds,
      durationMs,
    );
    setResultScore(score);
    setResultStars(stars);
    setResultPassed(completed);
    setScreen("result");
  };

  const goHome = () => {
    if (resultPassed && phase && phase.id % 3 === 0 && questions.length >= 4) {
      setScreen("minigame");
      return;
    }
    setScreen("map");
    setPhaseId(null);
  };

  const finishMinigame = () => {
    setScreen("map");
    setPhaseId(null);
  };

  const goBackHome = () => {
    setScreen("map");
    setPhaseId(null);
    phaseStartRef.current = 0;
  };

  const goBackToLevels = () => {
    setScreen("levels");
    setPhaseId(null);
  };

  let screenNode: React.ReactNode = null;
  if (screen === "stories") {
    screenNode = (
      <StoriesScreen
        onBack={() => setScreen(phaseId ? "map" : "levels")}
        onOpenStory={(s) => {
          setActiveStory(s);
          setScreen("story");
        }}
      />
    );
  } else if (screen === "story" && activeStory) {
    screenNode = (
      <StoryReader
        story={activeStory}
        onBack={() => {
          setActiveStory(null);
          setScreen("stories");
        }}
      />
    );
  } else if (screen === "levels") {
    screenNode = (
      <LevelsScreen
        onSelectLevel={selectLevel}
        onOpenParents={() => setParentsOpen(true)}
        onOpenStories={() => setScreen("stories")}
      />
    );
  } else if (screen === "map" || !phase) {
    screenNode = (
      <WorldMap
        levelId={levelId}
        onSelectPhase={startPhase}
        onBackToLevels={goBackToLevels}
        onOpenStories={() => setScreen("stories")}
      />
    );
  } else if (screen === "intro") {
    screenNode = (
      <PhaseIntro
        phase={phase}
        wordCount={questions.length}
        onStart={learnWords.length > 0 ? goLearn : goQuiz}
        onBack={goBackHome}
      />
    );
  } else if (screen === "learn") {
    screenNode = <LearnScreen words={learnWords} onDone={goQuiz} onBack={goBackHome} />;
  } else if (screen === "quiz") {
    screenNode = (
      <QuizScreen
        pool={pool}
        questions={questions}
        onFinish={finishQuiz}
        onBack={goBackHome}
        canRead={profile.can_read}
      />
    );
  } else if (screen === "minigame") {
    screenNode = (
      <MemoryGame
        words={questions.slice(0, 6)}
        onDone={finishMinigame}
        onBack={finishMinigame}
      />
    );
  } else {
    screenNode = (
      <ResultScreen
        phase={phase}
        score={resultScore}
        stars={resultStars}
        passed={resultPassed}
        xpGained={Math.round(resultScore / 5) + (resultPassed ? 10 : 0)}
        onRetry={() => startPhase(phase.id)}
        onHome={goHome}
      />
    );
  }

  const screenKey =
    screen === "levels"
      ? "levels"
      : screen === "map"
        ? `map-${levelId}`
        : screen === "stories"
          ? "stories"
          : screen === "story"
            ? `story-${activeStory?.id ?? "x"}`
            : `${screen}-${phaseId ?? "x"}`;

  return (
    <>
      <ScrollToTop screenKey={screenKey} />
      {welcomeOverlay}
      <AnimatePresence mode="wait">
        <motion.div
          key={screenKey}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {screenNode}
        </motion.div>
      </AnimatePresence>
      {parentsOpen && (screen === "map" || screen === "levels") && (
        <ParentArea
          profile={profile}
          onSave={saveProfile}
          onClose={() => setParentsOpen(false)}
        />
      )}
    </>
  );
}
