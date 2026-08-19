"use client";

interface QuizProgressProps {
  current: number;
  total: number;
}

export default function QuizProgress({
  current,
  total,
}: QuizProgressProps) {
  const percentage =
    total > 0
      ? (current / total) * 100
      : 0;

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-sm">
        <span>
          Question {current} / {total}
        </span>

        <span>
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}