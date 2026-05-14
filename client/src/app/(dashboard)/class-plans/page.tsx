// "use client";

// import { useCallback, useState } from "react";
// import { ClassPlanLibraryHeader } from "@/components/class-plans/class-plan-library-header";
// import { ClassPlanFolderSidebar } from "@/components/class-plans/class-plan-folder-sidebar";
// import { ClassPlanSearch } from "@/components/class-plans/class-plan-search";
// import { ClassPlanList } from "@/components/class-plans/class-plan-list";
// import { CreateTemplateDialog } from "@/components/class-plans/create-template-dialog";
// import { DeleteClassPlanDialog } from "@/components/class-plans/delete-class-plan-dialog";
// import { FolderDialog } from "@/components/exercises/folder-dialog";
// import { useClassPlanLibrary } from "@/hooks/class-plans/use-class-plan-library";
// import type { ClassPlanTemplate } from "@/lib/types";

// export default function ClassPlansPage() {
//   const library = useClassPlanLibrary();
//   const { folderDialog } = library;
//   const [createOpen, setCreateOpen] = useState(false);
//   const [createDialogKey, setCreateDialogKey] = useState(0);
//   const [deleteTarget, setDeleteTarget] = useState<ClassPlanTemplate | null>(null);

//   const openCreateDialog = useCallback(() => {
//     setCreateDialogKey((k) => k + 1);
//     setCreateOpen(true);
//   }, []);

//   return (
//     <div className="relative space-y-6 rounded-[2rem] bg-background px-2 pb-6 pt-2 sm:px-4">
//       <div className="pointer-events-none absolute top-16 right-10 h-48 w-48 rounded-full bg-secondary/60 blur-3xl" />
//       <ClassPlanLibraryHeader onNewPlan={openCreateDialog} />

//       <div className="relative flex flex-col gap-6 lg:flex-row">
//         <ClassPlanFolderSidebar
//           folders={library.folders}
//           totalTemplateCount={library.totalTemplateCount}
//           selectedFolder={library.selectedFolder}
//           onSelectFolder={library.setSelectedFolder}
//           onCreateFolder={folderDialog.openCreate}
//           onEditFolder={folderDialog.openEdit}
//           onDeleteFolder={folderDialog.delete}
//         />

//         <main className="min-w-0 flex-1 space-y-5">
//           <ClassPlanSearch
//             value={library.search}
//             onChange={library.setSearch}
//             classTypeFilter={library.classTypeFilter}
//             onClassTypeFilterChange={library.setClassTypeFilter}
//             classStyleFilter={library.classStyleFilter}
//             onClassStyleFilterChange={library.setClassStyleFilter}
//             tagFilter={library.tagFilter}
//             onTagFilterChange={library.setTagFilter}
//           />
//           <ClassPlanList
//             templates={library.templates}
//             loading={library.loading}
//             onDuplicate={library.duplicateClassPlan}
//             onRequestDelete={setDeleteTarget}
//             onNewPlan={openCreateDialog}
//           />
//         </main>
//       </div>

//       <FolderDialog
//         open={folderDialog.open}
//         onOpenChange={folderDialog.setOpen}
//         folderName={folderDialog.name}
//         onFolderNameChange={folderDialog.setName}
//         editingFolder={folderDialog.editingFolder}
//         onSave={folderDialog.save}
//       />

//       <CreateTemplateDialog
//         key={createDialogKey}
//         open={createOpen}
//         onOpenChange={setCreateOpen}
//         folders={library.folders}
//         onCreated={() => {
//           void Promise.all([library.refreshTemplates(), library.refreshFolders()]);
//         }}
//       />

//       <DeleteClassPlanDialog
//         open={deleteTarget !== null}
//         onOpenChange={(open) => {
//           if (!open) setDeleteTarget(null);
//         }}
//         template={deleteTarget}
//         onConfirm={async (templateId) => {
//           await library.deleteClassPlan(templateId);
//           setDeleteTarget(null);
//         }}
//       />
//     </div>
//   );
// }


import React from 'react'

const page = () => {
  return (
    <div>Class Plans</div>
  )
}

export default page
