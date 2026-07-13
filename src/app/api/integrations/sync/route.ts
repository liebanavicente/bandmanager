import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runIntegrationSync } from "@/lib/integrations/sync";
import { syncRequestSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
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

    const results = await runIntegrationSync(parsed.data.provider);

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