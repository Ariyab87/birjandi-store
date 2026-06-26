'use client';

import { useEffect, useRef } from 'react';

export default function ScrollVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      const p = video.play();
      if (p !== undefined) p.catch(() => {});
    };

    // Try immediately — works on Chrome, Firefox, Safari desktop (muted+autoplay allowed)
    tryPlay();

    // Safari sometimes needs a tiny delay after metadata loads
    const onCanPlay = () => tryPlay();
    video.addEventListener('canplay', onCanPlay);

    // iOS Safari: needs a user gesture — touchstart fires before scroll
    const onGesture = () => tryPlay();
    window.addEventListener('touchstart', onGesture, { passive: true });
    window.addEventListener('click', onGesture, { once: true });
    window.addEventListener('scroll', onGesture, { passive: true, once: true });

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      window.removeEventListener('touchstart', onGesture);
      window.removeEventListener('click', onGesture);
      window.removeEventListener('scroll', onGesture);
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
