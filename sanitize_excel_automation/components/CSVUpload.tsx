"use client";

import React, { useState, useCallback } from 'react';
import { Upload, Loader2, Files } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { validateHeaders, validateHeadersWA } from '@/lib/utils/sanitization';
import { RawLead, SanitizationMode } from '@/lib/types';

export interface ParsedFile {
    data: RawLead[];
    fileName: string;
    mapping: Record<string, string>;
}

interface CSVUploadProps {
    onFilesReady: (files: ParsedFile[]) => void;
    onError: (error: string) => void;
    isLoading: boolean;
    mode?: SanitizationMode;
}

/** Helper to check if file is CSV or Excel */
function isSupportedFile(file: File): boolean {
    const name = file.name.toLowerCase();
    return name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls');
}

/** Parses an Excel or CSV File into a ParsedFile object */
async function parseUploadedFile(file: File, mode: SanitizationMode = 'crm'): Promise<ParsedFile | { fileName: string; error: string }> {
    const name = file.name.toLowerCase();

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
                return { fileName: file.name, error: 'Excel file contains no sheets.' };
            }
            const sheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

            if (rows.length === 0) {
                return { fileName: file.name, error: 'The Excel file is empty.' };
            }

            const headerValidator = mode === 'wa' ? validateHeadersWA : validateHeaders;
            let headerRowIndex = -1;
            let mapping: Record<string, string> = {};

            for (let i = 0; i < Math.min(rows.length, 10); i++) {
                const rowHeaders = (rows[i] || []).map((h) => String(h || ''));
                const validation = headerValidator(rowHeaders);
                if (validation.isValid) {
                    headerRowIndex = i;
                    mapping = validation.mapping;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                const missingText = mode === 'wa'
                    ? 'Could not find Name or Phone columns (e.g. name, full_name, phone, mobile).'
                    : 'Could not find mandatory columns (full_name, phone_number, campaign_id, platform).';
                return { fileName: file.name, error: missingText };
            }

            const headers = (rows[headerRowIndex] || []).map((h) => String(h || ''));
            const dataRows = rows.slice(headerRowIndex + 1).map((row) => {
                const obj: RawLead = {};
                headers.forEach((header, index) => {
                    if (header) {
                        obj[header] = row[index] !== undefined ? String(row[index]) : '';
                    }
                });
                return obj;
            });

            return { data: dataRows, fileName: file.name, mapping };
        } catch (err) {
            return { fileName: file.name, error: `Excel read error: ${err instanceof Error ? err.message : 'Unknown error'}` };
        }
    }

    // Default CSV handling
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data as string[][];
                if (rows.length === 0) {
                    resolve({ fileName: file.name, error: 'The CSV file is empty.' });
                    return;
                }

                const headerValidator = mode === 'wa' ? validateHeadersWA : validateHeaders;
                let headerRowIndex = -1;
                let mapping: Record<string, string> = {};

                for (let i = 0; i < Math.min(rows.length, 10); i++) {
                    const validation = headerValidator(rows[i]);
                    if (validation.isValid) {
                        headerRowIndex = i;
                        mapping = validation.mapping;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    const missingText = mode === 'wa'
                        ? 'Could not find Name or Phone columns (e.g. name, full_name, phone, mobile).'
                        : 'Could not find mandatory columns (full_name, phone_number, campaign_id, platform).';
                    resolve({ fileName: file.name, error: missingText });
                    return;
                }

                const headers = rows[headerRowIndex];
                const dataRows = rows.slice(headerRowIndex + 1).map((row) => {
                    const obj: RawLead = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index];
                    });
                    return obj;
                });

                resolve({ data: dataRows, fileName: file.name, mapping });
            },
            error: (err) => {
                resolve({ fileName: file.name, error: `Parse error: ${err.message}` });
            },
        });
    });
}

export default function CSVUpload({ onFilesReady, onError, isLoading, mode = 'crm' }: CSVUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    const processFiles = useCallback(
        async (files: File[]) => {
            const validFiles = files.filter(isSupportedFile);

            if (validFiles.length === 0) {
                onError('No valid files found. Please upload .csv, .xlsx, or .xls files only.');
                return;
            }

            setIsParsing(true);
            // Double requestAnimationFrame guarantees browser paints spinner overlay before parsing CPU work begins
            requestAnimationFrame(() => {
                requestAnimationFrame(async () => {
                    try {
                        const results: (ParsedFile | { fileName: string; error: string })[] = [];
                        for (const f of validFiles) {
                            const parsed = await parseUploadedFile(f, mode);
                            results.push(parsed);
                            // Yield to browser UI loop between files
                            await new Promise((r) => setTimeout(r, 0));
                        }

                        const errors = results.filter((r): r is { fileName: string; error: string } => 'error' in r);
                        const parsed = results.filter((r): r is ParsedFile => !('error' in r));

                        if (errors.length > 0) {
                            const errorMessages = errors.map((e) => `"${e.fileName}": ${e.error}`).join('\n');
                            onError(`${errors.length} file(s) failed:\n${errorMessages}`);
                        }

                        if (parsed.length > 0) {
                            onFilesReady(parsed);
                        }
                    } finally {
                        setIsParsing(false);
                    }
                });
            });
        },
        [onFilesReady, onError, mode]
    );

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) processFiles(files);
        },
        [processFiles]
    );

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length > 0) processFiles(files);
        // Reset input so same files can be re-selected
        e.target.value = '';
    };

    const busy = isLoading || isParsing;

    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
                relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300
                ${isDragging
                    ? 'border-primary-brand bg-card-bg scale-[0.99]'
                    : 'border-card-border hover:border-muted-border hover:scale-[1.01] bg-card-bg'
                }
                ${busy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <input
                type="file"
                accept=".csv,.xlsx,.xls"
                multiple
                onChange={onFileChange}
                disabled={busy}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <div className="flex flex-col items-center justify-center space-y-4">
                <div
                    className={`p-4 rounded-2xl transition-all duration-300 ${
                        isDragging || busy
                            ? 'bg-card-bg text-primary-brand scale-110'
                            : 'bg-bg-base text-muted-text'
                    }`}
                >
                    {busy ? (
                        <Loader2 className="w-10 h-10 animate-spin text-primary-brand" />
                    ) : isDragging ? (
                        <Files className="w-8 h-8" />
                    ) : (
                        <Upload className="w-8 h-8" />
                    )}
                </div>

                <div className="text-center">
                    <p className="text-lg font-semibold text-text-base flex items-center justify-center gap-2">
                        {busy ? (
                            <>
                                <span>Processing large file(s)...</span>
                            </>
                        ) : (
                            'Drag and drop your CSV or Excel files'
                        )}
                    </p>
                    <p className="text-sm text-muted-text mt-1">
                        {busy ? 'Please wait while data is parsed and sanitized' : 'Select one or multiple .csv, .xlsx, or .xls files'}
                    </p>
                </div>

                {!busy && (
                    <button className="px-5 py-2.5 bg-primary-brand text-bg-base rounded-xl text-sm font-semibold hover:bg-primary-brand hover:scale-105 active:scale-95 transition-all">
                        Select Files
                    </button>
                )}
            </div>
        </div>
    );
}


