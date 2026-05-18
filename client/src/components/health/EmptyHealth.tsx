interface Props {
  repoName?: string;
}

export function EmptyHealth({ repoName }: Props) {
  return (
    <div className="card-light p-12 flex flex-col items-center text-center gap-3">
      <p
        className="heading-display text-2xl"
        style={{ color: "var(--ink)" }}
      >
        No telemetry yet
      </p>
      <p
        className="text-sm max-w-md"
        style={{ color: "var(--text-secondary)" }}
      >
        {repoName
          ? `Health scan for ${repoName} appears after the next push to the default branch.`
          : "Health scan appears after the next push to the default branch."}
      </p>
      <p className="eyebrow mt-2">
        {"> SCORE COMPUTED AUTOMATICALLY ON EVERY PUSH"}
      </p>
    </div>
  );
}
