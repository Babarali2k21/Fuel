import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
      {children}
    </p>
  );
}

export function GlassCard({
  children,
  className = "",
  strong = false,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={`rounded-[1.25rem] ${strong ? "glass-panel-strong" : "glass-panel"} ${className}`}>
      {children}
    </div>
  );
}

export function PageMain({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main className={`mx-auto min-h-screen max-w-lg px-5 pb-32 pt-6 ${className}`}>{children}</main>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-5 py-3 text-sm font-semibold text-[#042f2e] shadow-[0_8px_24px_-8px_rgba(45,212,191,0.5)] transition hover:brightness-110 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
