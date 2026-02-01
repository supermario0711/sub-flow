"use client";

type ConvUrgentBannerProps = {
  hoursUntilLock: number;
  severity: "warning" | "critical";
};

export function ConvUrgentBanner({
  hoursUntilLock,
  severity,
}: ConvUrgentBannerProps) {
  return (
    <div
      className={
        severity === "critical"
          ? "rounded-lg animate-pulse"
          : ""
      }
    >
      <div
        role="alert"
        className={`alert mb-2 ${
          severity === "critical" ? "alert-error" : "alert-warning"
        }`}
      >
        <span>Your box locks in {Math.round(hoursUntilLock)} hours!</span>
      </div>
    </div>
  );
}
