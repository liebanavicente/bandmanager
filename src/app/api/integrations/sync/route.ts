import { NextResponse } from "next/server";
import { getOptionalSessionUser } from "@/lib/session";
import { runIntegrationSync } from "@/lib/integrations/sync";
import { syncRequestSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getOptionalSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo un administrador puede ejecutar sincronizaciones." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = syncRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de sincronización inválidos." }, { status: 400 });
    }

    const results = await runIntegrationSync(user.bandId, parsed.data.provider);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Ha ocurrido un error inesperado." },
      { status: 500 },
    );
  }
}