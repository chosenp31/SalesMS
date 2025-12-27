import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* List with stats */}
      <ListSkeleton columns={10} rows={10} showStats={true} showSearch={true} />
    </div>
  );
}
