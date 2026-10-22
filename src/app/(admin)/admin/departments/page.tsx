import { getAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/ui";
import { getDepartments } from "@/lib/content/repo";
import { categories } from "@/lib/content/categories";
import { DepartmentEditor } from "@/components/admin/DepartmentEditor";

export default async function DepartmentsPage() {
  await getAdmin();
  const departments = await getDepartments();
  return (
    <div className="space-y-6">
      <PageHeader title="Departments" subtitle="Government offices that guides link to." />
      <DepartmentEditor departments={departments} />
      <section>
        <h2 className="font-bold">Categories</h2>
        <p className="text-sm text-ink-soft">Categories are fixed in <code>src/lib/content/categories.ts</code> (they map to the homepage sections). Translations can be edited there.</p>
        <ul className="mt-2 flex flex-wrap gap-2">{categories.map((c) => <li key={c.id} className="chip bg-white text-ink ring-1 ring-paper-line">{c.name.ne} · {c.name.en}</li>)}</ul>
      </section>
    </div>
  );
}
