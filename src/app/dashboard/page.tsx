export const metadata = { title: "Dashboard — Stratbook" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
        <p className="font-medium">Your playbooks will appear here.</p>
        <p className="mt-2 text-sm text-muted">
          Accounts, folders, and uploads are not implemented yet.
        </p>
      </div>
    </div>
  );
}
