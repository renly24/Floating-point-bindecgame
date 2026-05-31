"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import BitInput from "./BitInput";
import HintPanel from "./HintPanel";
import {
  IEEE754Problem,
  FloatFormat,
  GameConfig,
  generateBasicProblems,
  generateAdvancedProblems,
  validateAnswer,
  getHintSteps,
} from "@/lib/game";

type GameState = "menu" | "playing" | "result";

export default function GameBoard() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [config, setConfig] = useState<GameConfig>({
    format: "32bit",
    mode: "basic",
    totalProblems: 10,
  });

  const [problems, setProblems] = useState<IEEE754Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [problemTimes, setProblemTimes] = useState<number[]>([]);
  const [problemStartTime, setProblemStartTime] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Inputs
  const [signInput, setSignInput] = useState("");
  const [exponentInput, setExponentInput] = useState<string[]>([]);
  const [mantissaInput, setMantissaInput] = useState<string[]>([]);

  // Refs for focus management
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentProblem = problems[currentIndex];

  const exponentCount = config.format === "32bit" ? 8 : 5;
  const mantissaCount = currentProblem?.significantMantissaLength ?? 0;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIndex]);

  const startGame = () => {
    const probs =
      config.mode === "basic"
        ? generateBasicProblems(config.format, config.totalProblems)
        : generateAdvancedProblems(config.format, config.totalProblems);
    setProblems(probs);
    setCurrentIndex(0);
    setScore(0);
    setElapsed(0);
    setProblemTimes([]);
    resetInputs(probs[0]);
    setAnswered(false);
    setIsCorrect(null);
    setProblemStartTime(Date.now());
    setGameState("playing");
  };

  const resetInputs = (prob: IEEE754Problem) => {
    setSignInput("");
    setExponentInput(Array(prob ? (prob.format === "32bit" ? 8 : 5) : exponentCount).fill(""));
    setMantissaInput(Array(prob?.significantMantissaLength ?? 0).fill(""));
    setAnswered(false);
    setIsCorrect(null);
  };

  const handleSubmit = () => {
    if (!currentProblem || answered) return;
    const correct = validateAnswer(
      currentProblem,
      signInput,
      exponentInput,
      mantissaInput
    );
    setIsCorrect(correct);
    setAnswered(true);
    if (correct) setScore((s) => s + 1);
    const timeTaken = Math.floor((Date.now() - problemStartTime) / 1000);
    setProblemTimes((prev) => [...prev, timeTaken]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= problems.length) {
      setGameState("result");
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      resetInputs(problems[nextIndex]);
      setElapsed(0);
      setProblemStartTime(Date.now());
    }
  };

  // Build a flat array of all input positions for focus management
  // index 0 = sign, 1..expCount = exponent, expCount+1.. = mantissa
  const totalInputs = 1 + exponentCount + mantissaCount;
  const getFocusIndex = (type: "sign" | "exp" | "man", i = 0) => {
    if (type === "sign") return 0;
    if (type === "exp") return 1 + i;
    return 1 + exponentCount + i;
  };

  const focusAtIndex = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalInputs) return;
      inputRefs.current[idx]?.focus();
    },
    [totalInputs]
  );

  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center text-blue-800 mb-2">
            浮動小数点数
          </h1>
          <h2 className="text-xl font-bold text-center text-blue-600 mb-6">
            2進数変換ゲーム
          </h2>

          <div className="space-y-4">
            {/* Format */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                フォーマット
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["32bit", "16bit"] as FloatFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setConfig((c) => ({ ...c, format: f }))}
                    className={`py-2 px-4 rounded-lg font-bold border-2 transition-colors ${
                      config.format === f
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {f === "32bit" ? "32ビット (単精度)" : "16ビット (半精度)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                モード
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["basic", "advanced"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setConfig((c) => ({ ...c, mode: m }))}
                    className={`py-2 px-4 rounded-lg font-bold border-2 transition-colors ${
                      config.mode === m
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {m === "basic" ? "ベーシック" : "アドバンスド"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {config.mode === "basic"
                  ? "易しい問題から難しい問題へ順番に出題"
                  : "難易度ランダムで出題"}
              </p>
            </div>

            {/* Problem count */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                問題数: {config.totalProblems}
              </label>
              <input
                type="range"
                min={5}
                max={20}
                step={5}
                value={config.totalProblems}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    totalProblems: parseInt(e.target.value),
                  }))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors shadow-md"
            >
              ゲームスタート
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "result") {
    const totalTime = problemTimes.reduce((a, b) => a + b, 0);
    const avgTime = problemTimes.length > 0 ? Math.round(totalTime / problemTimes.length) : 0;
    const percentage = Math.round((score / config.totalProblems) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
            ゲーム終了！
          </h2>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-4xl font-bold text-blue-700">
                {score} / {config.totalProblems}
              </div>
              <div className="text-gray-600">正解数</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-700">{percentage}%</div>
                <div className="text-sm text-gray-500">正解率</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-700">{avgTime}秒</div>
                <div className="text-sm text-gray-500">平均回答時間</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-sm font-bold text-gray-700 mb-2">各問題の回答時間</div>
              <div className="grid grid-cols-5 gap-1">
                {problemTimes.map((t, i) => (
                  <div key={i} className="text-center text-xs">
                    <div className="text-gray-500">Q{i + 1}</div>
                    <div className="font-mono">{t}s</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-lg">
              {percentage >= 90
                ? "🎉 素晴らしい！完璧な理解です！"
                : percentage >= 70
                ? "👍 よくできました！"
                : percentage >= 50
                ? "📚 もう少し練習しましょう"
                : "💪 基礎から復習してみましょう"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              もう一度
            </button>
            <button
              onClick={() => setGameState("menu")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
            >
              メニューへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing state
  if (!currentProblem) return null;

  const expBitCount = currentProblem.format === "32bit" ? 8 : 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 text-white">
          <div className="text-sm">
            問題 {currentIndex + 1} / {config.totalProblems}
          </div>
          <div className="font-bold text-lg">
            スコア: {score}
          </div>
          <div className="text-sm">
            ⏱ {elapsed}秒
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-blue-800 rounded-full h-2 mb-6">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / config.totalProblems) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {/* Problem */}
          <div className="text-center mb-6">
            <div className="text-sm text-gray-500 mb-1">
              {currentProblem.format === "32bit" ? "32ビット単精度" : "16ビット半精度"} IEEE 754
            </div>
            <div className="text-4xl font-bold text-blue-800">
              {currentProblem.value}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              を IEEE 754 浮動小数点数に変換してください
            </div>
            <div className="text-xs text-gray-400 mt-1">
              難易度: {"★".repeat(currentProblem.difficulty)}{"☆".repeat(5 - currentProblem.difficulty)}
            </div>
          </div>

          {/* Answer Input */}
          <div className="overflow-x-auto">
            <div className="flex items-end gap-2 justify-center min-w-max mx-auto pb-2">
              {/* Sign bit */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-purple-700 mb-2 text-center">符号<br/>(1bit)</div>
                <BitInput
                  value={signInput}
                  onChange={(v) => {
                    setSignInput(v);
                    if (v) focusAtIndex(getFocusIndex("exp", 0));
                  }}
                  onPrev={() => {}}
                  onNext={() => focusAtIndex(getFocusIndex("exp", 0))}
                  disabled={answered}
                  correct={answered ? signInput === String(currentProblem.sign) : null}
                  autoFocus={true}
                />
              </div>

              <div className="text-gray-400 self-center pb-1">|</div>

              {/* Exponent bits */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-orange-700 mb-2 text-center">
                  指数部<br/>({expBitCount}bits)
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: expBitCount }).map((_, i) => {
                    const fi = getFocusIndex("exp", i);
                    return (
                      <div
                        key={i}
                        ref={(el) => {
                          // We need to connect refs externally — handled in BitInput internally
                          void el;
                        }}
                      >
                        <BitInput
                          value={exponentInput[i] ?? ""}
                          onChange={(v) => {
                            const arr = [...exponentInput];
                            arr[i] = v;
                            setExponentInput(arr);
                          }}
                          onNext={() => focusAtIndex(fi + 1)}
                          onPrev={() => focusAtIndex(fi - 1)}
                          disabled={answered}
                          correct={
                            answered
                              ? exponentInput[i] === String(currentProblem.exponentBits[i])
                              : null
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-gray-400 self-center pb-1">|</div>

              {/* Mantissa bits */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-green-700 mb-2 text-center">
                  仮数部<br/>({currentProblem.format === "32bit" ? 23 : 10}bits)
                </div>
                <div className="flex gap-1 items-end">
                  {/* Input boxes for significant bits */}
                  {Array.from({ length: mantissaCount }).map((_, i) => {
                    const fi = getFocusIndex("man", i);
                    return (
                      <BitInput
                        key={i}
                        value={mantissaInput[i] ?? ""}
                        onChange={(v) => {
                          const arr = [...mantissaInput];
                          arr[i] = v;
                          setMantissaInput(arr);
                        }}
                        onNext={() => focusAtIndex(fi + 1)}
                        onPrev={() => focusAtIndex(fi - 1)}
                        disabled={answered}
                        correct={
                          answered
                            ? mantissaInput[i] === String(currentProblem.mantissaBits[i])
                            : null
                        }
                      />
                    );
                  })}

                  {/* Trailing zeros pre-filled */}
                  {mantissaCount <
                    (currentProblem.format === "32bit" ? 23 : 10) && (
                    <div className="flex gap-1">
                      {Array.from({
                        length:
                          (currentProblem.format === "32bit" ? 23 : 10) -
                          mantissaCount,
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="w-9 h-9 flex items-center justify-center text-lg font-mono bg-gray-100 border-2 border-gray-300 rounded text-gray-400"
                        >
                          0
                        </div>
                      ))}
                    </div>
                  )}

                  {mantissaCount === 0 && (
                    <div className="text-sm text-gray-500 self-center">
                      (入力不要)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hidden inputs for focus management */}
          <div className="sr-only" aria-hidden="true">
            {/* We use a flat array for focus - implemented via callback refs */}
          </div>

          {/* Feedback */}
          {answered && (
            <div
              className={`mt-4 p-3 rounded-lg text-center font-bold text-lg ${
                isCorrect
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isCorrect ? "✅ 正解！" : "❌ 不正解"}
              {!isCorrect && (
                <div className="mt-2 text-sm font-normal">
                  正解: 符号[{currentProblem.sign}] 指数部[{currentProblem.exponentBits.join("")}] 仮数部[{currentProblem.mantissaFull}]
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-5">
            {!answered ? (
              <>
                <button
                  onClick={() => setShowHint(true)}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  💡 ヒント
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-2 flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  回答する
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                {currentIndex + 1 >= config.totalProblems ? "結果を見る" : "次の問題へ →"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showHint && (
        <HintPanel
          steps={getHintSteps(currentProblem)}
          onClose={() => setShowHint(false)}
        />
      )}
    </div>
  );
}
