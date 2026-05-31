"use client";

import React from "react";

interface HintPanelProps {
  steps: string[];
  onClose: () => void;
}

export default function HintPanel({ steps, onClose }: HintPanelProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">
        <h3 className="text-xl font-bold text-blue-700 mb-4">💡 解答のヒント</h3>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="bg-blue-50 rounded-lg p-3 text-sm text-gray-800">
              {step}
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
