'use client';

import { useEffect, useRef } from 'react';

export default function ScrollVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Try immediate autoplay (works on most browsers with muted+playsInline)
    video.play().catch(() => {});

    const tryPlay = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    // iOS fires touchstart before scroll — catches it earlier
    window.addEventListener('touchstart', tryPlay, { passive: true, once: true });
    window.addEventListener('scroll', tryPlay, { passive: true, once: true });

    return () => {
      window.removeEventListener('touchstart', tryPlay);
      window.removeEventListener('scroll', tryPlay);
    };
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
