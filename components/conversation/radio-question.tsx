"use client";

import { useState, useCallback } from "react";

type RadioOption = {
  id: string;
  label: string;
  description?: string;
};

type RadioQuestionProps = {
  questionId: string;
  question: string;
  options: RadioOption[];
  onSelect: (optionId: string) => void;
  disabled?: boolean;
};

export function RadioQuestion({
  questionId,
  question,
  options,
  onSelect,
  disabled = false,
}: RadioQuestionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDisabled = disabled || selectedId !== null;

  const handleSelect = useCallback(
    (optionId: string) => {
      if (isDisabled) return;
      setSelectedId(optionId);
      onSelect(optionId);
    },
    [isDisabled, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (isDisabled) return;

      let nextIndex: number | null = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        nextIndex = (index + 1) % options.length;
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        nextIndex = (index - 1 + options.length) % options.length;
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelect(options[index].id);
        return;
      }

      if (nextIndex !== null) {
        const nextEl = document.getElementById(
          `${questionId}-option-${nextIndex}`
        );
        nextEl?.focus();
      }
    },
    [isDisabled, options, questionId, handleSelect]
  );

  return (
    <div className="my-2">
      <p className="mb-2 text-sm font-medium text-base-content/80">
        {question}
      </p>
      <div
        role="radiogroup"
        aria-label={question}
        className="flex flex-col gap-2"
      >
        {options.map((option, index) => {
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              id={`${questionId}-option-${index}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isDisabled}
              tabIndex={isDisabled ? -1 : index === 0 ? 0 : -1}
              onClick={() => handleSelect(option.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`btn min-h-[44px] justify-start text-left transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none ${
                isSelected ? "btn-primary" : "btn-outline"
              } ${isDisabled && !isSelected ? "opacity-50" : ""}`}
            >
              <span className="flex flex-col items-start">
                <span>{option.label}</span>
                {option.description && (
                  <span className="text-xs opacity-70">{option.description}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
