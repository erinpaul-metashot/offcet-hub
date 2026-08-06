"use client";

import NetworkBackground from "@/components/NetworkBackground";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// Custom easings and variants based on emil-design-eng philosophy
const easeOut = [0.23, 1, 0.32, 1] as const;
const easeInOut = [0.77, 0, 0.175, 1] as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: easeOut } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } }
};

const fadeRight = {
  hidden: { opacity: 0, x: -30, scale: 0.98 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.6, ease: easeOut } }
};

const springHover = {
  scale: 1.05,
  transition: { type: "spring" as const, stiffness: 400, damping: 10 }
};

export default function Home() {
  const router = useRouter();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // ... Any other effects if needed ...
  }, []);

  return (
    <main ref={mainRef} className="w-full min-h-[100dvh] md:h-screen overflow-y-auto md:snap-y md:snap-mandatory bg-charcoal text-pure-white overflow-x-hidden">
      <Script src="/liquid-glass.js" strategy="afterInteractive" />

      {/* TOP NAVBAR */}
      <Navbar scrollContainerRef={mainRef} showLoginButton showDemoButton />

      {/* SECTION 1: HERO */}
      <section className="relative w-full min-h-[100dvh] md:h-screen flex flex-col md:snap-start overflow-hidden bg-charcoal">

        {/* Top Charcoal Section (85%) */}
        <div className="h-[85dvh] md:h-[85vh] relative w-full px-6 sm:px-8 md:px-12 lg:px-16 pt-8 pb-8 sm:pb-12 md:pb-16 lg:pb-20 flex flex-col justify-end">
          <NetworkBackground className="text-white opacity-20 absolute inset-0 pointer-events-none" />

          {/* Main Content (Left Aligned) */}
          <motion.div 
            className="relative z-10 w-full lg:pl-12 mt-auto"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {/* Huge CIRKA Logo (Cropped via aspect ratio) */}
            <motion.div variants={fadeUp} className="relative w-full max-w-[75vw] sm:max-w-[65vw] lg:max-w-[55vw] xl:max-w-[45vw] aspect-[3/1] lg:aspect-[10/3] mb-4 md:mb-6">
              <Image src="/cirka-logo-white.png" alt="CIRKA" fill className="object-cover object-left" priority />
            </motion.div>

            {/* Subtitle 1 */}
            <motion.h1 variants={fadeUp} className="text-[5.5vw] sm:text-[4vw] md:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.4vw] md:whitespace-nowrap max-w-none font-bold uppercase text-pure-white mb-4 md:mb-6 tracking-wide">
              The missing infrastructure for secondary textile resources.
            </motion.h1>

            {/* Subtitle 2 */}
            <motion.p variants={fadeUp} className="text-xs md:text-sm lg:text-base font-light uppercase text-gray-300 tracking-wider max-w-4xl">
              Connecting materials, data and people to create measurable local value and impact.
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom White Partner Banner (15%) */}
        <div className="h-[15vh] bg-pure-white w-full flex items-center relative z-20 overflow-hidden group">
          {/* Infinite Scrolling Track */}
          <div className="flex items-center w-max animate-scroll group-hover:[animation-play-state:paused]">
            {/* Logo Set 1 */}
            <div className="flex items-center gap-8 md:gap-12 lg:gap-16 w-max pr-8 md:pr-12 lg:pr-16">
              <img src="/almi-logo.png" alt="almi" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
              <img src="/fellowfuture-logo.png" alt="Fellow Future" className="h-12 md:h-20 lg:h-24 w-auto object-contain scale-[1.8] md:scale-[2]" />
              <img src="/wda-logo.png" alt="WDA" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
              <img src="/norrkoping-logo.png" alt="Norrköping Science Park" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
              <img src="/esg-logo.jpg" alt="ESGs" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
              <img src="/interreg-logo.jpg" alt="Interreg" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
            </div>
            {/* Logo Set 2 (Duplicate for infinite scroll) */}
            <div className="flex items-center gap-8 md:gap-12 lg:gap-16 w-max pr-8 md:pr-12 lg:pr-16">
              <img src="/almi-logo.png" alt="almi" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
              <img src="/fellowfuture-logo.png" alt="Fellow Future" className="h-12 md:h-20 lg:h-24 w-auto object-contain scale-[1.8] md:scale-[2]" />
              <img src="/wda-logo.png" alt="WDA" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
              <img src="/norrkoping-logo.png" alt="Norrköping Science Park" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
              <img src="/esg-logo.jpg" alt="ESGs" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
              <img src="/interreg-logo.jpg" alt="Interreg" className="h-12 md:h-20 lg:h-24 w-auto object-contain" />
            </div>
          </div>
        </div>

      </section>

      {/* SECTION 2: THE GAP */}
      <section className="relative w-full min-h-[100dvh] md:h-screen md:snap-start flex flex-col justify-between overflow-hidden bg-pure-white">
        {/* Top White Area with Network */}
        <div className="relative w-full flex-1 bg-pure-white">
          <NetworkBackground className="text-charcoal opacity-10 absolute inset-0" />
        </div>

        {/* Middle Charcoal Area */}
        <div className="bg-charcoal text-pure-white py-10 md:py-12 lg:py-16 px-6 md:px-12 lg:px-16 flex flex-col items-center justify-center relative z-10 w-full shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <h2 className="text-3xl md:text-4xl font-bold uppercase mb-8 md:mb-10 lg:mb-12 text-center max-w-6xl tracking-wide md:whitespace-nowrap">
            Every major industry has an operating system
          </h2>

          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center w-full max-w-[90rem] gap-8 lg:gap-12"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
          >

            {/* Left Column - List */}
            <div className="flex-1 w-full text-base md:text-lg lg:text-xl font-light space-y-4 md:space-y-6 text-center md:text-left">
              <motion.p variants={fadeUp} className="md:whitespace-nowrap">Manufacturing has EPR</motion.p>
              <motion.p variants={fadeUp} className="md:whitespace-nowrap">Finance has banking infrastructure</motion.p>
              <motion.p variants={fadeUp} className="md:whitespace-nowrap">Retail has ecommerce platforms</motion.p>
              <motion.p variants={fadeUp} className="md:whitespace-nowrap">Logistics has global networks.</motion.p>
              <motion.p variants={fadeUp} className="font-bold pt-2 text-xl md:text-2xl lg:text-3xl text-pure-white md:whitespace-nowrap">
                Secondary textile resources has none.
              </motion.p>
            </div>

            {/* Middle Column - Arrow */}
            <motion.div variants={scaleIn} className="hidden md:flex items-center justify-center shrink-0 w-24 md:w-32 lg:w-40">
              <svg className="w-full text-cirka-orange drop-shadow-md" viewBox="0 0 100 40" fill="currentColor">
                <path d="M75,12 L75,0 L100,20 L75,40 L75,28 L0,28 L0,12 Z" />
              </svg>
            </motion.div>

            {/* Right Column - Logo & Text */}
            <div className="flex-1 w-full flex flex-col items-center justify-center shrink-0">
              <motion.div variants={scaleIn} className="relative w-24 sm:w-36 md:w-48 lg:w-56 aspect-square mb-6">
                <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
              </motion.div>
              <motion.p variants={fadeUp} className="font-bold uppercase text-center text-lg md:text-xl lg:text-2xl tracking-wide">
                That is the gap CIRKA exists to fill.
              </motion.p>
            </div>

          </motion.div>
        </div>

        {/* Bottom White Area with Network */}
        <div className="relative w-full flex-1 bg-pure-white">
          <NetworkBackground className="text-charcoal opacity-10 absolute inset-0" />
        </div>
      </section>

      {/* SECTION 3: VALUE IS LOST */}
      <section className="relative w-full min-h-[100dvh] md:h-screen grid grid-cols-1 lg:grid-cols-2 md:snap-start">
        <div className="bg-pure-white text-charcoal relative flex flex-col justify-center px-6 py-12 md:p-24">
          <NetworkBackground className="text-charcoal opacity-10 absolute inset-0 z-0" />

          {/* Decorative Circles */}
          {/* Orange circle: bottom left */}
          <div className="hidden md:block absolute top-12 md:top-auto md:bottom-4 lg:bottom-8 left-12 md:left-28 lg:left-48 w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-cirka-orange z-0 opacity-50 md:opacity-100"></div>
          {/* Tan/Grey circle: middle right */}
          <div className="hidden md:block absolute top-1/3 md:top-1/2 right-8 md:right-12 lg:right-24 w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-[#A19B86] z-0 -translate-y-1/2 opacity-50 md:opacity-100"></div>

          <motion.div 
            className="relative z-10 pointer-events-none"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
          >
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-bold uppercase mb-6 md:mb-8 pointer-events-auto">
              Value is lost....
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl sm:text-2xl md:text-3xl mb-8 md:mb-12 font-medium pointer-events-auto">
              WHEN RESOURCES, DATA AND PEOPLE REMAIN DISCONNECTED.
            </motion.p>
            <motion.ul variants={staggerContainer} className="space-y-4 text-lg sm:text-xl md:text-2xl font-light text-gray-500 pointer-events-auto">
              <motion.li variants={fadeRight}>Valuable materials.</motion.li>
              <motion.li variants={fadeRight}>Valuable skills.</motion.li>
              <motion.li variants={fadeRight}>Valuable communities.</motion.li>
              <motion.li variants={fadeRight}>Valuable data.</motion.li>
            </motion.ul>
            <motion.p variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black mt-10 md:mt-12 uppercase text-charcoal pointer-events-auto">
              DISCONNECTED.
            </motion.p>
          </motion.div>
        </div>

        <div className="bg-charcoal relative flex items-center justify-center p-6 md:p-8 lg:p-16 min-h-[400px] md:min-h-0">
          <motion.div 
            className="relative w-full h-full min-h-[300px] md:min-h-0 max-h-[80vh] border-[8px] md:border-[12px] border-pure-white bg-gray-200"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            whileInView={{ clipPath: "inset(0 0 0 0)" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: easeOut }}
          >
            <Image
              src="/cirka_textile_waste.png"
              alt="Textile Waste"
              fill
              className="object-cover"
            />
            {/* Green circle: overlapping the left edge */}
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
              className="absolute top-2/3 -left-4 md:-left-8 lg:-left-12 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-cirka-green z-20 -translate-y-1/2"
            ></motion.div>

            {/* White Outline Logo */}
            <motion.div 
              variants={fadeUp} 
              initial="hidden" 
              whileInView="show" 
              viewport={{ once: true }} 
              className="absolute -bottom-10 -right-4 md:-bottom-20 md:-right-8 z-20 w-32 h-32 md:w-56 md:h-56 drop-shadow-2xl"
            >
              <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: CIRKA CONNECTS */}
      <section className="relative w-full min-h-[100dvh] md:min-h-screen bg-[#F5F5F5] text-charcoal flex flex-col items-center justify-center md:snap-start overflow-hidden py-24 md:py-0">
        <NetworkBackground className="text-charcoal opacity-10 absolute inset-0 z-0" />

        {/* Header Block */}
        <div className="z-10 w-full flex justify-center mt-12 md:mt-0 md:absolute md:top-24">
          <div className="bg-[#545454] px-8 md:px-16 py-4 md:py-6 shadow-lg">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase text-pure-white tracking-wide">
              CIRKA CONNECTS
            </h2>
          </div>
        </div>

        {/* MOBILE LAYOUT (Stacked) */}
        <div className="md:hidden flex flex-col items-center w-full px-4 mt-8 z-10 max-w-sm">
          {/* Secondary Resources */}
          <div className="flex items-center space-x-4 bg-white pr-6 p-2 rounded-full shadow-md border-2 border-[#8CC63F] w-full">
            <div className="w-12 h-12 rounded-full bg-[#8CC63F] flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </div>
            <span className="font-bold text-base text-charcoal">Secondary Resources</span>
          </div>

          <div className="w-1 h-6 bg-cirka-orange"></div>

          {/* Cirka */}
          <div className="w-24 h-24 relative rounded-full bg-[#545454] flex items-center justify-center shadow-xl border-[4px] border-white shrink-0 z-20">
            <div className="w-full h-full relative scale-110">
              <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
            </div>
          </div>

          <div className="w-1 h-6 bg-cirka-orange"></div>

          {/* Grid of Outputs */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="flex flex-col items-center space-y-2 text-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-[#FF5C00] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <span className="font-bold text-sm text-charcoal">People</span>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-[#FF5C00] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span className="font-bold text-sm text-charcoal">Activation</span>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-[#545454] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <span className="font-bold text-sm text-charcoal">Data</span>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-[#545454] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              </div>
              <span className="font-bold text-sm text-charcoal">Traceability</span>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 col-span-2">
              <div className="w-12 h-12 rounded-full bg-[#8CC63F] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <span className="font-bold text-sm text-charcoal">Measurable Value</span>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT (SVG Diagram) */}
        <div className="hidden md:flex relative w-full items-center justify-center overflow-visible md:h-auto mt-24">
          <div className="relative w-full h-auto max-w-6xl aspect-[16/9] flex items-center justify-center origin-center shrink-0">

          {/* Connector Lines (SVG) */}
          <motion.svg 
            className="absolute inset-0 w-full h-full pointer-events-none z-0" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#FF5C00" />
              </marker>
            </defs>
            {/* Grey Lines */}
            <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="40" y1="50" x2="15" y2="35" stroke="#545454" strokeWidth="0.3" />
            <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="40" y1="50" x2="50" y2="25" stroke="#545454" strokeWidth="0.3" />
            <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="40" y1="50" x2="40" y2="80" stroke="#545454" strokeWidth="0.3" />

            {/* Orange Arrows */}
            <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, delay: 0.2, ease: easeOut } } }} x1="44" y1="50" x2="69" y2="28" stroke="#FF5C00" strokeWidth="0.4" markerEnd="url(#arrowhead)" />
            <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, delay: 0.2, ease: easeOut } } }} x1="44" y1="50" x2="69" y2="50" stroke="#FF5C00" strokeWidth="0.4" markerEnd="url(#arrowhead)" />
            <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, delay: 0.2, ease: easeOut } } }} x1="44" y1="50" x2="69" y2="72" stroke="#FF5C00" strokeWidth="0.4" markerEnd="url(#arrowhead)" />
          </motion.svg>

          {/* Central Node */}
          <div className="absolute top-[50%] left-[40%] -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center overflow-visible">
            <div className="relative w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full bg-[#545454] flex items-center justify-center shadow-xl border-[6px] border-white">
              <div className="w-full h-full relative scale-125">
                <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
              </div>
            </div>
          </div>

          {/* Secondary Resources (Left) */}
          <div className="absolute top-[35%] left-[15%] -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
            <div className="w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-[#8CC63F] flex items-center justify-center shadow-lg border-[4px] border-white shrink-0">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </div>
            <div className="absolute right-full mr-2 md:mr-4 bg-[#545454] text-white px-2 py-1 md:px-3 md:py-2 font-bold text-xs md:text-sm lg:text-base text-right leading-tight shadow-md whitespace-nowrap">
              Secondary<br />Resources
            </div>
          </div>

          {/* People (Top) */}
          <div className="absolute top-[25%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
            <div className="w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-[#FF5C00] flex items-center justify-center shadow-lg border-[4px] border-white shrink-0">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div className="absolute left-full ml-2 md:ml-4 bg-[#545454] text-white px-3 py-1 md:px-4 md:py-2 font-bold text-xs md:text-sm lg:text-base shadow-md whitespace-nowrap">
              People
            </div>
          </div>

          {/* Data (Bottom) */}
          <div className="absolute top-[80%] left-[40%] -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
            <div className="w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-[#545454] flex items-center justify-center shadow-lg border-[4px] border-white shrink-0">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div className="absolute top-full mt-2 md:mt-4 bg-[#545454] text-white px-4 py-1 md:px-6 md:py-2 font-bold text-xs md:text-sm lg:text-base shadow-md whitespace-nowrap">
              Data
            </div>
          </div>

          {/* Activation (Top Right) */}
          <div className="absolute top-[25%] left-[75%] -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
            <div className="w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-[#FF5C00] flex items-center justify-center shadow-lg border-[4px] border-white shrink-0">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="absolute left-full ml-3 md:ml-5 text-[#545454] font-bold text-sm md:text-lg lg:text-xl whitespace-nowrap">
              Activation
            </div>
          </div>

          {/* Traceability (Middle Right) */}
          <div className="absolute top-[50%] left-[75%] -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
            <div className="w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-[#545454] flex items-center justify-center shadow-lg border-[4px] border-white shrink-0">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            </div>
            <div className="absolute left-full ml-3 md:ml-5 text-[#545454] font-bold text-sm md:text-lg lg:text-xl whitespace-nowrap">
              Traceability
            </div>
          </div>

          {/* Measurable Value (Bottom Right) */}
          <div className="absolute top-[75%] left-[75%] -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
            <div className="w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-[#8CC63F] flex items-center justify-center shadow-lg border-[4px] border-white shrink-0">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <div className="absolute left-full ml-3 md:ml-5 text-[#545454] font-bold text-sm md:text-lg lg:text-xl leading-tight whitespace-nowrap">
              Measurable<br />Value
            </div>
          </div>

        </div>
        </div>
      </section>

      {/* SECTION 5: HOW CIRKA WORKS */}
      <section className="relative w-full min-h-[100dvh] md:min-h-screen bg-[#F5F5F5] text-charcoal flex flex-col items-center justify-center md:snap-start p-8 py-20 md:py-8 overflow-hidden">
        <NetworkBackground className="text-charcoal opacity-10 absolute inset-0 z-0 pointer-events-none" />

        <motion.div 
          className="relative z-10 bg-[#545454] px-6 md:px-12 py-4 mb-16 md:mb-24 shadow-md"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <h2 className="text-4xl md:text-5xl font-black uppercase text-pure-white text-center tracking-wide">
            How Cirka Works
          </h2>
        </motion.div>

        <motion.div 
          className="flex flex-col md:flex-row items-center md:items-start justify-between w-full max-w-5xl space-y-6 md:space-y-0 relative z-10 mt-8 md:mt-0"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
        >

          {/* Vertical connector line for mobile */}
          <motion.div 
            className="md:hidden absolute top-[10%] bottom-[10%] left-1/2 w-1 bg-cirka-orange -translate-x-1/2 z-0 origin-top"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: easeOut }}
          ></motion.div>

          {/* Connector lines for desktop (without absolute arrows) */}
          {/* top-[62px] perfectly centers the 4px (h-1) line with the 64px center of the circles */}
          <motion.div 
            className="hidden md:block absolute top-[62px] left-[10%] right-[10%] h-[4px] bg-cirka-orange z-0 origin-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: easeOut }}
          ></motion.div>

          {/* 1. Secondary Resources */}
          <motion.div variants={scaleIn} className="flex flex-col items-center z-10 w-48 relative group md:mt-4">
            {/* top-[3rem] (48px) + md:mt-4 (16px) = 64px perfectly aligns with the line center */}
            <div className="hidden md:block absolute top-[3rem] left-[8rem] -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-cirka-orange z-0"></div>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="w-24 h-24 rounded-full bg-cirka-green flex items-center justify-center shadow-lg border-[4px] border-[#F5F5F5] shrink-0 relative z-10">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </motion.div>
            <p className="mt-6 font-bold text-center text-sm md:text-base text-charcoal leading-tight">Secondary<br />Resources</p>
          </motion.div>

          {/* 2. CIRKA */}
          <motion.div variants={scaleIn} className="flex flex-col items-center z-20 w-48 relative group">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="w-32 h-32 relative drop-shadow-xl bg-charcoal rounded-full p-2 flex items-center justify-center border-[4px] border-[#F5F5F5] shrink-0 z-10">
              <div className="w-full h-full relative scale-110">
                <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
              </div>
            </motion.div>
            <p className="mt-4 font-black text-center text-lg md:text-xl text-cirka-orange uppercase">CIRKA</p>
          </motion.div>

          {/* 3. People */}
          <motion.div variants={scaleIn} className="flex flex-col items-center z-10 w-48 relative group md:mt-4">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="w-24 h-24 rounded-full bg-cirka-orange flex items-center justify-center shadow-lg border-[4px] border-[#F5F5F5] shrink-0 relative z-10">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </motion.div>
            <p className="mt-6 font-bold text-center text-sm md:text-base text-charcoal">People</p>
          </motion.div>

          {/* 4. Local Economy */}
          <motion.div variants={scaleIn} className="flex flex-col items-center z-10 w-48 relative group md:mt-4">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="w-24 h-24 rounded-full bg-cirka-orange flex items-center justify-center shadow-lg border-[4px] border-[#F5F5F5] shrink-0 relative z-10">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </motion.div>
            <p className="mt-6 font-bold text-center text-sm md:text-base text-charcoal">Local Economy</p>
          </motion.div>

          {/* 5. Impact */}
          <motion.div variants={scaleIn} className="flex flex-col items-center z-10 w-48 relative group md:mt-4">
            <div className="hidden md:block absolute top-[3rem] right-[8rem] -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-cirka-orange z-0"></div>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="w-24 h-24 rounded-full bg-cirka-green flex items-center justify-center shadow-lg border-[4px] border-[#F5F5F5] shrink-0 relative z-10">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </motion.div>
            <p className="mt-6 font-bold text-center text-sm md:text-base text-charcoal">Impact</p>
          </motion.div>
        </motion.div>

        <p className="text-xl md:text-2xl font-bold uppercase mt-24 text-center w-full max-w-none px-4 tracking-wide text-charcoal relative z-10">
          Connecting materials, people and data to create measurable local value and impact.
        </p>
      </section>

      {/* SECTION 6: BUILT AROUND PEOPLE */}
      <section className="relative w-full min-h-[100dvh] md:min-h-screen bg-charcoal text-pure-white flex flex-col items-center justify-center md:snap-start py-20 px-6 md:p-12 lg:p-16 overflow-hidden">
        <NetworkBackground className="text-white opacity-20 z-0" />

        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase mb-8 md:mb-12 text-center tracking-tighter relative z-10 shrink-0">
          Built Around People
        </h2>

        <div className="relative z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

          <div className="w-full lg:w-1/2 flex flex-col justify-center shrink-0">
            <p className="text-[2.8vw] sm:text-[2.2vw] md:text-lg lg:text-xl xl:text-2xl font-bold uppercase mb-4 md:mb-6 whitespace-nowrap tracking-tight">
              Technology doesn't create circularity. People do.
            </p>
            <p className="text-[2vw] sm:text-[1.6vw] md:text-base lg:text-lg xl:text-xl font-light mb-8 md:mb-10 whitespace-nowrap">
              CIRKA exists to connect everyone already creating value.
            </p>
            <div className="relative w-full max-w-[90%] mx-auto lg:max-w-none aspect-video border-4 md:border-8 border-pure-white shadow-2xl shrink-0">
              <Image
                src="/cirka_sewing_machine.png"
                alt="Person sewing"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="w-full lg:w-1/2 relative min-h-0 lg:min-h-[400px] flex flex-col items-center justify-center overflow-visible mt-6 lg:mt-0">
            
            {/* MOBILE LAYOUT (Pills) */}
            <div className="flex lg:hidden flex-wrap justify-center gap-3 w-full max-w-sm mx-auto z-10 pb-12">
              <div className="bg-cirka-green px-5 py-2.5 rounded-full font-bold text-sm text-white shadow-lg border-2 border-white/20">Textile Collectors</div>
              <div className="bg-cirka-green px-5 py-2.5 rounded-full font-bold text-sm text-white shadow-lg border-2 border-white/20">Brands</div>
              <div className="bg-cirka-green px-5 py-2.5 rounded-full font-bold text-sm text-white shadow-lg border-2 border-white/20">Manufacturers</div>
              <div className="bg-cirka-orange px-5 py-2.5 rounded-full font-bold text-sm text-white shadow-lg border-2 border-white/20">Re-Makers</div>
              <div className="bg-cirka-orange px-5 py-2.5 rounded-full font-bold text-sm text-white shadow-lg border-2 border-white/20">Local Communities</div>
              <div className="bg-cirka-orange px-5 py-2.5 rounded-full font-bold text-sm text-white shadow-lg border-2 border-white/20">Educational Institutions</div>
              <div className="bg-[#444444] px-5 py-2.5 rounded-full font-bold text-sm text-white shadow-lg border-2 border-white/50">Technology Providers</div>
              <div className="bg-[#444444] px-5 py-2.5 rounded-full font-bold text-sm text-white shadow-lg border-2 border-white/50">Government & Trade</div>
            </div>

            {/* DESKTOP LAYOUT (SVG Diagram) */}
            <motion.div 
              className="hidden lg:flex relative w-[600px] h-[600px] items-center justify-center scale-[0.65] xl:scale-[0.75] origin-center shrink-0"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-10%" }}
              variants={staggerContainer}
            >

              {/* Central Logo */}
              <motion.div variants={scaleIn} className="w-64 h-64 absolute z-30 flex items-center justify-center">
                <div className="w-full h-full relative scale-125">
                  <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
                </div>
              </motion.div>

              {/* Connecting Lines */}
              <motion.svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 600 600">
                <g stroke="white" strokeWidth="6">
                  <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="300" y1="205" x2="300" y2="40" />
                  <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="367" y1="233" x2="484" y2="116" />
                  <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="395" y1="300" x2="560" y2="300" />
                  <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="367" y1="367" x2="484" y2="484" />
                  <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="300" y1="395" x2="300" y2="560" />
                  <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="233" y1="367" x2="116" y2="484" />
                  <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="205" y1="300" x2="40" y2="300" />
                  <motion.line variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1, ease: easeOut } } }} x1="233" y1="233" x2="116" y2="116" />
                </g>
              </motion.svg>

              {/* Role Bubbles */}
              <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="absolute left-[300px] top-[40px] w-32 h-32 rounded-full bg-cirka-green flex items-center justify-center text-center font-bold text-lg shadow-xl z-20 -translate-x-1/2 -translate-y-1/2 border-[3px] border-pure-white leading-tight text-white">
                Textile<br />Collectors
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="absolute left-[484px] top-[116px] w-32 h-32 rounded-full bg-cirka-green flex items-center justify-center text-center font-bold text-lg shadow-xl z-20 -translate-x-1/2 -translate-y-1/2 border-[3px] border-pure-white leading-tight text-white">
                Brands
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="absolute left-[560px] top-[300px] w-32 h-32 rounded-full bg-cirka-orange flex items-center justify-center text-center font-bold text-lg shadow-xl z-20 -translate-x-1/2 -translate-y-1/2 border-[3px] border-pure-white leading-tight text-white">
                Re-Makers
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="absolute left-[484px] top-[484px] w-32 h-32 rounded-full bg-cirka-orange flex items-center justify-center text-center font-bold text-lg shadow-xl z-20 -translate-x-1/2 -translate-y-1/2 border-[3px] border-pure-white leading-tight text-white">
                Local<br />Communities
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="absolute left-[300px] top-[560px] w-32 h-32 rounded-full bg-cirka-orange flex items-center justify-center text-center font-bold text-lg shadow-xl z-20 -translate-x-1/2 -translate-y-1/2 border-[3px] border-pure-white leading-tight text-white">
                Educational<br />Institutions
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="absolute left-[116px] top-[484px] w-32 h-32 rounded-full bg-charcoal flex items-center justify-center text-center font-bold text-lg shadow-xl z-20 -translate-x-1/2 -translate-y-1/2 border-[3px] border-pure-white leading-tight text-white">
                Technology<br />Providers
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="absolute left-[40px] top-[300px] w-32 h-32 rounded-full bg-charcoal flex items-center justify-center text-center font-bold text-base shadow-xl z-20 -translate-x-1/2 -translate-y-1/2 border-[3px] border-pure-white leading-tight px-2 text-white">
                Government<br />& Trade<br />Assoc.
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ scale: 1.05 }} className="absolute left-[116px] top-[116px] w-32 h-32 rounded-full bg-cirka-green flex items-center justify-center text-center font-bold text-lg shadow-xl z-20 -translate-x-1/2 -translate-y-1/2 border-[3px] border-pure-white leading-tight text-white">
                Manufacturers
              </motion.div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* SECTION 7: THE WORLD IS CHANGING */}
      <section className="relative w-full min-h-[100dvh] md:h-screen grid grid-cols-1 lg:grid-cols-2 md:snap-start">
        <div className="bg-charcoal relative flex items-center justify-center p-6 md:p-8 lg:p-16 min-h-[350px] lg:min-h-[500px]">
          <motion.div 
            className="relative w-full h-full min-h-[250px] lg:min-h-[400px] max-h-[80vh] border-[6px] md:border-8 border-pure-white shadow-2xl"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
          >
            <Image
              src="/cirka_pattern_maker.png"
              alt="Pattern Maker"
              fill
              className="object-cover"
            />
            <motion.div variants={scaleIn} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10%" }} className="absolute -bottom-16 -left-16 z-20 w-48 h-48 drop-shadow-2xl">
              <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
            </motion.div>
          </motion.div>
        </div>

        <div className="bg-pure-white text-charcoal relative flex flex-col justify-center p-8 md:p-12 lg:p-16">
          <NetworkBackground className="text-charcoal opacity-10 absolute inset-0 pointer-events-none" />
          <motion.div 
            className="relative z-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-8 lg:mb-12 tracking-tight">
              The World Is<br />Changing.
            </motion.h2>
            <motion.ul variants={staggerContainer} className="space-y-4 lg:space-y-6 text-lg md:text-xl lg:text-2xl font-light">
              <motion.li variants={fadeUp}>Consumers demand transparency.</motion.li>
              <motion.li variants={fadeUp}>Brands need measurable impact.</motion.li>
              <motion.li variants={fadeUp}>Manufacturers need new value streams.</motion.li>
              <motion.li variants={fadeUp}>Governments require accountability.</motion.li>
            </motion.ul>
            <motion.div variants={staggerContainer} className="mt-8 lg:mt-12 space-y-2 lg:space-y-4">
              <motion.p variants={fadeUp} className="text-lg md:text-xl lg:text-2xl font-bold uppercase">
                Technology now makes it possible.
              </motion.p>
              <motion.p variants={fadeUp} className="text-lg md:text-xl lg:text-2xl font-bold uppercase">
                Infrastructure has become essential.
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 8: MEASURABLE IMPACT */}
      <section className="relative w-full min-h-[100dvh] md:min-h-screen bg-pure-white text-charcoal flex flex-col items-center justify-start md:snap-start pt-8 pb-16 px-4 md:px-8">
        <NetworkBackground className="text-charcoal opacity-10 z-0" />

        <motion.div 
          className="relative z-10 w-full flex justify-center mb-16 mt-8"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <div className="bg-charcoal text-pure-white py-6 px-16 shadow-xl">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest">
              Measurable Impact
            </h2>
          </div>
        </motion.div>

        <motion.div 
          className="relative z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-8 mt-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
        >

          {/* Social */}
          <motion.div variants={fadeUp} className="flex flex-col items-center flex-1 w-full relative z-10">
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
              <motion.div whileHover={springHover} className="absolute inset-0 rounded-full border-8 border-cirka-orange overflow-hidden shadow-2xl bg-white z-0">
                <Image src="/cirka_pattern_maker.png" alt="Social" fill className="object-cover opacity-80" />
                <div className="absolute inset-0 bg-black/20"></div>
              </motion.div>
              <div className="absolute inset-x-0 bottom-8 flex justify-center z-10">
                <span className="bg-cirka-orange text-white font-bold px-4 py-2 uppercase tracking-wider shadow">Social</span>
              </div>
              {/* Far Left Logo (moved away) */}
              <div className="hidden lg:flex absolute -left-12 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#545454] items-center justify-center shadow-2xl z-20">
                <div className="relative w-full h-full scale-[1.25]">
                  <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
                </div>
              </div>
            </div>
            <div className="text-center font-bold text-lg md:text-xl uppercase space-y-2">
              <p>Communities Connected</p>
              <p>Jobs Created</p>
              <p>Skills Developed</p>
            </div>
          </motion.div>

          {/* Environmental */}
          <motion.div variants={fadeUp} className="flex flex-col items-center flex-1 w-full relative z-20 lg:-mx-12">
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
              <motion.div whileHover={springHover} className="absolute inset-0 rounded-full border-8 border-cirka-orange overflow-hidden shadow-2xl bg-white z-0">
                <Image src="/cirka_textile_waste.png" alt="Environmental" fill className="object-cover opacity-80" />
                <div className="absolute inset-0 bg-black/20"></div>
              </motion.div>
              <div className="absolute inset-x-0 bottom-8 flex justify-center z-10">
                <span className="bg-cirka-orange text-white font-bold px-4 py-2 uppercase tracking-wider shadow">Environmental</span>
              </div>
              {/* Center Left Logo */}
              <div className="hidden lg:flex absolute -left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#545454] items-center justify-center shadow-2xl z-20">
                <div className="relative w-full h-full scale-[1.25]">
                  <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
                </div>
              </div>
              {/* Center Right Logo */}
              <div className="hidden lg:flex absolute -right-8 top-1/2 translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#545454] items-center justify-center shadow-2xl z-20">
                <div className="relative w-full h-full scale-[1.25]">
                  <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
                </div>
              </div>
            </div>
            <div className="text-center font-bold text-lg md:text-xl uppercase space-y-2">
              <p>Resources Activated</p>
              <p>Waste Diverted</p>
              <p>Materials Traced</p>
            </div>
          </motion.div>

          {/* Economic */}
          <motion.div variants={fadeUp} className="flex flex-col items-center flex-1 w-full relative z-10">
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
              <motion.div whileHover={springHover} className="absolute inset-0 rounded-full border-8 border-cirka-orange overflow-hidden shadow-2xl bg-white z-0">
                <Image src="/cirka_shopping_bags.png" alt="Economic" fill className="object-cover opacity-80" />
                <div className="absolute inset-0 bg-black/20"></div>
              </motion.div>
              <div className="absolute inset-x-0 bottom-8 flex justify-center z-10">
                <span className="bg-cirka-orange text-white font-bold px-4 py-2 uppercase tracking-wider shadow">Economic</span>
              </div>
              {/* Far Right Logo (moved away) */}
              <div className="hidden lg:flex absolute -right-12 top-1/2 translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#545454] items-center justify-center shadow-2xl z-20">
                <div className="relative w-full h-full scale-[1.25]">
                  <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
                </div>
              </div>
            </div>
            <div className="text-center font-bold text-lg md:text-xl uppercase space-y-2">
              <p>Value Generated</p>
              <p>Local Businesses Strengthened</p>
              <p>New Revenue Streams Created</p>
            </div>
          </motion.div>

        </motion.div>
      </section>
      {/* SECTION 9: ECOSYSTEM */}
      <section className="relative w-full min-h-[100dvh] md:h-screen flex flex-col lg:grid lg:grid-cols-2 lg:grid-rows-1 md:snap-start bg-charcoal overflow-hidden">
        <NetworkBackground className="text-white opacity-20 absolute inset-0 pointer-events-none" />

        <motion.div 
          className="relative z-10 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 h-full text-center py-16 md:py-0"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
        >
          <motion.h2 variants={fadeUp} className="text-[9vw] sm:text-[6vw] md:text-5xl lg:text-6xl font-black uppercase mb-4 md:mb-8 tracking-tight leading-tight shrink-0 md:whitespace-nowrap">
            We Are Building ......
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[5vw] sm:text-[3.5vw] md:text-2xl lg:text-3xl font-bold uppercase mb-8 md:mb-16 shrink-0 md:whitespace-nowrap">
            Something bigger than a platform.
          </motion.p>

          <motion.ul variants={staggerContainer} className="space-y-4 md:space-y-6 lg:space-y-8 text-[4.5vw] sm:text-[3vw] md:text-xl lg:text-2xl font-bold uppercase shrink-0 md:whitespace-nowrap">
            <motion.li variants={fadeUp}>We are building an <span className="underline decoration-2 md:decoration-4 underline-offset-4 md:underline-offset-8">ecosystem.</span></motion.li>
            <motion.li variants={fadeUp}>Shared Infrastructure.</motion.li>
            <motion.li variants={fadeUp}>New Opportunities.</motion.li>
            <motion.li variants={fadeUp}>Measurable Impact.</motion.li>
          </motion.ul>

          <motion.div variants={scaleIn} className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mt-8 md:mt-12 relative shrink-0">
            <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain" />
          </motion.div>
        </motion.div>

        <div className="relative z-10 flex items-center justify-center p-6 md:p-12 lg:p-16 h-full min-h-[350px] lg:min-h-0 w-full">
          <motion.div 
            className="relative w-full h-full min-h-[250px] lg:min-h-0 max-h-[100%] lg:max-h-[80vh] border-[4px] md:border-8 border-pure-white shadow-2xl"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            whileInView={{ clipPath: "inset(0 0 0 0)" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: easeOut }}
          >
            <Image
              src="/cirka_group_selfie.png"
              alt="Group Selfie"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* SECTION 10: IMAGINE A WORLD WHERE */}
      <section className="relative w-full min-h-[100dvh] md:h-screen md:snap-start overflow-hidden flex items-center justify-center p-4 md:p-8">
        <div className="absolute inset-0 z-0">
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: easeOut }}
            viewport={{ once: true }}
            className="absolute inset-0"
          >
            <Image
              src="/cirka_sewing_machine.png"
              alt="Background"
              fill
              className="object-cover"
            />
          </motion.div>
          <NetworkBackground className="text-white opacity-70 absolute inset-0 pointer-events-none" />
        </div>

        <motion.div 
          className="relative z-10 w-full h-full bg-[#545454] border-[8px] md:border-[12px] border-pure-white p-6 md:p-10 lg:p-16 flex flex-col justify-center shadow-2xl"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
        >

          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10%" }} className="relative z-10 flex flex-col justify-center h-full">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide text-pure-white shrink-0 relative z-10">
              IMAGINE A WORLD WHERE ...
            </motion.h2>

            <motion.div variants={staggerContainer} className="mt-6 md:mt-8 lg:mt-10 space-y-4 md:space-y-5 lg:space-y-6 text-base md:text-xl lg:text-2xl font-normal tracking-wide text-pure-white relative z-10">
              <motion.p variants={fadeUp}>Every community can create value from resources already around them.</motion.p>
              <motion.p variants={fadeUp}>Every maker has access to the materials they need.</motion.p>
              <motion.p variants={fadeUp}>Every manufacturer has visibility.</motion.p>
              <motion.p variants={fadeUp}>Every brand can prove impact.</motion.p>
              <motion.p variants={fadeUp}>Every resource gets another chance.</motion.p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 md:mt-12 lg:mt-16 w-full shrink-0 relative z-10">
              <p className="text-xl md:text-2xl lg:text-3xl font-bold uppercase text-pure-white tracking-wide max-w-[65%]">
                THAT'S THE FUTURE WE ARE BUILDING.
              </p>
            </motion.div>
          </motion.div>

          {/* Logo is absolute so its massive size doesn't break the text layout height */}
          <motion.div 
            className="absolute bottom-6 right-6 md:bottom-10 md:right-10 lg:bottom-16 lg:right-16 w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-[22rem] xl:h-[22rem] pointer-events-none z-0"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5, ease: easeOut }}
          >
            <Image src="/cirka-c-logo-white.png" alt="Cirka" fill className="object-contain object-right-bottom" />
          </motion.div>

        </motion.div>
      </section>

      {/* SECTION 11: CONTACT / CTA */}
      <section className="relative w-full min-h-[100dvh] md:min-h-screen md:snap-start flex flex-col bg-charcoal">

        {/* Top Dark Section */}
        <div className="relative w-full flex-grow flex flex-col items-center justify-center px-4 md:px-8 py-8 md:py-10">

          {/* Network Graphic (Left aligned like in the image) */}
          <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none opacity-40">
            <NetworkBackground className="text-white w-full h-full" />
          </div>

          <motion.div 
            className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center mt-4 md:mt-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
          >

            {/* Logo */}
            <motion.div variants={fadeUp} className="relative w-[90vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] max-w-[45rem] h-28 sm:h-36 md:h-48 lg:h-56 xl:h-64 max-h-[25vh] md:max-h-[35vh] mb-4 md:mb-6 flex items-center justify-center pointer-events-none">
              <Image src="/cirka-logo-white.png" alt="Cirka" fill className="object-cover object-center" priority />
            </motion.div>

            {/* Subheadings - Reduced Size */}
            <motion.h2 variants={fadeUp} className="text-[4vw] sm:text-[3vw] md:text-lg lg:text-xl xl:text-2xl font-bold uppercase tracking-wide text-pure-white mb-2 md:mb-4 leading-snug">
              CONNECTING SECONDARY RESOURCES,PEOPLE AND DATA.<br />
              CREATING MEASURABLE VALUE.
            </motion.h2>

            <motion.h3 variants={fadeUp} className="text-[3.5vw] sm:text-[2.5vw] md:text-base lg:text-lg xl:text-xl font-bold uppercase tracking-wider text-cirka-orange mb-4 md:mb-8" style={{ WebkitTextStroke: '0.5px #FF5C00' }}>
              HELP BUILD THE MISSING INFRASTRUCTURE.
            </motion.h3>

            {/* Paragraph - Reduced Size */}
            <motion.p variants={fadeUp} className="text-[3.5vw] sm:text-[2vw] md:text-sm lg:text-base xl:text-lg font-medium text-pure-white max-w-4xl leading-relaxed px-4 md:px-0">
              Whether you are a manufacturer, a brand, a university, a government agency, an innovator, a<br className="hidden md:block" />
              technology provider, a recycler, or an organization working closely with any aspect of the built<br className="hidden md:block" />
              environment: your expertise and engagement are crucial.
            </motion.p>

            <motion.button onClick={() => router.push('/login')} variants={fadeUp} className="mt-6 md:mt-10 lg:mt-12 group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 font-bold text-pure-white transition-all duration-200 bg-cirka-orange border-2 border-cirka-orange hover:bg-transparent hover:text-cirka-orange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cirka-orange overflow-hidden shadow-lg z-20 pointer-events-auto cursor-pointer">
              <span className="text-[3vw] sm:text-[2vw] md:text-base lg:text-lg tracking-wider uppercase">Get Started</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </motion.button>

          </motion.div>
        </div>

        {/* Bottom White Section */}
        <div className="relative w-full shrink-0 pb-4 flex flex-col z-20">
          <div className="w-full flex-grow bg-pure-white flex flex-col items-center justify-center text-charcoal px-4 py-6 md:py-8">
            <div className="flex flex-col items-center space-y-2 md:space-y-3 text-sm md:text-base lg:text-lg font-medium">
              <p className="font-bold uppercase text-base md:text-lg lg:text-xl xl:text-2xl mb-1 md:mb-2 tracking-wide">
                TZE CHING YEUNG (FOUNDER)
              </p>
              <p className="tracking-wide">+46 (0)70 5508833</p>
              <p className="tracking-wide">hello@cirka.global</p>
              <p className="tracking-wide">https://www.linkedin.com/in/tzechingyeung/</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer 
          className="w-full bg-[#333333] py-4 md:py-6 px-4 md:px-8 border-t border-white/10 shrink-0"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: easeOut }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-pure-white/60">
            <p>&copy; {new Date().getFullYear()} CIRKA. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-pure-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-pure-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-pure-white transition-colors">LinkedIn</a>
            </div>
          </div>
        </motion.footer>

      </section>

    </main>
  );
}
