"use client";

import { ClientLibraryHeader } from "@/components/clients/client-library-header";
import { ClientList } from "@/components/clients/client-list";
import { useClientList } from "@/hooks/clients/use-client-list";
import { useClientSearch } from "@/hooks/clients/use-client-search";

export default function ClientsPage() {
  const { search, setSearch, debouncedSearch } = useClientSearch();
  const {
    clients,
    loading,
    refreshClients,
    page,
    setPage,
    listTotalCount,
    totalPages,
  } = useClientList({ search, debouncedSearch });

  const hasActiveFilters = search.trim().length > 0;

  const showFilteredEmpty =
    !loading &&
    clients.length === 0 &&
    hasActiveFilters &&
    listTotalCount === 0;

  return (
    <div className="space-y-6 rounded-[2rem] bg-background px-2 pb-6 sm:px-4">
      <ClientLibraryHeader
        totalClients={listTotalCount}
        visibleClientCount={clients.length}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        search={search}
        onSearchChange={setSearch}
      />

      <ClientList
        clients={clients}
        loading={loading}
        showFilteredEmpty={showFilteredEmpty}
        onClearFilters={() => setSearch("")}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRefresh={refreshClients}
      />
    </div>
  );
}
