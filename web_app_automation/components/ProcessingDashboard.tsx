"use client";

import React, { useState } from 'react';
import { Download, CheckCircle2, AlertCircle, RefreshCcw, FileSpreadsheet, Activity } from 'lucide-react';
import Papa from 'papaparse';
import CSVUpload from './CSVUpload';
import LogConsole from './LogConsole';
import DataPreview from './DataPreview';
import { processCSVData } from '@/lib/utils/csv-processor';
import { ProcessingResult, RawLead } from '@/lib/types';

export default function ProcessingDashboard() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ProcessingResult | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleUpload = (rawData: RawLead[], name: string, mapping: Record<string, string>) => {
        setIsLoading(true);
        setError(null);
        setFileName(name);

        // Simulate process delay for better UX
        setTimeout(() => {
            try {
                const processingResult = processCSVData(rawData, mapping);
                setResult(processingResult);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred during processing.');
            } finally {
                setIsLoading(false);
            }
        }, 800);
    };

    const handleDownload = () => {
        if (!result) return;

        // PapaParse handles arrays of arrays automatically
        const csv = Papa.unparse({
            fields: result.headers,
            data: result.data
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        link.setAttribute('href', url);
        link.setAttribute('download', `sanitized_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const reset = () => {
        setResult(null);
        setFileName('');
        setError(null);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-card-border pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary-brand via-indigo-500 to-violet-600 bg-clip-text text-transparent">
                        CRM CSV Sanitizer
                    </h1>
                    <p className="text-muted-text mt-1 text-sm font-medium">Production-safe lead data transformation tool</p>
                </div>

                {result && (
                    <button
                        onClick={reset}
                        className="flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-muted-text hover:text-text-base bg-card-bg border border-card-border hover:bg-bg-base/80 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span>Process New File</span>
                    </button>
                )}
            </div>

            {!result ? (
                <div className="space-y-8">
                    <CSVUpload onUpload={handleUpload} onError={setError} isLoading={isLoading} />

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start space-x-3 text-rose-500 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold">{error}</p>
                        </div>
                    )}

                    {/* Features Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        {[
                            { title: "Strict Schema", desc: "Maintains 100% fixed column order and naming for CRM compatibility.", icon: FileSpreadsheet },
                            { title: "Safe Sanitization", desc: "Predictable cleaning for phone numbers and campaign IDs.", icon: CheckCircle2 },
                            { title: "Real-time Logs", desc: "Detailed processing logs and validation error reporting.", icon: Activity },
                        ].map((feature, i) => (
                            <div key={i} className="p-6 bg-card-bg/60 backdrop-blur-md border border-card-border rounded-2xl shadow-lg shadow-black/[0.01] hover:scale-[1.02] transition-all duration-300">
                                <div className="w-12 h-12 bg-primary-brand/10 text-primary-brand rounded-xl flex items-center justify-center mb-4 shadow-inner">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-text-base mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted-text leading-relaxed font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Summary Cards */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card-bg/60 backdrop-blur-md p-6 rounded-2xl border border-card-border shadow-md">
                            <p className="text-sm font-semibold text-muted-text">Total Rows</p>
                            <p className="text-3xl font-extrabold text-text-base mt-1">{result.summary.totalRows}</p>
                        </div>
                        <div className="bg-card-bg/60 backdrop-blur-md p-6 rounded-2xl border border-card-border border-l-4 border-l-emerald-500 shadow-md">
                            <p className="text-sm font-semibold text-muted-text">Processed Successfully</p>
                            <p className="text-3xl font-extrabold text-emerald-500 mt-1">{result.summary.processedRows}</p>
                        </div>
                        <div className="bg-card-bg/60 backdrop-blur-md p-6 rounded-2xl border border-card-border border-l-4 border-l-rose-500 shadow-md">
                            <p className="text-sm font-semibold text-muted-text">Skipped/Failed</p>
                            <p className="text-3xl font-extrabold text-rose-500 mt-1">{result.summary.failedRows}</p>
                        </div>
                    </div>

                    {/* Main Action Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-gradient-to-br from-primary-brand via-indigo-600 to-indigo-800 rounded-3xl p-8 text-white flex flex-col items-center justify-center text-center space-y-6 shadow-xl shadow-primary-brand/10 relative overflow-hidden">
                            {/* Glowing accents inside the card */}
                            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 rounded-full bg-white/5 blur-[50px] pointer-events-none" />
                            <div className="absolute bottom-[-20%] left-[-20%] w-64 h-64 rounded-full bg-black/10 blur-[50px] pointer-events-none" />
                            
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-extrabold tracking-tight">Processing Complete!</h2>
                                <p className="text-indigo-100 mt-1.5 font-medium">Your sanitized CSV for &quot;{fileName}&quot; is ready.</p>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="group flex items-center space-x-3 px-8 py-4 bg-white text-indigo-700 rounded-2xl font-extrabold text-lg hover:bg-slate-50 transition-all transform hover:scale-[1.03] shadow-xl hover:shadow-2xl active:scale-[0.98]"
                            >
                                <Download className="w-5 h-5 group-hover:animate-bounce" />
                                <span>Download Sanitized CSV</span>
                            </button>
                        </div>

                        <DataPreview data={result.data} headers={result.headers} />
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-1">
                        <LogConsole logs={result.logs} />
                    </div>
                </div>
            )}
        </div>
    );
}
