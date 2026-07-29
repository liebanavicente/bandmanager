import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b-2 border-foreground/10 pb-5 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-7 w-1.5 bg-punk-red" />
          <h1 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">
            {title}
          </h1>
        </div>
        {description && (
          <p className="pl-[18px] text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
