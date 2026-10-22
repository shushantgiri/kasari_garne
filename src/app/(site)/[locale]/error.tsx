"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page max-w-xl py-16 text-center" role="alert">
      <h1 className="text-2xl font-bold">केही गडबड भयो</h1>
      <p className="latin mt-1 text-ink-soft">Something went wrong</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">फेरि प्रयास गर्नुहोस् · Try again</button>
    </div>
  );
}
