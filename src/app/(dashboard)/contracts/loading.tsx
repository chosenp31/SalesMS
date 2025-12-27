import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContractsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
      </div>

      {/* List */}
      <ListSkeleton columns={9} rows={10} showSearch={true} />
    </div>
  );
}
