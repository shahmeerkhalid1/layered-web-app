"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionUpgradeBanner } from "@/components/billing/subscription-upgrade-banner";
import { ClientLibraryHeader } from "@/components/clients/client-library-header";
import { ClientList } from "@/components/clients/client-list";
import { useClientList } from "@/hooks/clients/use-client-list";
import { useClientSearch } from "@/hooks/clients/use-client-search";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";

export default function ClientsPage() {
  const router = useRouter();
  const { search, setSearch, debouncedSearch } = useClientSearch();
  const { status: subscriptionStatus, clientQuotaReached } = useSubscriptionStatus();
  const {
    clients,
    loading,
    refreshClients,
    page,
    setPage,
    listTotalCount,
    totalPages,
  } = useClientList({ search, debouncedSearch });

  const openNewClient = useCallback(() => {
    if (clientQuotaReached) {
      router.push("/billing");
      return;
    }
    router.push("/clients/new");
  }, [clientQuotaReached, router]);

  const clientLimit = subscriptionStatus?.clientLimit ?? 5;
  const clientCount = subscriptionStatus?.clientCount ?? listTotalCount ?? 0;

  const hasActiveFilters = search.trim().length > 0;

  const showFilteredEmpty =
    !loading &&
    clients.length === 0 &&
    hasActiveFilters &&
    listTotalCount === 0;

  return (
    <div className="space-y-6 rounded-[2rem] px-2 pb-6 sm:px-4">
      {clientQuotaReached ? (
        <SubscriptionUpgradeBanner
          resourceLabel="clients"
          count={clientCount}
          limit={clientLimit}
          description="Upgrade to Instructor+ for unlimited client notes and full client management — from $10 NZD/month billed annually."
        />
      ) : null}

      <ClientLibraryHeader
        totalClients={listTotalCount}
        visibleClientCount={clients.length}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        search={search}
        onSearchChange={setSearch}
        onNewClient={openNewClient}
        createDisabled={clientQuotaReached}
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
