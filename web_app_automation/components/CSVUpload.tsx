"use client";

import React, { useState, useCallback } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { validateHeaders } from '@/lib/utils/sanitization';
import { RawLead } from '@/lib/types';

interface CSVUploadProps {
    onUpload: (data: RawLead[], fileName: string, mapping: Record<string, string>) => void;
    onError: (error: string) => void;
    isLoading: boolean;
}

export default function CSVUpload({ onUpload, onError, isLoading }: CSVUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const processFile = useCallback((file: File) => {
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
                    const obj: RawLead = {};
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
    }, [onUpload, onError]);

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
    }, [processFile]);

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
                relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300
                ${isDragging ? 'border-primary-brand bg-primary-brand/[0.04] scale-[0.99]' : 'border-card-border hover:border-muted-border hover:scale-[1.01] bg-card-bg/60 backdrop-blur-md shadow-lg shadow-black/[0.02]'}
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
                <div className={`p-4 rounded-2xl transition-all duration-300 ${isDragging ? 'bg-primary-brand/10 text-primary-brand scale-110' : 'bg-bg-base text-muted-text'}`}>
                    {isLoading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                        <Upload className="w-8 h-8" />
                    )}
                </div>

                <div className="text-center">
                    <p className="text-lg font-semibold text-text-base">
                        {isLoading ? 'Processing CSV...' : 'Drag and drop your Meta lead CSV'}
                    </p>
                    <p className="text-sm text-muted-text mt-1">
                        Accepts only .csv files
                    </p>
                </div>

                {!isLoading && (
                    <button className="px-5 py-2.5 bg-primary-brand text-white rounded-xl text-sm font-semibold hover:bg-primary-brand/95 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary-brand/15">
                        Select File
                    </button>
                )}
            </div>
        </div>
    );
}
