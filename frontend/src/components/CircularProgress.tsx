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
      <div className="relative w-56 h-56 float-ring">
        {/* <div className="absolute -inset-2 animate-spin-slow rounded-full border border-cyan-400/20" /> */}
        <svg
  className="w-56 h-56 -rotate-90 relative z-10 pulse-glow"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="7"
            fill="none"
          />

          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
  transition: "stroke-dashoffset 0.3s ease",
  filter: "drop-shadow(0 0 10px rgba(59,130,246,.25))"
}}
          />

          <defs>
            <linearGradient
  id="progressGradient"
  x1="0%"
  y1="0%"
  x2="100%"
  y2="100%"
>
  <stop offset="0%" stopColor="#93C5FD" />
  <stop offset="50%" stopColor="#3B82F6" />
  <stop offset="100%" stopColor="#1D4ED8" />
</linearGradient>
          </defs>
        </svg>

        {/* Center Percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
  <p className="text-4xl font-bold text-slate-800">
    {Math.round(progress)}%
  </p>

  <p className="text-base font-semibold text-blue-600">
  {successfulFiles} / {totalFiles}
</p>

  <p className="text-xs uppercase tracking-wider text-gray-400">
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