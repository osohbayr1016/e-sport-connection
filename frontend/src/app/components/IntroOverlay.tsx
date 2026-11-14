"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FireworksCanvas from "./FireworksCanvas";

interface IntroOverlayProps {
  heroImage?: string; // path in /public
  playOnceKey?: string; // localStorage key
  durationMs?: number; // total overlay time
}

export default function IntroOverlay({
  heroImage = "/games/mlbb-parallax-bg.jpg",
  playOnceKey = "intro_played",
  durationMs = 2600,
}: IntroOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const played = localStorage.getItem(playOnceKey);
      if (played) return; // already played
      setShow(true);
      localStorage.setItem(playOnceKey, "1");
      const t = setTimeout(() => setShow(false), durationMs);
      return () => clearTimeout(t);
    } catch (_) {
      // if storage blocked, still show once per page load
      setShow(true);
      const t = setTimeout(() => setShow(false), durationMs);
      return () => clearTimeout(t);
    }
  }, [durationMs, playOnceKey]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[50] flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FireworksCanvas durationMs={durationMs - 200} />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative text-center px-6"
          >
            <motion.h1
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white drop-shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Mobile Legends: Bang Bang
            </motion.h1>
            <motion.p
              className="mt-3 text-lg sm:text-2xl text-gray-200"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              E-Sport Connection
            </motion.p>

            <motion.div
              className="mt-8 flex items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-white/60 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-white/40 animate-pulse" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
