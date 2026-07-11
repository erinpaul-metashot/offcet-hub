"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SignOutContextType {
  isSigningOut: boolean;
  setIsSigningOut: (val: boolean) => void;
}

const SignOutContext = createContext<SignOutContextType>({
  isSigningOut: false,
  setIsSigningOut: () => {},
});

export function SignOutProvider({ children }: { children: ReactNode }) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  return (
    <SignOutContext.Provider value={{ isSigningOut, setIsSigningOut }}>
      {children}
    </SignOutContext.Provider>
  );
}

export function useSignOut() {
  return useContext(SignOutContext);
}
