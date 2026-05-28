"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal, Info, AlertTriangle, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { ProcessingLog } from '@/lib/types';

interface LogConsoleProps {
    logs: ProcessingLog[];
}

export default function LogConsole({ logs }: LogConsoleProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const copyLogs = () => {
        const logText = logs.map(l => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`).join('\n');
        navigator.clipboard.writeText(logText);
    };

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'info': return <Info className="w-4 h-4 text-blue-400" />;
            case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[400px] shadow-xl shadow-black/10">
            <div className="px-4 py-3 bg-slate-900/50 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2 text-slate-300">
                    <Terminal className="w-4 h-4 text-primary-brand" />
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">Processing Logs</span>
                </div>
                <button
                    onClick={copyLogs}
                    className="text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 p-1.5 rounded-lg transition-all active:scale-90"
                    title="Copy Logs"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 space-y-2 font-mono text-[11px] leading-relaxed"
            >
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                        <Terminal className="w-8 h-8 text-slate-700 animate-pulse" />
                        <p className="text-slate-600 italic text-xs">Waiting for lead data to process...</p>
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="flex items-start space-x-3 group animate-in fade-in slide-in-from-bottom-1 duration-200">
                            <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                            <span className="shrink-0 mt-0.5">{getLogIcon(log.type)}</span>
                            <span className={`
                                ${log.type === 'info' ? 'text-slate-350' : ''}
                                ${log.type === 'success' ? 'text-green-400 font-semibold' : ''}
                                ${log.type === 'warning' ? 'text-yellow-400 font-semibold' : ''}
                                ${log.type === 'error' ? 'text-rose-400 font-bold' : ''}
                            `}>
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
