"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import FadingVideo from "@/components/FadingVideo";
import BlurText from "@/components/BlurText";

// --- Simple Inline SVGs ---
const ArrowIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7M7 7h10v10" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6,4 20,12 6,20" />
  </svg>
);

const BookLogo = () => (
  <svg className="w-16 h-16 mx-auto text-violet-500 filter drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" viewBox="0 0 100 100" fill="currentColor">
    <path d="M50 35 L80 50 L50 65 L20 50 Z" fill="url(#gradBook)" />
    <path d="M50 35 L80 50 L50 48 L20 50 Z" fill="#7c3aed" opacity="0.6" />
    <path d="M50 35 L35 25 L35 32" stroke="#a78bfa" strokeWidth="2" fill="none" />
    <path d="M20 55 C25 60, 35 68, 48 70 C40 65, 30 55, 20 48 C15 52, 16 54, 20 55 Z" fill="#8b5cf6" />
    <path d="M80 55 C75 60, 65 68, 52 70 C60 65, 70 55, 80 48 C85 52, 84 54, 80 55 Z" fill="#8b5cf6" />
    <defs>
      <linearGradient id="gradBook" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
        <stop offset="100%" stopColor="#6d28d9" stopOpacity="1" />
      </linearGradient>
    </defs>
  </svg>
);

const CardIcon = ({ path }: { path: string }) => (
  <svg className="w-6 h-6 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
    <path d={path} />
  </svg>
);

