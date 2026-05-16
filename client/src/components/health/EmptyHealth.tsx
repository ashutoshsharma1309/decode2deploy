interface Props {
  repoName?: string;
}

export function EmptyHealth({ repoName }: Props) {
  return (
    <div className="panel p-12 flex flex-col items-center text-center gap-3">
      <p
        className="heading-display text-xl text-glow-cyan"
        style={{ color: "var(--neon-cyan)" }}
      >
        NO TELEMETRY YET
      </p>
      <p
        className="text-xs label-mono"
        style={{ color: "var(--text-secondary)" }}
      >
        {repoName
          ? `/ / HEALTH SCAN FOR ${repoName} WILL APPEAR AFTER NEXT PUSH`
          : "/ / HEALTH SCAN APPEARS AFTER PUSH TO DEFAULT BRANCH"}
      </p>
      <p
        className="text-[10px] mt-2"
        style={{
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {"> SCORE COMPUTED AUTOMATICALLY ON EVERY PUSH"}
      </p>
    </div>
  );
}
