"use client";

import React from 'react';

interface DataPreviewProps {
    data: any[][];
    headers: string[];
}

export default function DataPreview({ data, headers }: DataPreviewProps) {
    if (data.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">Sanitized Data Preview</h3>
                <p className="text-xs text-gray-500 mt-1">Showing first 10 rows</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                            {headers.map((h, i) => (
                                <th key={i} className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.slice(0, 10).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-4 py-3 text-gray-700">
                                        {cell || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data.length > 10 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">
                        ... and {data.length - 10} more rows
                    </p>
                </div>
            )}
        </div>
    );
}
