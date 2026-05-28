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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CRM CSV Sanitizer</h1>
                    <p className="text-gray-500 mt-1">Production-safe lead data transformation tool</p>
                </div>

                {result && (
                    <button
                        onClick={reset}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span>Process New File</span>
                    </button>
                )}
            </div>

            {!result ? (
                <div className="space-y-6">
                    <CSVUpload onUpload={handleUpload} onError={setError} isLoading={isLoading} />

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-700">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Features Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        {[
                            { title: "Strict Schema", desc: "Maintains 100% fixed column order and naming for CRM compatibility.", icon: FileSpreadsheet },
                            { title: "Safe Sanitization", desc: "Predictable cleaning for phone numbers and campaign IDs.", icon: CheckCircle2 },
                            { title: "Real-time Logs", desc: "Detailed processing logs and validation error reporting.", icon: Activity },
                        ].map((feature, i) => (
                            <div key={i} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Summary Cards */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">Total Rows</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{result.summary.totalRows}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-green-500">
                            <p className="text-sm font-medium text-gray-500">Processed Successfully</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{result.summary.processedRows}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
                            <p className="text-sm font-medium text-gray-500">Skipped/Failed</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{result.summary.failedRows}</p>
                        </div>
                    </div>

                    {/* Main Action Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col items-center justify-center text-center space-y-6 shadow-xl shadow-blue-100">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Processing Complete!</h2>
                                <p className="text-blue-100 mt-1">Your sanitized CSV for &quot;{fileName}&quot; is ready.</p>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="group flex items-center space-x-3 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg active:scale-95"
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
