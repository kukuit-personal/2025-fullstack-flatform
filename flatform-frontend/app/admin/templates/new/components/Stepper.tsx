"use client";

interface StepperProps {
  step: number; // current index
  steps: string[]; // titles
  onStepClick?: (idx: number) => void;
}

export default function Stepper({ step, steps, onStepClick }: StepperProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <ol className="flex flex-wrap items-center gap-4">
        {steps.map((title, idx) => {
          const active = idx === step;
          const done = idx < step;
          return (
            <li key={title} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onStepClick?.(idx)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-emerald-600 text-white",
                  active && !done && "bg-indigo-600 text-white",
                  !active && !done && "bg-gray-200 text-gray-700",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : idx + 1}
              </button>
              <span className="text-sm font-medium text-gray-800">{title}</span>
              {idx < steps.length - 1 && (
                <span className="mx-2 hidden text-gray-400 md:inline">→</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
