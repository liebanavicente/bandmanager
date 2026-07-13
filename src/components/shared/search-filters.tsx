"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterOption = { value: string; label: string };

type SearchFiltersProps = {
  searchPlaceholder?: string;
  statusOptions?: FilterOption[];
  typeOptions?: FilterOption[];
  statusParam?: string;
  typeParam?: string;
};

export function SearchFilters({
  searchPlaceholder = "Buscar…",
  statusOptions,
  typeOptions,
  statusParam = "status",
  typeParam = "type",
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateParams("q", (formData.get("q") as string) ?? "");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-xs">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          placeholder={searchPlaceholder}
          defaultValue={searchParams.get("q") ?? ""}
          className="pl-8"
        />
      </form>

      {typeOptions && (
        <Select
          value={searchParams.get(typeParam) ?? ""}
          onValueChange={(value) => updateParams(typeParam, value ?? "")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {statusOptions && (
        <Select
          value={searchParams.get(statusParam) ?? ""}
          onValueChange={(value) => updateParams(statusParam, value ?? "")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(searchParams.get("q") || searchParams.get(statusParam) || searchParams.get(typeParam)) && (
        <Button variant="ghost" onClick={() => router.push("?")}>
          Limpiar
        </Button>
      )}
    </div>
  );
}