"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Upload } from "lucide-react";
import type { FileAsset, FileCategory } from "@prisma/client";
import { toast } from "sonner";
import { registerUploadedFile, updateFile, uploadFile } from "@/actions/files";
import { fileCategoryLabels } from "@/lib/file-categories";
import { EntityActions } from "@/components/shared/entity-actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const categoryOptions = Object.entries(fileCategoryLabels).map(([value, label]) => ({
  value: value as FileCategory,
  label,
}));

export type FileDraft = Pick<FileAsset, "id" | "name" | "description" | "category">;

/** Subida directa del navegador a Vercel Blob; null = pasa por el servidor (local). */
export type DirectUpload = { prefix: string; maxBytes: number } | null;

type FileDialogProps = {
  file?: FileDraft;
  directUpload?: DirectUpload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

async function uploadDirect(form: FormData, category: FileCategory, target: NonNullable<DirectUpload>) {
  const picked = form.get("file");
  if (!(picked instanceof File) || picked.size === 0) {
    return { error: "Debes seleccionar un archivo." };
  }
  if (picked.size > target.maxBytes) {
    return { error: `El archivo supera el límite de ${Math.round(target.maxBytes / (1024 * 1024))} MB.` };
  }

  const safeName = picked.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "archivo";
  let pathname: string;
  try {
    const blob = await upload(`${target.prefix}general/${safeName}`, picked, {
      access: "private",
      handleUploadUrl: "/api/files/upload",
      contentType: picked.type || undefined,
    });
    pathname = blob.pathname;
  } catch (error) {
    console.error(error);
    return { error: "No se pudo subir el archivo. Revisa el tipo y el tamaño e inténtalo de nuevo." };
  }

  const name = (form.get("name") as string)?.trim();
  return registerUploadedFile({
    pathname,
    originalName: picked.name,
    name: name || undefined,
    description: (form.get("description") as string) ?? "",
    category,
  });
}

export function FileDialog({ file, directUpload, open, onOpenChange }: FileDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<FileCategory>(file?.category ?? "OTHER");

  async function handleSubmit(form: FormData) {
    setLoading(true);
    let result;
    if (file) {
      result = await updateFile({
        id: file.id,
        name: form.get("name"),
        description: form.get("description") ?? "",
        category,
      });
    } else if (directUpload) {
      result = await uploadDirect(form, category, directUpload);
    } else {
      form.set("category", category);
      if (!form.get("name")) form.delete("name");
      result = await uploadFile(form);
    }
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(file ? "Archivo actualizado" : "Archivo subido");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      kicker={file ? "Editar archivo" : "Subir archivo"}
      title={file ? file.name : "Al archivo de la banda"}
      description={file ? undefined : "Riders, contratos, carteles, partituras o audios (máx. 10 MB)."}
      submitLabel={file ? "Guardar cambios" : "Subir"}
      loading={loading}
      onSubmit={handleSubmit}
    >
      {!file && (
        <div className="space-y-2">
          <Label htmlFor="f-file">Archivo</Label>
          <Input
            id="f-file"
            name="file"
            type="file"
            required
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.mp3,.wav,.ogg,.doc,.docx"
            className="h-auto py-1.5"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="f-name">Nombre</Label>
        <Input
          id="f-name"
          name="name"
          required={Boolean(file)}
          defaultValue={file?.name}
          placeholder={file ? undefined : "Si lo dejas vacío, se usa el nombre del archivo"}
        />
      </div>
      <div className="space-y-2">
        <Label>Categoría</Label>
        <OptionSelect value={category} onValueChange={setCategory} options={categoryOptions} aria-label="Categoría" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-description">Descripción</Label>
        <Textarea id="f-description" name="description" rows={2} defaultValue={file?.description ?? ""} />
      </div>
    </FormDialog>
  );
}

export function UploadFileButton({ directUpload = null }: { directUpload?: DirectUpload }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload />
        Subir archivo
      </Button>
      {open && <FileDialog directUpload={directUpload} open={open} onOpenChange={setOpen} />}
    </>
  );
}

export function FileActions({ file }: { file: FileDraft }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <EntityActions entity="file" id={file.id} name={file.name} onEdit={() => setEditing(true)} />
      {editing && <FileDialog file={file} open={editing} onOpenChange={setEditing} />}
    </>
  );
}
