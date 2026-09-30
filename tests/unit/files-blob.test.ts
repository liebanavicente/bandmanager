import { beforeEach, describe, expect, it, vi } from "vitest";

const blob = vi.hoisted(() => ({ head: vi.fn(), del: vi.fn(), get: vi.fn() }));
vi.mock("@vercel/blob", () => blob);

import { verifyUploadedBlob } from "@/lib/files";

const bandId = "band1";

describe("verifyUploadedBlob", () => {
  beforeEach(() => {
    blob.head.mockReset();
    blob.del.mockReset().mockResolvedValue(undefined);
  });

  it("rechaza archivos fuera de la carpeta de la sala sin consultar Blob", async () => {
    await expect(verifyUploadedBlob("bands/otra/general/x.pdf", bandId)).rejects.toThrow(
      "no pertenece a esta sala",
    );
    await expect(verifyUploadedBlob("bands/band1/../otra/x.pdf", bandId)).rejects.toThrow();
    expect(blob.head).not.toHaveBeenCalled();
  });

  it("usa el tipo y el tamaño reales del blob", async () => {
    blob.head.mockResolvedValue({ contentType: "application/pdf", size: 2048 });
    await expect(verifyUploadedBlob("bands/band1/general/rider-a1b2.pdf", bandId)).resolves.toMatchObject({
      storagePath: "blob:bands/band1/general/rider-a1b2.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2048,
    });
  });

  it("borra el blob si su tipo no está permitido", async () => {
    blob.head.mockResolvedValue({ contentType: "application/x-msdownload", size: 10 });
    await expect(verifyUploadedBlob("bands/band1/general/virus.exe", bandId)).rejects.toThrow(
      "Tipo de archivo no permitido",
    );
    expect(blob.del).toHaveBeenCalledWith("bands/band1/general/virus.exe");
  });
});
