'use client';

import { useEffect, useRef } from 'react';

export default function ScrollVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();

    const onScroll = () => {
      if (playedRef.current) return;
      // Trigger when user scrolls at all (page is no longer at top)
      if (window.scrollY > 10) {
        playedRef.current = true;
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
