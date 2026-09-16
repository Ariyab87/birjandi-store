'use client';

import { useEffect, useRef, useState } from 'react';

const ENAMAD_ID = '6834202';
const ENAMAD_CODE = 'TDgtiQs8u7Ad5lkk0PzMYIaEQiVFPzI7';

// Enamad trust seal. The logo is served by trustseal.enamad.ir, which can fail
// (seal not yet activated, or visitor outside Iran) — fall back to a text badge
// so the footer never shows a broken image.
export default function EnamadSeal() {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // The image may have already errored before hydration attached onError.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      href={`https://trustseal.enamad.ir/?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`}
      className="inline-block mt-4"
    >
      {failed ? (
        <span className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-gray-200 hover:bg-white/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z M9 12l2 2 4-4" />
          </svg>
          نماد اعتماد الکترونیکی
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          referrerPolicy="origin"
          src={`https://trustseal.enamad.ir/logo.aspx?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`}
          alt="نماد اعتماد الکترونیکی"
          style={{ cursor: 'pointer' }}
          className="max-w-[110px] h-auto"
          onError={() => setFailed(true)}
          {...{ code: ENAMAD_CODE }}
        />
      )}
    </a>
  );
}
