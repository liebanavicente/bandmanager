"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, RefreshCw } from "lucide-react";
import type { SyncProvider, SyncStatus } from "@prisma/client";
import { toast } from "sonner";
import { triggerSync } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SyncLog = {
  id: string;
  provider: SyncProvider;
  action: string;
  status: SyncStatus;
  createdAt: Date;
};

const providerLabels: Record<SyncProvider, string> = {
  WOOCOMMERCE: "WooCommerce",
  GELATO: "Gelato",
};

const syncStatusConfig: Record<
  SyncStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pendiente", className: "bg-amber-500/15 text-amber-700" },
  SUCCESS: { label: "Éxito", className: "bg-emerald-500/15 text-emerald-700" },
  FAILED: { label: "Error", className: "bg-destructive/15 text-destructive" },
};

export function SyncPanel({
  recentSyncs,
  integrations,
}: {
  recentSyncs: SyncLog[];
  integrations: { woocommerce: boolean; gelato: boolean };
}) {
  const [isPending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState<SyncProvider | null>(null);

  function handleSync(provider: SyncProvider) {
    setSyncing(provider);
    startTransition(async () => {
      const result = await triggerSync(provider);
      setSyncing(null);
      if (!("data" in result)) {
        toast.error("error" in result ? result.error : "Error al sincronizar");
        return;
      }
      toast.success(`Sincronización con ${providerLabels[provider]} completada`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>WooCommerce</CardTitle>
            <CardDescription>
              {integrations.woocommerce
                ? "Conectado — sincroniza pedidos y stock"
                : "No configurado (simulado en desarrollo)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleSync("WOOCOMMERCE")}
              disabled={isPending && syncing === "WOOCOMMERCE"}
            >
              {(isPending && syncing === "WOOCOMMERCE") ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              Sincronizar WooCommerce
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gelato</CardTitle>
            <CardDescription>
              {integrations.gelato
                ? "Conectado — print-on-demand"
                : "No configurado (simulado en desarrollo)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => handleSync("GELATO")}
              disabled={isPending && syncing === "GELATO"}
            >
              {(isPending && syncing === "GELATO") ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              Sincronizar Gelato
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de sincronización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentSyncs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin registros aún.</p>
          ) : (
            recentSyncs.map((log) => {
              const cfg = syncStatusConfig[log.status];
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{providerLabels[log.provider]}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.action} ·{" "}
                      {format(log.createdAt, "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}
                  >
                    {cfg.label}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}