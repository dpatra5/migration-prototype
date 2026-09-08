type CircularProgressProps = {
  progress: number;
  successfulFiles: number;
  pendingFiles: number;
  failedFiles: number;
};

export default function CircularProgress({
  progress,
  successfulFiles,
  pendingFiles,
  failedFiles,
}: CircularProgressProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const totalFiles = successfulFiles + pendingFiles + failedFiles;

  const offset =
    circumference - (progress / 100) * circumference;

  return (
    <div className="flex justify-center">
      <div className="relative w-44 h-44 float-ring">
        {/* <div className="absolute -inset-2 animate-spin-slow rounded-full border border-cyan-400/20" /> */}
        <svg
          className="w-44 h-44 -rotate-90 relative z-10 pulse-glow"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />

          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition:
                "stroke-dashoffset 0.3s ease",
              filter:
                "drop-shadow(0 2px 6px rgba(37,99,235,.15))"
            }}
          />

          <defs>
            <linearGradient
            id="gradient"
            x1="0%"
            y1="50%"
            x2="100%"
            y2="50%"
            >
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="45%" stopColor="#3b82f6" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
  <p className="text-4xl font-bold text-slate-800">
    {Math.round(progress)}%
  </p>

  <p className="text-sm text-gray-500">
    {successfulFiles} / {totalFiles}
  </p>

  <p className="text-xs text-gray-400">
    Files Migrated
  </p>

  <p className="mt-2 text-xs font-medium text-rose-600">
    {failedFiles} Failed
  </p>
</div>

      </div>
    </div>
  );
}