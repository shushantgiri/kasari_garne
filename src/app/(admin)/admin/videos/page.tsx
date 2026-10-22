import Link from "next/link";
import { getAdmin } from "@/lib/admin/auth";
import { getGuidesForAdmin } from "@/lib/content/repo";
import { videoAwaitingReview } from "@/lib/admin/attention";
import type { Guide } from "@/lib/content/types";
import { PageHeader, PublishBadge, VideoBadge } from "@/components/admin/ui";

const KIND: Record<Guide["video"]["kind"], string> = { live: "Live animation", generated: "Rendered MP4", uploaded: "Uploaded recording" };
const title = (g: Guide) => g.title.en || g.title.ne || g.slug;

/** Every guide's tutorial: what kind it is, whether a reviewer approved it, and which captions exist. */
export default async function VideosPage() {
  await getAdmin();
  const { guides, problem } = await getGuidesForAdmin();
  const rows = [...guides].sort((a, b) => Number(videoAwaitingReview(b)) - Number(videoAwaitingReview(a)));
  const pending = rows.filter(videoAwaitingReview).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tutorial videos"
        subtitle={pending ? `${pending} MP4 ${pending === 1 ? "video is" : "videos are"} waiting for a reviewer. They stay hidden from visitors until approved.` : "Every guide has a live animation. Uploaded MP4s appear only after approval."}
      />
      {problem && <p role="alert" className="rounded-xl border border-brand/30 bg-brand-tint px-4 py-3 text-sm text-brand-dark"><strong>Database setup: </strong>{problem}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-paper-line bg-paper-warm text-xs font-semibold text-ink-soft">
            <tr>
              <th className="px-4 py-2.5">Guide</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Captions</th>
              <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {rows.map((g) => {
              const caps = [g.video.subtitles?.ne && "नेपाली", g.video.subtitles?.en && "English"].filter(Boolean).join(", ");
              return (
                <tr key={g.slug} className="transition-colors hover:bg-paper-warm/60">
                  <td className="px-4 py-3">
                    <span className="block font-semibold">{title(g)}</span>
                    <span className="mt-0.5 inline-block"><PublishBadge g={g} /></span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{KIND[g.video.kind]}</td>
                  <td className="px-4 py-3"><VideoBadge g={g} /></td>
                  <td className="px-4 py-3 text-ink-soft">{g.video.src ? caps || <span className="text-warn">None</span> : "Built in"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/guides/${g.slug}?tab=Video`} className="btn-ghost min-h-[36px] px-2.5 text-sm text-sky">
                      {videoAwaitingReview(g) ? "Review" : "Manage"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
