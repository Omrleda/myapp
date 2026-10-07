/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { MOBILE_PROGRAMMING_QUIZ_QUESTIONS } from '../../data/seedData';
import { Award, ChevronRight, ChevronLeft, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export const QuizScreen: React.FC = () => {
  const {
    activeSession,
    studentSimulatedLat,
    studentSimulatedLng,
    submitAttendance,
    timeRemainingSeconds,
  } = useAppStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([1, 1, 1, 0, 1]); // defaults to sensible selections
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQ = MOBILE_PROGRAMMING_QUIZ_QUESTIONS[currentQuestionIndex];

  const handleSelectOption = (optIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQuestionIndex] = optIndex;
    setSelectedAnswers(updated);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    submitAttendance(studentSimulatedLat, studentSimulatedLng, selectedAnswers);
    setIsSubmitting(false);
  };

  const answeredCount = selectedAnswers.filter((a) => a !== undefined && a !== null).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase text-sky-400 font-bold flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Mode 2: 5-Question Live Quiz
          </span>
          <h3 className="text-sm font-bold text-white mt-0.5">
            Mobile Programming - Level 2
          </h3>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-300">
            {answeredCount} / 5 Answered
          </span>
        </div>
      </div>

      {/* Question Selector Tabs */}
      <div className="flex items-center gap-1.5">
        {MOBILE_PROGRAMMING_QUIZ_QUESTIONS.map((q, idx) => {
          const isSelected = selectedAnswers[idx] !== undefined;
          const isCurrent = currentQuestionIndex === idx;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                isCurrent
                  ? 'bg-sky-600 text-white border-sky-400 shadow'
                  : isSelected
                  ? 'bg-slate-800 text-sky-300 border-slate-700'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              Q{idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Card */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="text-xs font-semibold text-slate-200 leading-relaxed">
          <span className="text-sky-400 font-mono mr-1.5 font-bold">
            [{currentQuestionIndex + 1}/5]
          </span>
          {currentQ.question}
        </div>

        {currentQ.codeSnippet && (
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre">
            {currentQ.codeSnippet}
          </div>
        )}

        {/* Options */}
        <div className="space-y-2 pt-1">
          {currentQ.options.map((option, optIdx) => {
            const isChosen = selectedAnswers[currentQuestionIndex] === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                  isChosen
                    ? 'bg-sky-950/60 border-sky-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center text-[10px] font-mono ${
                    isChosen
                      ? 'border-sky-400 bg-sky-500 text-slate-950 font-bold'
                      : 'border-slate-600 text-slate-400'
                  }`}
                >
                  {String.fromCharCode(65 + optIdx)}
                </div>
                <span className="flex-1 leading-snug">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>

        {currentQuestionIndex < 4 ? (
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(4, prev + 1))}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!activeSession || isSubmitting}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.99] disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-sky-600/20 flex items-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Submit & Verify Proximity
          </button>
        )}
      </div>
    </div>
  );
};
