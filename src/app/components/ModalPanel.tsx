import Link from "next/link";
import { ReactNode } from "react";

interface ModalPanelProps {
  title: string;
  description?: string;
  closeHref: string;
  children: ReactNode;
}

export function ModalPanel({
  title,
  description,
  closeHref,
  children
}: ModalPanelProps) {
  return (
    <>
      <div className="modal-backdrop" />
      <aside className="modal-panel flex flex-col">
        <header className="card-header border-b border-[var(--border)]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Seat Party
            </div>
            <h2 className="mt-1 text-base font-semibold text-[var(--text)]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
            )}
          </div>
          <Link href={closeHref} className="btn-ghost text-xs">
            Close
          </Link>
        </header>
        <div className="card-body flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}

