import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-3xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm leading-relaxed text-on-surface-variant mt-1 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
