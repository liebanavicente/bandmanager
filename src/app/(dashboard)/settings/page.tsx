import { redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Settings } from "lucide-react";
import { getSettings, triggerSync } from "@/actions/settings";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function syncAction(formData: FormData) {
  "use server";
  const provider = formData.get("provider") as "WOOCOMMERCE" | "GELATO";
  await triggerSync(provider);
}

export default async function SettingsPage() {
  const settings = await getSettings();

  if (settings.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajustes"
        description="Configuración, integraciones y sincronización."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Integraciones</CardTitle>
            <CardDescription>
              Conexiones preparadas para WooCommerce y Gelato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">WooCommerce</p>
                <p className="text-sm text-muted-foreground">Tienda online</p>
              </div>
              <Badge variant={settings.integrations.woocommerce ? "default" : "secondary"}>
                {settings.integrations.woocommerce ? "Configurado" : "Simulado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Gelato</p>
                <p className="text-sm text-muted-foreground">Impresión bajo demanda</p>
              </div>
              <Badge variant={settings.integrations.gelato ? "default" : "secondary"}>
                {settings.integrations.gelato ? "Configurado" : "Simulado"}
              </Badge>
            </div>
            <form action={syncAction} className="flex flex-wrap gap-2">
              <Button type="submit" name="provider" value="WOOCOMMERCE">
                Sincronizar WooCommerce
              </Button>
              <Button type="submit" name="provider" value="GELATO" variant="outline">
                Sincronizar Gelato
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro de sincronización</CardTitle>
            <CardDescription>Últimas operaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings.recentSyncs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin registros aún.</p>
            ) : (
              settings.recentSyncs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.provider} ·{" "}
                      {format(log.createdAt, "d MMM yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                  <StatusBadge kind="sync" status={log.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Información del sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>BandManager v0.1.0 — MVP local</p>
          <p>Almacenamiento de archivos: local (preparado para S3/R2)</p>
        </CardContent>
      </Card>
    </div>
  );
}