import type { ReactNode } from "react";

type FlowShellProps = {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function FlowShell({
  step,
  title,
  description,
  children,
}: FlowShellProps) {
  return (
    <main className="shell">
      <aside className="protocol-rail" aria-label="OAuth flow">
        <a className="brand" href="/">
          Hydra OAuth Lab
        </a>
        <div className="rail-track" aria-hidden="true">
          <span className="rail-node active" />
          <span className="rail-node" />
          <span className="rail-node" />
          <span className="rail-node" />
        </div>
        <p>Authorization Code + PKCE</p>
      </aside>

      <section className="workspace">
        <p className="step-label">{step}</p>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
        <div className="panel">{children}</div>
      </section>
    </main>
  );
}
