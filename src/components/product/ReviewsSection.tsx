'use client';

import { useState } from 'react';
import ReviewStars from '@/components/ui/ReviewStars';

interface Review {
  documentId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Props {
  productDocumentId: string;
  locale: string;
  initialReviews: Review[];
  initialAverage: number;
  initialCount: number;
}

function faDate(iso: string, fa: boolean): string {
  return new Intl.DateTimeFormat(fa ? 'fa-IR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
}

export default function ReviewsSection({ productDocumentId, locale, initialReviews, initialAverage, initialCount }: Props) {
  const fa = locale === 'fa';
  const [reviews, setReviews] = useState(initialReviews);
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit() {
    if (!name.trim() || !comment.trim()) return;
    setSubmitting(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDocumentId, name, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || (fa ? 'خطا در ثبت نظر' : 'Failed to submit review'));
        setStatus('error');
        return;
      }
      setStatus('sent');
      setName('');
      setComment('');
      setRating(5);
      setShowForm(false);
    } catch {
      setErrorMsg(fa ? 'خطا در اتصال' : 'Connection error');
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-navy-700 mb-1">{fa ? 'نظرات کاربران' : 'Customer Reviews'}</h2>
          {count > 0 ? (
            <div className="flex items-center gap-2">
              <ReviewStars rating={average} size={18} />
              <span className="text-sm text-gray-500">
                {fa
                  ? `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(average)} از ۵ · ${new Intl.NumberFormat('fa-IR').format(count)} نظر`
                  : `${average.toFixed(1)} out of 5 · ${count} review${count > 1 ? 's' : ''}`}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-400">{fa ? 'هنوز نظری ثبت نشده — اولین نفر باشید' : 'No reviews yet — be the first'}</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm bg-navy-700 hover:bg-navy-800 text-white font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {fa ? 'ثبت نظر' : 'Write a review'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{fa ? 'امتیاز شما:' : 'Your rating:'}</span>
            <ReviewStars rating={rating} size={22} interactive onChange={setRating} />
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={fa ? 'نام شما' : 'Your name'}
            maxLength={80}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-navy-500"
          />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={fa ? 'نظر شما درباره این محصول...' : 'Your thoughts on this product...'}
            maxLength={1000}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-navy-500 resize-none"
          />
          {status === 'error' && <p className="text-sm text-red-500">{errorMsg}</p>}
          <button
            onClick={submit}
            disabled={submitting || !name.trim() || !comment.trim()}
            className="bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {submitting ? (fa ? 'در حال ارسال...' : 'Submitting...') : (fa ? 'ارسال نظر' : 'Submit review')}
          </button>
        </div>
      )}

      {status === 'sent' && (
        <p className="text-sm bg-green-50 text-green-700 border border-green-100 rounded-xl px-4 py-3 mb-6">
          {fa ? 'نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود. ممنون از وقتی که گذاشتید 🙏' : 'Your review was submitted and will appear after moderation. Thank you!'}
        </p>
      )}

      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.documentId} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-navy-700 text-sm">{r.name}</span>
                <span className="text-xs text-gray-400">{faDate(r.createdAt, fa)}</span>
              </div>
              <ReviewStars rating={r.rating} size={14} />
              <p className="text-sm text-gray-600 leading-relaxed mt-2">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
