import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSetlistStageView } from "@/actions/setlists";
import { isActionSuccess } from "@/lib/action-result";
import { renderSetlistPdf, type SetlistPdfFonts, type SetlistPdfVariant } from "@/lib/pdf/setlist-pdf";
import { getOptionalSessionUser } from "@/lib/session";
import { getBand } from "@/lib/workspace";

type RouteContext = { params: Promise<{ id: string }> };

let fontsCache: Promise<SetlistPdfFonts> | null = null;

function loadFonts() {
  fontsCache ??= (async () => {
    const dir = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
    const [display, serif] = await Promise.all([
      readFile(path.join(dir, "Anton-Regular.ttf")),
      readFile(path.join(dir, "InstrumentSerif-Italic.ttf")),
    ]);
    return { display: new Uint8Array(display), serif: new Uint8Array(serif) };
  })();
  return fontsCache;
}

function slug(text: string) {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "setlist"
  );
}

/** PDF imprimible del setlist: ?variant=stage (escenario) | full (detallado). */
export async function GET(request: Request, context: RouteContext) {
  const user = await getOptionalSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id } = await context.params;
  const variant: SetlistPdfVariant =
    new URL(request.url).searchParams.get("variant") === "full" ? "full" : "stage";

  // getSetlistStageView ya comprueba permisos y que el setlist sea de la sala
  const result = await getSetlistStageView(id);
  if (!isActionSuccess(result)) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  const setlist = result.data;
  const band = await getBand(user.bandId);

  try {
    const pdf = await renderSetlistPdf(
      {
        bandName: band?.name ?? "BandManager",
        name: setlist.name,
        notes: setlist.notes,
        event: setlist.event
          ? { title: setlist.event.title, startAt: setlist.event.startAt, venue: setlist.event.venue }
          : null,
        totalDuration: setlist.totalDuration,
        items: setlist.items,
      },
      await loadFonts(),
      variant,
    );

    const filename = `${slug(setlist.name)}-${variant === "stage" ? "escenario" : "detallado"}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 500 });
  }
}
