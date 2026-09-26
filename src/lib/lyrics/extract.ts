/**
 * Texto de los archivos de letras: Word (.docx), PDF, texto plano y ZIP con
 * cualquiera de ellos. Se ejecuta en el navegador (las librerías se cargan
 * solo al importar), así el archivo no se sube: solo viaja el texto.
 */

export type ExtractedDocument =
  | { filename: string; text: string }
  | { filename: string; error: string };

export const ACCEPTED_EXTENSIONS = [".docx", ".pdf", ".txt", ".md", ".cho", ".chopro", ".zip"];

const MAX_ZIP_ENTRIES = 200;

function extension(name: string) {
  return /\.[^.]+$/.exec(name.toLowerCase())?.[0] ?? "";
}

function basename(name: string) {
  return name.replace(/^.*[\\/]/, "");
}

function decodeText(bytes: Uint8Array) {
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  // Archivos antiguos de Windows vienen en latin1: se nota por los "�"
  return utf8.includes("�") ? new TextDecoder("windows-1252").decode(bytes) : utf8;
}

async function docxText(bytes: Uint8Array) {
  const mod = await import("mammoth");
  const mammoth = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  // "arrayBuffer" en el navegador, "buffer" en Node (tests)
  const result = await mammoth.extractRawText({ arrayBuffer, buffer: arrayBuffer } as unknown as { arrayBuffer: ArrayBuffer });
  // mammoth cierra cada párrafo con "\n\n": un párrafo vacío (hueco entre estrofas) queda como "\n\n\n\n"
  return result.value.replace(/\n\n/g, "\n");
}

type PdfTextItem = { str: string; transform: number[]; height: number };

/**
 * El texto del PDF viene en trozos con su posición: se agrupan en líneas por
 * altura y, si el salto entre dos líneas es bastante mayor que el habitual,
 * se deja una línea en blanco (el hueco entre estrofas).
 */
async function pdfText(bytes: Uint8Array) {
  const { getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const pages: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    const lines: { y: number; x: number; text: string }[][] = [];
    for (const item of content.items as PdfTextItem[]) {
      if (!("str" in item) || !item.str.trim()) continue;
      const [, , , , x, y] = item.transform;
      const tolerance = Math.max(2, (item.height || 10) * 0.4);
      const line = lines.find((l) => Math.abs(l[0].y - y) <= tolerance);
      if (line) line.push({ x, y, text: item.str });
      else lines.push([{ x, y, text: item.str }]);
    }
    lines.sort((a, b) => b[0].y - a[0].y);
    const gaps = lines.slice(1).map((l, i) => lines[i][0].y - l[0].y).filter((g) => g > 0);
    const usual = gaps.length ? [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 0;
    const out: string[] = [];
    lines.forEach((line, i) => {
      if (i > 0 && usual && lines[i - 1][0].y - line[0].y > usual * 1.6) out.push("");
      out.push(
        line
          .sort((a, b) => a.x - b.x)
          .map((part) => part.text)
          .join(" ")
          .replace(/\s{2,}/g, " ")
          .trim(),
      );
    });
    pages.push(out.join("\n"));
  }
  return pages.join("\n\n");
}

async function extractBytes(filename: string, bytes: Uint8Array): Promise<ExtractedDocument[]> {
  const ext = extension(filename);
  try {
    switch (ext) {
      case ".docx":
        return [{ filename, text: await docxText(bytes) }];
      case ".pdf":
        return [{ filename, text: await pdfText(bytes) }];
      case ".txt":
      case ".md":
      case ".cho":
      case ".chopro":
        return [{ filename, text: decodeText(bytes) }];
      case ".zip": {
        const { unzipSync } = await import("fflate");
        const entries = unzipSync(bytes, {
          filter: (file) => {
            const name = basename(file.name);
            return (
              !file.name.startsWith("__MACOSX/") &&
              !name.startsWith(".") &&
              !name.startsWith("~$") &&
              // .doc entra para avisar de que hay que convertirlo
              (ACCEPTED_EXTENSIONS.includes(extension(name)) || extension(name) === ".doc") &&
              extension(name) !== ".zip"
            );
          },
        });
        const names = Object.keys(entries).sort((a, b) => a.localeCompare(b, "es", { numeric: true })).slice(0, MAX_ZIP_ENTRIES);
        if (names.length === 0) return [{ filename, error: "El ZIP no contiene letras en .docx, .pdf o .txt." }];
        const nested = await Promise.all(names.map((name) => extractBytes(basename(name), entries[name])));
        return nested.flat();
      }
      case ".doc":
        return [{ filename, error: "Formato .doc antiguo: ábrelo en Word y guárdalo como .docx." }];
      case ".pages":
      case ".odt":
      case ".rtf":
        return [{ filename, error: "Exporta el documento a .docx o PDF para importarlo." }];
      default:
        return [{ filename, error: "Formato no admitido." }];
    }
  } catch {
    return [{ filename, error: "No se pudo leer el archivo (¿está dañado o protegido?)." }];
  }
}

export async function extractDocuments(files: File[]): Promise<ExtractedDocument[]> {
  const results = await Promise.all(
    files.map(async (file) => extractBytes(file.name, new Uint8Array(await file.arrayBuffer()))),
  );
  return results.flat();
}

/** Para los tests: misma lógica a partir de bytes. */
export { extractBytes as extractDocumentBytes };
