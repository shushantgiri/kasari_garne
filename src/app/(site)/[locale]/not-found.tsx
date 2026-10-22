import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page max-w-xl py-16 text-center">
      <p className="text-5xl font-bold text-brand">404</p>
      <h1 className="mt-3 text-2xl font-bold">यो पृष्ठ भेटिएन</h1>
      <p className="latin mt-1 text-ink-soft">Page not found</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/ne" className="btn-primary">गृहपृष्ठ</Link>
        <Link href="/ne/search" className="btn-secondary">खोज्नुहोस्</Link>
      </div>
    </div>
  );
}