export default function HomePage() {
  const { data: session } = useSession();

  const containerAnims: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const itemAnims: Variants = {
    hidden: { filter: "blur(10px)", opacity: 0, y: 25 },
    visible: { filter: "blur(0px)", opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
  };

  return (
    <div className="bg-black text-white font-body selection:bg-violet-500/30 overflow-x-hidden">
      
      {/* ─── GLOBAL FIXED HEADER ─── */}
      <nav className="fixed top-4 left-0 right-0 z-50 flex justify-between items-center px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center cursor-pointer">
            <span className="font-heading italic text-2xl text-white group-hover:text-violet-400 transition-colors">pt</span>
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-white font-semibold text-sm leading-none">PeerTutor</div>
            <div className="text-violet-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">Achieving Academic Success</div>
          </div>
        </Link>

        {/* Center Pill Navigation */}
        <div className="hidden lg:flex liquid-glass rounded-full px-2 py-1.5 items-center gap-1">
          <Link href="/" className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-white/70 hover:text-white transition-colors">Home</Link>
          <Link href="/tutors" className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-white/70 hover:text-white transition-colors">Find Tutors</Link>
          <a href="#capabilities" className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-white/70 hover:text-white transition-colors">How it Works</a>
          {session ? (
            <Link href="/dashboard" className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-white/70 hover:text-white transition-colors">Dashboard</Link>
          ) : (
            <Link href="/login" className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-white/70 hover:text-white transition-colors">Sign In</Link>
          )}
        </div>

        {/* Right Phone and CTA Button */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <span className="text-[10px] text-white/40 block uppercase tracking-wider">Contact Us</span>
            <a href="tel:0818566566" className="text-violet-400 hover:text-violet-300 font-bold text-sm transition-colors">1-800-PEER-TUTOR</a>
          </div>
          <Link
            href={session ? "/dashboard" : "/register"}
            className="bg-white hover:bg-white/90 text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
          >
            {session ? "Dashboard" : "Get Started"}
            <ArrowIcon />
          </Link>
        </div>
      </nav>

      {/* ─── SECTION 1: HERO (h-screen) ─── */}
      <section className="relative h-screen w-full overflow-hidden flex flex-col justify-between">
        <div className="absolute inset-0 z-0">
          <FadingVideo
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4"
            className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top w-full h-full"
            style={{ minWidth: "120%", minHeight: "120%" }}
          />
          <div className="absolute inset-0 bg-black/65 z-0 pointer-events-none" />
        </div>

        <motion.div
          variants={containerAnims}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex-1 flex flex-col items-center justify-center pt-28 px-4 text-center max-w-4xl mx-auto w-full"
        >
          {/* Logo element from HomeTutors style */}
          <motion.div variants={itemAnims} className="mb-4">
            <BookLogo />
          </motion.div>

          {/* Heading */}
          <div className="mt-2">
            <BlurText
              text="Parents & Students Choose PeerTutor"
              className="text-5xl md:text-7xl lg:text-8xl font-heading italic text-white leading-[0.95] tracking-[-3px] max-w-4xl"
            />
          </div>

          {/* Subtitle */}
          <motion.p variants={itemAnims} className="mt-6 text-sm md:text-base text-white/80 max-w-2xl font-light leading-relaxed">
            Achieving academic success through elite, 1-on-1 peer mentoring. Learn directly from top-performing university peers who have conquered your exact course material.
          </motion.p>

          {/* Three Pill Buttons (Values) from HomeTutors layout */}
          <motion.div variants={itemAnims} className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="liquid-glass border border-white/10 text-white/90 font-medium text-xs md:text-sm px-6 py-3.5 rounded-full">
              ✨ Free Consultation
            </span>
            <span className="liquid-glass border border-white/10 text-white/90 font-medium text-xs md:text-sm px-6 py-3.5 rounded-full">
              🎓 Qualified Tutors
            </span>
            <span className="liquid-glass border border-white/10 text-white/90 font-medium text-xs md:text-sm px-6 py-3.5 rounded-full">
              💳 Easy Payment Plans
            </span>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={itemAnims} className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              href="/tutors"
              className="liquid-glass-strong hover:bg-white/5 text-white px-8 py-3.5 rounded-full text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition-all border border-white/10 active:scale-95"
            >
              Browse Tutors
              <ArrowIcon />
            </Link>
            <a
              href="#capabilities"
              className="text-white/85 hover:text-white text-xs uppercase font-bold tracking-wider flex items-center gap-2 py-2 px-4 transition-colors"
            >
              <PlayIcon />
              View Our Video
            </a>
          </motion.div>
        </motion.div>

        {/* Bottom Trust/University List */}
        <motion.div variants={itemAnims} initial="hidden" animate="visible" className="relative z-10 flex justify-center items-center gap-8 md:gap-12 pb-8 opacity-60">
          {["Stanford", "Berkeley", "MIT", "Oxford", "Harvard"].map((name) => (
            <span key={name} className="font-heading italic text-xl md:text-2xl tracking-tight text-white hover:opacity-100 transition-opacity cursor-default">{name}</span>
          ))}
        </motion.div>
      </section>

      {/* ─── SECTION 2: CAPABILITIES (min-h-screen) ─── */}
      <section id="capabilities" className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col justify-between">
        <div className="absolute inset-0 z-0">
          <FadingVideo
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_093722_ccfc7ebf-182f-419f-8a62-2dc02db7dd9d.mp4"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black z-0 pointer-events-none" />
        </div>

        <div className="relative z-10 px-6 md:px-16 lg:px-20 pt-32 pb-16 flex flex-col justify-between flex-1 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="text-left">
            <span className="text-violet-400 font-mono text-xs tracking-widest block mb-4 uppercase">// How We Help</span>
            <h2 className="font-heading italic text-6xl md:text-8xl leading-[0.9] tracking-[-3px] text-white">
              Achieving academic<br />success
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            
            {/* Card 1: Academic Design */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[340px] flex flex-col justify-between hover:border-violet-500/30 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="liquid-glass h-11 w-11 rounded-[0.75rem] flex items-center justify-center">
                  <CardIcon path="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </div>
                <span className="liquid-glass rounded-full px-3 py-1 text-[9px] text-white/80 font-bold uppercase tracking-wider">Syllabus Prep</span>
              </div>
              <div>
                <h3 className="font-heading italic text-3xl md:text-4xl tracking-[-1px] mb-2 text-white">Academic Design</h3>
                <p className="text-xs text-white/70 font-light leading-relaxed max-w-[32ch]">
                  We structure personalized study roadmaps and resources that feel tailored to you — detailed study guides, conceptual breakdowns, and homework assistance.
                </p>
              </div>
            </div>

            {/* Card 2: Peer Engineering */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[340px] flex flex-col justify-between hover:border-violet-500/30 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="liquid-glass h-11 w-11 rounded-[0.75rem] flex items-center justify-center">
                  <CardIcon path="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                </div>
                <span className="liquid-glass rounded-full px-3 py-1 text-[9px] text-white/80 font-bold uppercase tracking-wider">1-on-1 Practice</span>
              </div>
              <div>
                <h3 className="font-heading italic text-3xl md:text-4xl tracking-[-1px] mb-2 text-white">Peer Engineering</h3>
                <p className="text-xs text-white/70 font-light leading-relaxed max-w-[32ch]">
                  High-yield learning sessions built on clear explanations and active practice. Get hands-on support for debugging complex code, solving proofs, or writing essays.
                </p>
              </div>
            </div>

            {/* Card 3: Growth & Strategy */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[340px] flex flex-col justify-between hover:border-violet-500/30 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="liquid-glass h-11 w-11 rounded-[0.75rem] flex items-center justify-center">
                  <CardIcon path="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                </div>
                <span className="liquid-glass rounded-full px-3 py-1 text-[9px] text-white/80 font-bold uppercase tracking-wider">Score Boost</span>
              </div>
              <div>
                <h3 className="font-heading italic text-3xl md:text-4xl tracking-[-1px] mb-2 text-white">Growth & Strategy</h3>
                <p className="text-xs text-white/70 font-light leading-relaxed max-w-[32ch]">
                  Passing is just the beginning. We partner with you to turn a challenging course into a stepping stone using proven study techniques and exam preparation.
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-xs font-light">
              &copy; {new Date().getFullYear()} PeerTutor. Crafted by students, for students.
            </p>
            <div className="flex gap-6 text-xs text-white/40 font-light">
              <Link href="/tutors" className="hover:text-white transition-colors">Browse Tutors</Link>
              <Link href="/register" className="hover:text-white transition-colors">Become a Tutor</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            </div>
          </footer>
        </div>
      </section>

    </div>
  );
}
