export default function ToolLoading() {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading tool">
      <div className="skeleton h-10 w-full rounded-input" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-48 w-full rounded-card" />
        <div className="skeleton h-48 w-full rounded-card" />
      </div>
    </div>
  );
}
