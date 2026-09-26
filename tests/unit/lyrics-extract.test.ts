// @vitest-environment node
import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractDocumentBytes } from "@/lib/lyrics/extract";

/** .docx mínimo válido con un párrafo por línea. */
function makeDocx(lines: string[]) {
  const paragraphs = lines.map((l) => `<w:p><w:r><w:t xml:space="preserve">${l}</w:t></w:r></w:p>`).join("");
  return zipSync({
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    "_rels/.rels": strToU8(
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    "word/document.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}</w:body></w:document>`,
    ),
  });
}

/** PDF con una línea por fila; las líneas vacías dejan un hueco como entre estrofas. */
async function makePdf(lines: string[]) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  lines.forEach((line, i) => {
    if (line) page.drawText(line, { x: 20, y: 360 - i * 18, size: 12, font });
  });
  return doc.save();
}

// Texto inventado para las pruebas
const LINES = ["Farolas de carton", "Tono: Mi menor", "", "Cruzo la avenida", "con prisa", "", "Estribillo", "farolas de carton"];

describe("extractDocumentBytes", () => {
  it("lee un .docx respetando los huecos entre estrofas", async () => {
    const [doc] = await extractDocumentBytes("farolas.docx", makeDocx(LINES));
    expect("text" in doc && doc.text.trimEnd()).toBe(LINES.join("\n"));
  });

  it("lee un PDF y reconstruye los huecos entre estrofas", async () => {
    const [doc] = await extractDocumentBytes("farolas.pdf", await makePdf(LINES));
    expect("text" in doc && doc.text).toBe(LINES.join("\n"));
  });

  it("abre un ZIP e ignora basura de macOS y formatos no admitidos", async () => {
    const zip = zipSync({
      "letras/02 segunda.txt": strToU8("dos"),
      "letras/01 primera.docx": makeDocx(["uno"]),
      "__MACOSX/letras/._01 primera.docx": strToU8("x"),
      "letras/portada.jpg": strToU8("x"),
      "letras/03 vieja.doc": strToU8("x"),
    });
    const docs = await extractDocumentBytes("letras.zip", zip);
    expect(docs.map((d) => [d.filename, "text" in d ? d.text.trim() : d.error])).toEqual([
      ["01 primera.docx", "uno"],
      ["02 segunda.txt", "dos"],
      ["03 vieja.doc", "Formato .doc antiguo: ábrelo en Word y guárdalo como .docx."],
    ]);
  });

  it("explica qué hacer con formatos que no puede leer", async () => {
    const [doc] = await extractDocumentBytes("vieja.doc", strToU8("x"));
    expect("error" in doc && doc.error).toMatch(/docx/);
  });
});
