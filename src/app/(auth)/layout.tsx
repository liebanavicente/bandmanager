import { Music4 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Music4 className="size-5" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold">BandManager</h1>
          <p className="text-sm text-muted-foreground">Tu banda, organizada</p>
        </div>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}