"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useProgress } from "@react-three/drei";
import { Wordmark } from "./shared";

export function GlobalLoader() {
  const container = useRef<HTMLDivElement>(null);
  const perspectiveRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const { progress, active } = useProgress();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Enforce a minimum display time so the loading animation can be seen
  useEffect(() => {
    const t = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  // When loading completes and min time elapses, mark as done
  useEffect(() => {
    // If progress jumps to 100, or if it's no longer active (meaning nothing is loading)
    if ((progress >= 100 || !active) && minTimeElapsed && !isDone) {
      setIsDone(true);
    }
  }, [progress, active, minTimeElapsed, isDone]);

  // Prevent scrolling on the document body while loader is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useGSAP(() => {
    if (!isDone) {
      // Box breathing (walls bulging out) idle animation
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      
      // Animate walls expanding and contracting
      tl.fromTo(".box-wall-n", { rotateX: 90 }, { rotateX: 105, duration: 0.8, ease: "power2.inOut" }, 0);
      tl.fromTo(".box-wall-s", { rotateX: -90 }, { rotateX: -105, duration: 0.8, ease: "power2.inOut" }, 0);
      tl.fromTo(".box-wall-e", { rotateY: 90 }, { rotateY: 105, duration: 0.8, ease: "power2.inOut" }, 0);
      tl.fromTo(".box-wall-w", { rotateY: -90 }, { rotateY: -105, duration: 0.8, ease: "power2.inOut" }, 0);
      
      // Floating bounce for the whole box
      tl.to(boxRef.current, { y: -20, duration: 0.8, ease: "power1.inOut" }, 0);
    } else {
      // Exit Sequence
      const exitTl = gsap.timeline({
        onComplete: () => {
          // Loader is fully unmounted or completely out of view
          if (container.current) {
            container.current.style.display = "none";
          }
          // Restore scrolling for the landing page
          document.body.style.overflow = "auto";
        }
      });
      
      // 1. Kill the idle animation on walls and box
      gsap.killTweensOf(".box-wall-n, .box-wall-s, .box-wall-e, .box-wall-w, .oh-loader-box");
      
      // 2. Snap walls back to perfect 90 degrees
      exitTl.to(".box-wall-n", { rotateX: 90, duration: 0.4, ease: "power2.out" }, 0);
      exitTl.to(".box-wall-s", { rotateX: -90, duration: 0.4, ease: "power2.out" }, 0);
      exitTl.to(".box-wall-e", { rotateY: 90, duration: 0.4, ease: "power2.out" }, 0);
      exitTl.to(".box-wall-w", { rotateY: -90, duration: 0.4, ease: "power2.out" }, 0);

      // 3. Snap flaps to closed position
      exitTl.to(".box-flap-n", { rotateX: -90, duration: 0.4, ease: "power2.out" }, 0);
      exitTl.to(".box-flap-s", { rotateX: 90, duration: 0.4, ease: "power2.out" }, 0);
      exitTl.to(".box-flap-e", { rotateY: -90, duration: 0.4, ease: "power2.out" }, 0);
      exitTl.to(".box-flap-w", { rotateY: 90, duration: 0.4, ease: "power2.out" }, 0);
      exitTl.to(boxRef.current, { y: 0, duration: 0.4, ease: "power2.out" }, 0);
      
      // 3. Tape appears (seals the box)
      exitTl.to(".box-tape", { scaleX: 1, duration: 0.3, ease: "power4.out" }, 0.4);

      // 4. Box flies towards the camera
      exitTl.to(perspectiveRef.current, { scale: 5, y: -100, rotateZ: 15, duration: 0.8, ease: "power3.in" }, 0.8);
      
      // 5. Loading text fades out
      exitTl.to(".loader-text", { opacity: 0, duration: 0.3 }, 0.8);

      // 6. The entire loader smoothly fades out, revealing the 3D warehouse behind it
      exitTl.to(container.current, { opacity: 0, duration: 0.8, ease: "power2.inOut" }, 1.3);
    }
  }, { scope: container, dependencies: [isDone] });

  // Update progress bar
  useGSAP(() => {
    const displayProgress = isDone ? 100 : Math.max(10, progress);
    gsap.to(".progress-bar-fill", { width: `${displayProgress}%`, duration: 0.3, ease: "power1.out" });
  }, { scope: container, dependencies: [progress, isDone] });

  return (
    <div
      ref={container}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--cream)] pt-24"
    >
      {/* 3D Box Container */}
      <div ref={perspectiveRef} className="perspective-1000 w-32 h-32 mb-10">
        <div className="isometric-wrapper preserve-3d w-full h-full" style={{ transform: "rotateX(60deg) rotateZ(-45deg)" }}>
          <div 
            ref={boxRef} 
            className="oh-loader-box preserve-3d relative w-full h-full"
          >
            {/* Base */}
            <div className="absolute inset-0 bg-[var(--sand)] oh-border border-4"></div>
            
            {/* Walls */}
            {/* North Wall */}
            <div className="box-wall-n preserve-3d absolute inset-0 bg-[var(--white)] oh-border border-4 origin-top" style={{ transform: "rotateX(90deg)" }}>
              <div className="box-flap-n absolute top-full left-[-4px] right-[-4px] h-full bg-[var(--lime)] oh-border border-4 origin-top" style={{ transform: "rotateX(60deg)" }}></div>
            </div>
            
            {/* South Wall */}
            <div className="box-wall-s preserve-3d absolute inset-0 bg-[var(--white)] oh-border border-4 origin-bottom" style={{ transform: "rotateX(-90deg)" }}>
              <div className="box-flap-s absolute bottom-full left-[-4px] right-[-4px] h-full bg-[var(--lime)] oh-border border-4 origin-bottom" style={{ transform: "rotateX(-60deg)" }}></div>
            </div>
            
            {/* East Wall */}
            <div className="box-wall-e preserve-3d absolute inset-0 bg-[#E5E5E5] oh-border border-4 origin-right" style={{ transform: "rotateY(90deg)" }}>
              <div className="box-flap-e absolute right-full top-[-4px] bottom-[-4px] w-full bg-[#C2EB21] oh-border border-4 origin-right" style={{ transform: "rotateY(60deg)" }}></div>
            </div>
            
            {/* West Wall */}
            <div className="box-wall-w preserve-3d absolute inset-0 bg-[#E5E5E5] oh-border border-4 origin-left" style={{ transform: "rotateY(-90deg)" }}>
              <div className="box-flap-w absolute left-full top-[-4px] bottom-[-4px] w-full bg-[#C2EB21] oh-border border-4 origin-left" style={{ transform: "rotateY(-60deg)" }}></div>
            </div>

            {/* Tape */}
            <div className="box-tape absolute top-1/2 left-[-10%] right-[-10%] h-4 bg-[var(--espresso)] oh-border -translate-y-1/2 scale-x-0 origin-center opacity-80" style={{ transform: "translateZ(128px)" }}></div>
          </div>
        </div>
      </div>

      {/* Loading Text & Progress */}
      <div className="loader-text flex flex-col items-center gap-4 w-64">
        <Wordmark className="!text-[1.5rem]" />
        <div className="flex items-center justify-between w-full font-bold oh-mono text-[0.7rem] uppercase tracking-widest text-[var(--espresso)]">
          <span>Processing Inventory</span>
          <span>{isDone ? 100 : Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--sand)] oh-border overflow-hidden">
          <div className="progress-bar-fill h-full bg-[var(--lime)] w-[10%] border-r-2 border-black" />
        </div>
      </div>
    </div>
  );
}
