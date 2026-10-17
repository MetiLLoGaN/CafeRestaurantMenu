import { useTranslation } from "react-i18next";

function LoadingSpinner({ fullScreen = true, label }) {
  const { t } = useTranslation();
  const text = label ?? t("common.loading");

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center z-50"
        style={{ backgroundColor: "var(--color-cream)" }}>
        {/* Animated plate */}
        <div className="relative mb-6">
          {/* Outer ring */}
          <div
            className="w-20 h-20 rounded-full border-4 animate-spin-slow"
            style={{
              borderColor: "var(--color-cream-deeper)",
              borderTopColor: "var(--color-gold)",
            }}
          />
          {/* Inner icon */}
          <div
            className="absolute inset-0 flex items-center justify-center text-3xl animate-wave"
            style={{ animationDelay: "0.1s" }}>
            ☕
          </div>
        </div>

        {/* Label */}
        <p
          className="font-display text-lg animate-fade-in"
          style={{ color: "var(--color-espresso)", animationDelay: "0.2s" }}>
          {text}
        </p>

        {/* Animated dots */}
        <div className="flex gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full animate-pulse-slow"
              style={{
                backgroundColor: "var(--color-gold)",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div
        className="w-10 h-10 rounded-full border-4 animate-spin"
        style={{
          borderColor: "var(--color-cream-deeper)",
          borderTopColor: "var(--color-primary)",
        }}
      />
    </div>
  );
}

export default LoadingSpinner;
