"use client";

import React from 'react';

interface DataPreviewProps {
    data: string[][];
    headers: string[];
}

export default function DataPreview({ data, headers }: DataPreviewProps) {
    if (data.length === 0) return null;

    return (
        <div className="bg-card-bg/65 backdrop-blur-md rounded-2xl border border-card-border overflow-hidden shadow-lg shadow-black/[0.02]">
            <div className="px-6 py-4 border-b border-card-border bg-bg-base/30">
                <h3 className="text-sm font-bold text-text-base">Sanitized Data Preview</h3>
                <p className="text-xs text-muted-text mt-0.5">Showing first 10 rows</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-bg-base/50 border-b border-card-border text-muted-text font-bold uppercase tracking-wider text-[10px]">
                            {headers.map((h, i) => (
                                <th key={i} className="px-4 py-3 whitespace-nowrap min-w-[130px]">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/50">
                        {data.slice(0, 10).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-bg-base/40 transition-colors">
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-4 py-3 text-text-base/85 font-medium whitespace-nowrap overflow-hidden max-w-[200px] truncate">
                                        {cell || <span className="text-muted-text/30">-</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data.length > 10 && (
                <div className="px-6 py-3 border-t border-card-border bg-bg-base/30 text-center">
                    <p className="text-xs text-muted-text font-medium">
                        ... and {data.length - 10} more rows
                    </p>
                </div>
            )}
        </div>
    );
}
