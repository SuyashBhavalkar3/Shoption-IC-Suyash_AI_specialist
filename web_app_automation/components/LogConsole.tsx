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
        <div className="bg-slate-900 rounded-xl overflow-hidden flex flex-col h-[400px]">
            <div className="px-4 py-2 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center space-x-2 text-slate-300">
                    <Terminal className="w-4 h-4" />
                    <span className="text-xs font-mono font-medium">Processing Logs</span>
                </div>
                <button
                    onClick={copyLogs}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                    title="Copy Logs"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] leading-tight"
            >
                {logs.length === 0 ? (
                    <p className="text-slate-500 italic">No logs yet. Upload a file to start.</p>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="flex items-start space-x-3 group">
                            <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                            <span className="shrink-0 mt-0.5">{getLogIcon(log.type)}</span>
                            <span className={`
                ${log.type === 'info' ? 'text-slate-300' : ''}
                ${log.type === 'success' ? 'text-green-400' : ''}
                ${log.type === 'warning' ? 'text-yellow-400' : ''}
                ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
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
