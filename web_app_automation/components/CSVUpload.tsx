"use client";

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { validateHeaders } from '@/lib/utils/sanitization';

interface CSVUploadProps {
    onUpload: (data: any[], fileName: string, mapping: Record<string, string>) => void;
    onError: (error: string) => void;
    isLoading: boolean;
}

export default function CSVUpload({ onUpload, onError, isLoading }: CSVUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const processFile = (file: File) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            onError('Please upload a valid CSV file.');
            return;
        }

        Papa.parse(file, {
            header: false, // Read as arrays first to find the header row
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data as string[][];
                if (rows.length === 0) {
                    onError('The CSV file is empty.');
                    return;
                }

                // Find the header row (the first row that contains at least one mandatory column or alias)
                let headerRowIndex = -1;
                let mapping: Record<string, string> = {};

                for (let i = 0; i < Math.min(rows.length, 10); i++) {
                    const validation = validateHeaders(rows[i]);
                    if (validation.isValid) {
                        headerRowIndex = i;
                        mapping = validation.mapping;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    onError('Could not find mandatory columns: full_name, phone_number, campaign_id, platform. Please check your CSV format.');
                    return;
                }

                // Convert the remaining rows to objects using the found header row
                const headers = rows[headerRowIndex];
                const dataRows = rows.slice(headerRowIndex + 1).map(row => {
                    const obj: any = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index];
                    });
                    return obj;
                });

                onUpload(dataRows, file.name, mapping);
            },
            error: (error) => {
                onError(`Error parsing CSV: ${error.message}`);
            }
        });
    };

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, []);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
        relative border-2 border-dashed rounded-xl p-12 transition-all duration-200
        ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
        >
            <input
                type="file"
                accept=".csv"
                onChange={onFileChange}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <div className="flex flex-col items-center justify-center space-y-4">
                <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isLoading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                        <Upload className="w-8 h-8" />
                    )}
                </div>

                <div className="text-center">
                    <p className="text-lg font-medium text-gray-900">
                        {isLoading ? 'Processing CSV...' : 'Drag and drop your Meta lead CSV'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Accepts only .csv files
                    </p>
                </div>

                {!isLoading && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Select File
                    </button>
                )}
            </div>
        </div>
    );
}
