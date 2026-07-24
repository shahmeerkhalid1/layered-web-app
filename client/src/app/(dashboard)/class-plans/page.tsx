"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ClassPlanLibraryHeader } from "@/components/class-plans/class-plan-library-header";
import { ClassPlanList } from "@/components/class-plans/class-plan-list";
import { ClassPlanUpgradeBanner } from "@/components/class-plans/class-plan-upgrade-banner";
import { CreateTemplateDialog } from "@/components/class-plans/create-template-dialog";
import { DeleteClassPlanDialog } from "@/components/class-plans/delete-class-plan-dialog";
import { ExerciseLibraryPagination } from "@/components/exercises/exercise-library-pagination";
import { FolderDialog } from "@/components/exercises/folder-dialog";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { useClassPlanLibrary } from "@/hooks/class-plans/use-class-plan-library";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import type { ClassPlanFolder, ClassPlanTemplate } from "@/lib/types";

export default function ClassPlansPage() {
  const router = useRouter();
  const library = useClassPlanLibrary();
  const { status: subscriptionStatus, quotaReached } = useSubscriptionStatus();
  const { folderDialog } = library;
  const [createOpen, setCreateOpen] = useState(false);
  const [createDialogKey, setCreateDialogKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ClassPlanTemplate | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<ClassPlanFolder | null>(null);
  const [deleteFolderPending, setDeleteFolderPending] = useState(false);

  const openCreateDialog = useCallback(() => {
    if (quotaReached) {
      router.push("/billing");
      return;
    }
    setCreateDialogKey((k) => k + 1);
    setCreateOpen(true);
  }, [quotaReached, router]);

  const createDisabled = quotaReached;
  const duplicateDisabled = quotaReached;
  const quotaLimit = subscriptionStatus?.classPlanLimit ?? 3;
  const quotaCount = subscriptionStatus?.classPlanCount ?? library.totalTemplateCount ?? 0;

  const clearAllFilters = useCallback(() => {
    library.setSearch("");
    library.setSelectedFolder(null);
    library.setClassTypeFilter("");
    library.setClassStyleFilter("");
    library.setTagFilter(null);
  }, [library]);

  const hasActiveFilters =
    library.selectedFolder !== null ||
    library.search.trim().length > 0 ||
    library.classTypeFilter.length > 0 ||
    library.classStyleFilter.length > 0 ||
    library.tagFilter !== null;

  const showFilteredEmpty =
    !library.loading &&
    library.templates.length === 0 &&
    hasActiveFilters &&
    library.listTotalCount === 0 &&
    library.totalTemplateCount !== undefined &&
    library.totalTemplateCount > 0;

  return (
    <div className="space-y-6 rounded-[2rem] px-2 pb-6 sm:px-4">
      {quotaReached ? (
        <ClassPlanUpgradeBanner
          classPlanCount={quotaCount}
          classPlanLimit={quotaLimit}
        />
      ) : null}

      <ClassPlanLibraryHeader
        totalPlans={
          library.listTotalCount ?? library.totalTemplateCount
        }
        folderCount={library.folders.length}
        visiblePlanCount={library.templates.length}
        loading={library.loading}
        hasActiveFilters={hasActiveFilters}
        onNewFolder={folderDialog.openCreate}
        onNewPlan={openCreateDialog}
        search={library.search}
        onSearchChange={library.setSearch}
        folders={library.folders}
        totalTemplateCount={library.totalTemplateCount}
        selectedFolder={library.selectedFolder}
        onSelectFolder={library.setSelectedFolder}
        onEditFolder={folderDialog.openEdit}
        onRequestDeleteFolder={setDeleteFolderTarget}
        classTypeFilter={library.classTypeFilter}
        onClassTypeFilterChange={library.setClassTypeFilter}
        classStyleFilter={library.classStyleFilter}
        onClassStyleFilterChange={library.setClassStyleFilter}
        tagFilter={library.tagFilter}
        onTagFilterChange={library.setTagFilter}
        onClearAllFilters={clearAllFilters}
        createDisabled={createDisabled}
      />

      <ClassPlanList
        templates={library.templates}
        loading={library.loading}
        onDuplicate={library.duplicateClassPlan}
        onRequestDelete={setDeleteTarget}
        onNewPlan={openCreateDialog}
        showFilteredEmpty={showFilteredEmpty}
        onClearFilters={clearAllFilters}
        duplicateDisabled={duplicateDisabled}
        createDisabled={createDisabled}
      />

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <ExerciseLibraryPagination
          page={library.page}
          totalPages={library.totalPages}
          onPageChange={library.setPage}
          loading={library.loading}
          ariaLabel="Class plan list pagination"
        />
      </div>

      <FolderDialog
        open={folderDialog.open}
        onOpenChange={folderDialog.setOpen}
        folderName={folderDialog.name}
        onFolderNameChange={folderDialog.setName}
        editingFolder={folderDialog.editingFolder}
        existingFolders={library.folders}
        onSave={folderDialog.save}
      />

      <CreateTemplateDialog
        key={createDialogKey}
        open={createOpen}
        onOpenChange={setCreateOpen}
        folders={library.folders}
        onCreated={() => {
          void Promise.all([library.refreshTemplates(), library.refreshFolders()]);
        }}
      />

      <DeleteClassPlanDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        template={deleteTarget}
        onConfirm={async (templateId) => {
          await library.deleteClassPlan(templateId);
          setDeleteTarget(null);
        }}
      />

      <ConfirmDestructiveDialog
        open={deleteFolderTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteFolderTarget(null);
        }}
        title="Delete folder?"
        description={
          deleteFolderTarget
            ? `“${deleteFolderTarget.name}” will be removed. Class plans in this folder stay in your library without a folder.`
            : "This folder will be removed."
        }
        confirmLabel="Delete"
        confirmPendingLabel="Deleting…"
        pending={deleteFolderPending}
        confirmDisabled={!deleteFolderTarget}
        onConfirm={async () => {
          if (!deleteFolderTarget) return;
          setDeleteFolderPending(true);
          try {
            await folderDialog.delete(deleteFolderTarget.id);
            setDeleteFolderTarget(null);
          } finally {
            setDeleteFolderPending(false);
          }
        }}
      />
    </div>
  );
}