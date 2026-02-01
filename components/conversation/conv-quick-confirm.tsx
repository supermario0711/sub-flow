"use client";

type ConvQuickConfirmProps = {
  label: string;
  prominent: boolean;
  onConfirm: () => void;
  disabled?: boolean;
};

export function ConvQuickConfirm({
  label,
  prominent,
  onConfirm,
  disabled = false,
}: ConvQuickConfirmProps) {
  return (
    <div className="my-2">
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className={`btn min-h-[44px] w-full transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none ${
          prominent ? "btn-primary btn-lg" : "btn-secondary"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {label}
      </button>
    </div>
  );
}
