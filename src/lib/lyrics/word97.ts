/**
 * Texto de un .doc binario de Word 97-2003 (MS-DOC). Se lee la tabla de
 * piezas (Clx/PlcPcd) para reconstruir el texto del documento principal en
 * orden; sin formato, que para letras no hace falta.
 */

// Caracteres 0x80-0x9F de Windows-1252 (texto "comprimido" de 8 bits)
const CP1252: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
  0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160, 0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018,
  0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02dc,
  0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178,
};

export class DocReadError extends Error {}

function view(bytes: Uint8Array) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** Quita códigos de campo (0x13 instrucción 0x14 resultado 0x15) dejando el resultado. */
function stripFields(text: string) {
  let out = "";
  const stack: ("code" | "result")[] = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code === 0x13) stack.push("code");
    else if (code === 0x14) {
      if (stack.length) stack[stack.length - 1] = "result";
    } else if (code === 0x15) stack.pop();
    else if (!stack.includes("code")) out += ch;
  }
  return out;
}

function cleanDocText(raw: string) {
  return stripFields(raw)
    .replace(/\r\x07/g, "\n") // fin de celda + fin de fila
    .replace(/\x07/g, "\t") // fin de celda
    .replace(/[\r\x0b\x0c]/g, "\n") // párrafo, salto de línea, salto de página
    .replace(/[\x00-\x08\x0e-\x1f]/g, "") // objetos, notas, marcas internas
    .replace(/ /g, " ");
}

export async function readWord97(bytes: Uint8Array): Promise<string> {
  const CFB = await import("cfb");
  let container;
  try {
    container = CFB.read(bytes, { type: "array" });
  } catch {
    throw new DocReadError("No es un documento de Word válido.");
  }
  const wordStream = CFB.find(container, "WordDocument")?.content as Uint8Array | undefined;
  if (!wordStream || wordStream.length < 0x1aa) throw new DocReadError("No es un documento de Word válido.");

  const word = view(new Uint8Array(wordStream));
  if (word.getUint16(0, true) !== 0xa5ec) throw new DocReadError("Documento de Word demasiado antiguo (Word 95 o anterior).");
  const flags = word.getUint16(0x0a, true);
  if (flags & 0x0100) throw new DocReadError("El documento está protegido con contraseña.");

  const tableName = flags & 0x0200 ? "1Table" : "0Table";
  const tableStream = CFB.find(container, tableName)?.content as Uint8Array | undefined;
  if (!tableStream) throw new DocReadError("No es un documento de Word válido.");
  const table = new Uint8Array(tableStream);
  const tableView = view(table);

  const ccpText = word.getInt32(0x4c, true);
  const fcClx = word.getUint32(0x1a2, true);
  const lcbClx = word.getUint32(0x1a6, true);
  if (fcClx + lcbClx > table.length) throw new DocReadError("No es un documento de Word válido.");

  // Clx: se saltan los Prc (0x01) hasta el Pcdt (0x02)
  let pos = fcClx;
  const end = fcClx + lcbClx;
  while (pos < end && table[pos] === 0x01) pos += 3 + tableView.getUint16(pos + 1, true);
  if (table[pos] !== 0x02) throw new DocReadError("No es un documento de Word válido.");
  const lcb = tableView.getUint32(pos + 1, true);
  const plc = pos + 5;
  const pieces = Math.floor((lcb - 4) / 12);

  const bytesOf = new Uint8Array(wordStream);
  let text = "";
  for (let i = 0; i < pieces && text.length < ccpText; i++) {
    const cpStart = tableView.getUint32(plc + i * 4, true);
    const cpEnd = tableView.getUint32(plc + (i + 1) * 4, true);
    const pcd = plc + (pieces + 1) * 4 + i * 8;
    const fcValue = tableView.getUint32(pcd + 2, true);
    const compressed = (fcValue & 0x40000000) !== 0;
    const fc = fcValue & 0x3fffffff;
    const count = cpEnd - cpStart;
    if (compressed) {
      const start = fc / 2;
      for (let c = 0; c < count && start + c < bytesOf.length; c++) {
        const b = bytesOf[start + c];
        text += String.fromCharCode(CP1252[b] ?? b);
      }
    } else {
      const slice = bytesOf.subarray(fc, Math.min(bytesOf.length, fc + count * 2));
      text += new TextDecoder("utf-16le").decode(slice);
    }
  }

  // Solo el cuerpo: después vienen notas, encabezados y pies
  return cleanDocText(text.slice(0, Math.max(0, ccpText)));
}
