"use client";

import React, { useRef, useEffect } from "react";

interface BitInputProps {
  value: string;
  onChange: (val: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  disabled?: boolean;
  correct?: boolean | null; // null = not yet checked
  label?: string;
  autoFocus?: boolean;
}

export default function BitInput({
  value,
  onChange,
  onNext,
  onPrev,
  disabled,
  correct,
  label,
  autoFocus,
}: BitInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const borderColor =
    correct === null || correct === undefined
      ? "border-gray-400 focus:border-blue-500"
      : correct
      ? "border-green-500 bg-green-50"
      : "border-red-500 bg-red-50";

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-xs text-gray-500 mb-1">{label}</span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "0" || v === "1") {
            onChange(v);
            onNext?.();
          } else if (v === "") {
            onChange("");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && value === "") {
            onPrev?.();
          } else if (e.key === "ArrowLeft") {
            onPrev?.();
          } else if (e.key === "ArrowRight") {
            onNext?.();
          }
        }}
        className={`w-9 h-9 text-center text-lg font-mono border-2 rounded focus:outline-none ${borderColor} ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}
