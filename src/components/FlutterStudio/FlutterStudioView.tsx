/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FLUTTER_PROJECT_FILES, FlutterSourceFile } from '../../flutterProject/flutterFiles';
import { exportFlutterProjectZip } from '../../flutterProject/zipExporter';
import {
  Download,
  FolderTree,
  FileCode,
  Copy,
  Check,
  Terminal,
  Smartphone,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';

export const FlutterStudioView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FlutterSourceFile>(FLUTTER_PROJECT_FILES[1]); // default to main.dart
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await exportFlutterProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-mono font-semibold flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              Flutter 3.x & Dart
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Ready for Android & iOS
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Complete Flutter Mobile App Codebase
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Full client project adhering to the Level 2 Mobile Programming Layered Architecture: action-triggered Geolocator, synchronous 120s timer service, Firebase Suite repositories, and Teacher/Student screens.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Packaging ZIP...' : 'Download Full Flutter Project (.zip)'}</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: File Explorer (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <FolderTree className="w-4 h-4 text-sky-400" />
              Project File Tree
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {FLUTTER_PROJECT_FILES.length} Files
            </span>
          </div>

          <div className="space-y-1">
            {FLUTTER_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-950/70 border border-sky-500/80 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-sky-400' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 ml-2">
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Setup Terminal snippet */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Run in Terminal
            </span>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="text-emerald-400">$ flutter pub get</div>
              <div className="text-emerald-400">$ flutter run</div>
            </div>
          </div>
        </div>

        {/* Right Column: Code Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <span>{selectedFile.path}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedFile.description}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>

          {/* Syntax Code Container */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[580px] leading-relaxed">
              {selectedFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
