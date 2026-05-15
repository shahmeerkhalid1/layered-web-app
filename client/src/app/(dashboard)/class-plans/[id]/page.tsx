import { ClassPlanDetailView } from "@/components/class-plans/class-plan-detail-view";

interface ClassPlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassPlanDetailPage({ params }: ClassPlanDetailPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pt-14 md:p-6 md:pt-6">
      <ClassPlanDetailView planId={id} />
    </div>
  );
}
