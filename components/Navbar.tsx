"use client";

import Image from "next/image";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

const easeOut = [0.23, 1, 0.32, 1] as const;

interface NavbarProps {
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  showLoginButton?: boolean;
  showDemoButton?: boolean;
}

export default function Navbar({ 
  scrollContainerRef, 
  showLoginButton = false,
  showDemoButton = true 
}: NavbarProps) {
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const [navVisible, setNavVisible] = useState(true);
  const { scrollY: windowScrollY } = useScroll();
  const { scrollY: containerScrollY } = useScroll(
    scrollContainerRef ? { container: scrollContainerRef } : undefined
  );

  const handleScrollChange = (latest: number, scrollSource: any) => {
    const previous = scrollSource.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setNavVisible(false);
    } else {
      setNavVisible(true);
    }
  };

  useMotionValueEvent(windowScrollY, "change", (latest) => handleScrollChange(latest, windowScrollY));
  useMotionValueEvent(containerScrollY, "change", (latest) => handleScrollChange(latest, containerScrollY));

  useEffect(() => {
    let glassInstance: any = null;
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).liquidGlass) {
        if (navRef.current) {
          glassInstance = (window as any).liquidGlass(navRef.current, { scale: -112, blur: 5 });
        }
        clearInterval(timer);
      }
    }, 100);

    return () => {
      clearInterval(timer);
      if (glassInstance) glassInstance.destroy();
    };
  }, []);

  return (
    <>
      <Script src="/liquid-glass.js" strategy="afterInteractive" />
      <div className="sticky top-0 z-50 w-full h-0 overflow-visible">
        <motion.nav 
          ref={navRef} 
          initial={{ y: 0 }}
          animate={{ y: navVisible ? 0 : "-100%" }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="w-full flex items-center justify-between px-6 py-2 md:px-12 md:py-3 bg-charcoal/40 border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-colors duration-300"
        >
          <div className="flex items-center cursor-pointer" onClick={() => {
            if (window.location.pathname !== '/') {
              router.push('/');
            } else {
              if (scrollContainerRef && scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo(0, 0);
              } else {
                window.scrollTo(0, 0);
              }
            }
          }}>
            <div className="relative w-32 md:w-48 h-8 md:h-10 flex items-center">
               <img src="/cirka-logo-white.png" alt="Cirka" className="absolute left-0 h-16 md:h-20 w-auto object-contain object-left scale-[1.5] origin-left" />
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {showDemoButton && (
              <button 
                onClick={() => router.push('/demo')}
                className="bg-cirka-orange hover:bg-white hover:text-cirka-orange text-pure-white px-5 md:px-6 py-1.5 md:py-2 rounded-full font-bold uppercase tracking-wide text-xs md:text-sm transition-all duration-300 shadow-[0_0_10px_rgba(255,92,0,0.4)] hover:shadow-[0_0_15px_rgba(255,255,255,0.6)]"
              >
                Demo
              </button>
            )}
            {showLoginButton && (
              <button 
                onClick={() => router.push('/login')}
                className="border border-white/30 bg-white/10 hover:bg-white hover:text-charcoal text-pure-white px-4 md:px-5 py-1.5 md:py-2 rounded-full font-bold uppercase tracking-wide text-xs md:text-sm transition-all duration-300 backdrop-blur-sm"
              >
                Login
              </button>
            )}
          </div>
        </motion.nav>
      </div>
    </>
  );
}
