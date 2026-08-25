"use client";

import { useEffect, useRef, useState } from "react";

interface FadingVideoProps {
  src: string | string[];
  className?: string;
  style?: React.CSSProperties;
}

export default function FadingVideo({ src, className, style }: FadingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  const animationRef = useRef<number | null>(null);

  const sources = Array.isArray(src) ? src : [src];
  const activeSrc = sources[currentSrcIndex];

  const fade = (targetOpacity: number, duration: number, callback?: () => void) => {
    if (!videoRef.current) return;
    const startOpacity = parseFloat(videoRef.current.style.opacity || "0");
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const newOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
      if (videoRef.current) {
        videoRef.current.style.opacity = String(newOpacity);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (callback) callback();
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  const handleLoadedData = () => {
    fade(1, 500);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const remaining = video.duration - video.currentTime;
    if (
      remaining <= 0.55 &&
      parseFloat(video.style.opacity || "1") > 0.05 &&
      !video.dataset.fadingOut
    ) {
      video.dataset.fadingOut = "true";
      fade(0, 550);
    }
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    delete video.dataset.fadingOut;
    if (sources.length === 1) {
      video.currentTime = 0;
      video.play().catch(() => {});
      fade(1, 500);
    } else {
      setCurrentSrcIndex((prev) => (prev + 1) % sources.length);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.style.opacity = "0";
      delete video.dataset.fadingOut;
      video.load();
      video.play().catch(() => {});
    }
  }, [activeSrc]);

  return (
    <video
      ref={videoRef}
      src={activeSrc}
      className={className}
      style={{ ...style, opacity: 0 }}
      onLoadedData={handleLoadedData}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  );
}
