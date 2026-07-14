import { notFound } from 'next/navigation';

/** Catch-all: any URL that doesn't match a real page renders the styled
 *  locale-aware 404 (not-found.tsx) instead of Next's plain default. */
export default function CatchAll() {
  notFound();
}
