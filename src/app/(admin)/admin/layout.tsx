import "@fontsource/mukta/devanagari-400.css";
import "@fontsource/mukta/devanagari-600.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-600.css";
import "../../globals.css";
import type { Metadata } from "next";
import { hasSupabase } from "@/lib/supabase/env";
import { getAttentionCounts } from "@/lib/admin/counts";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Admin · Kasari Garne", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Badge counts are optional: if they fail to load, the admin still works without them.
  const counts = await getAttentionCounts().catch(() => null);
  return (
    <html lang="en">
      <body className="latin min-h-screen bg-paper-warm" suppressHydrationWarning>
        <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row">
          <AdminNav counts={counts} />
          <main id="main" className="min-w-0 flex-1">
            {!hasSupabase && (
              <div className="border-b border-warn/20 bg-warn-tint px-4 py-2 text-sm text-warn sm:px-8" role="status">
                <strong>Demo mode.</strong> Supabase isn&apos;t configured, so you&apos;re viewing the bundled content and nothing can be saved.
              </div>
            )}
            <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
