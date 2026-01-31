"use client";

type UrgentBannerProps = {
  hoursUntilLock: number;
};

export function UrgentBanner({ hoursUntilLock }: UrgentBannerProps) {
  return (
    <div
      role="alert"
      className="alert alert-error mb-6"
    >
      <span>
        Your box locks in {Math.round(hoursUntilLock)} hours!
      </span>
    </div>
  );
}
