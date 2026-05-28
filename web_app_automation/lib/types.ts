export interface RawLead {
  full_name?: string;
  phone_number?: string;
  email?: string;
  campaign_id?: string;
  platform?: string;
  street_address?: string;
  [key: string]: any; // For dynamic Marathi questions
}

export interface SanitizedLead {
  'Full Name': string;
  'Phone Number': string;
  'Email': string;
  'Campaign ID': string;
  'Source': string;
  'City': string;
  'Q1': string;
  'Q2': string;
  'Q3': string;
  'Q4': string;
  'Q5': string;
  'Q6': string;
  'Q7': string;
  'Q8': string;
  'Q9': string;
  'Q10': string;
  'Answer  1': string;
  'Answer  2': string;
  'Answer  3': string;
  'Answer  4': string;
  'Answer  5': string;
  'Answer  6': string;
  'Answer  7': string;
  'Answer  8': string;
  'Answer  9': string;
  'Answer  10': string;
  'Coloumn 1': string;
  'Coloumn 2': string;
  'Coloumn 3': string;
  'Coloumn 4': string;
  'Coloumn 5': string;
  'Coloumn 6': string;
  'Coloumn 7': string;
  'Coloumn 8': string;
  'Coloumn 9': string;
  'Coloumn 10': string; // Duplicate column 10 as per requirement
  'Coloumn 10 ': string; // To handle the duplicate key in a JS object while maintaining the schema for CSV export
  // Actually, for CSV generation, we might need an array of values to preserve order and duplicates.
}

export interface ProcessingLog {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export interface ProcessingResult {
  data: any[][]; // Array of arrays to handle duplicate column names and exact order
  headers: string[];
  logs: ProcessingLog[];
  summary: {
    totalRows: number;
    processedRows: number;
    failedRows: number;
  };
}
