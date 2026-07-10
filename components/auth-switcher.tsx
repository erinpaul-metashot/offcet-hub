"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";

type AuthMode = "login" | "register";

export function AuthSwitcher({ initialMode = "login" }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const handleSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    
    // Update the URL without reloading the page or triggering Next.js navigation.
    // This allows the animation to play smoothly while keeping the URL state correct.
    window.history.replaceState(null, "", `/${newMode}`);
  };

  const variants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 30 : -30,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -30 : 30,
    }),
  };

  const direction = mode === "login" ? -1 : 1;

  return (
    <div className="relative w-full max-w-3xl flex justify-center">
      <AnimatePresence mode="wait" custom={direction}>
        {mode === "login" ? (
          <motion.div
            key="login"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full flex justify-center"
          >
            <LoginForm onSwitch={() => handleSwitch("register")} />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full flex justify-center"
          >
            <RegisterForm onSwitch={() => handleSwitch("login")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
