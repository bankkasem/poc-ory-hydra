import type { ReactNode } from "react";

type FlowShellProps = {
  title: string;
  children: ReactNode;
};

export function FlowShell({ title, children }: FlowShellProps) {
  return (
    <main className="shell">
      <section className="workspace">
        <h1>{title}</h1>
        <div className="content">{children}</div>
      </section>
    </main>
  );
}
