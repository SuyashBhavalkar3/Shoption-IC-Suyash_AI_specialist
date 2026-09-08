/**
 * Sanitizes phone number:
 * - Remove prefixes like p:, +91
 * - Remove spaces and special characters
 * - Keep only numeric digits
 * - Prefer last 10 digits
 */
export function sanitizePhoneNumber(value: string | undefined): string {
    if (!value) return "";

    // Remove p:, p : or other prefixes and non-numeric characters
    const cleaned = value.replace(/^[pPcC]\s*:\s*/i, "").replace(/[^0-9]/g, "");

    // Handle +91 prefix if it exists after cleaning but before slicing
    // If the number starts with 91 and has 12 digits, it's likely a +91 number
    let result = cleaned;
    if (result.startsWith("91") && result.length > 10) {
        result = result.slice(2);
    }

    // Return last 10 digits
    return result.slice(-10);
}

/**
 * Sanitizes phone number for WA Communication:
 * - Cleans phone digits to last 10 digits
 * - Prefixes with 91 (e.g. 919876543210)
 */
export function sanitizePhoneNumberWA(value: string | undefined): string {
    const cleaned10 = sanitizePhoneNumber(value);
    if (!cleaned10) return "";
    return `91${cleaned10}`;
}

/**
 * Sanitizes Campaign ID:
 * - Only keep numeric digits
 */
export function sanitizeCampaignId(value: string | undefined): string {
    if (!value) return "";

    // Remove prefixes like c:, campaign: and keep only digits
    return value.replace(/[^0-9]/g, "");
}

/**
 * Generates email from sanitized phone number
 */
export function generateEmailFromPhone(phone: string): string {
    if (!phone) return "";
    return `${phone}@gmail.com`;
}

/**
 * Extracts city from street address
 * Simple heuristic: last part of address usually contains city or just return blank if too complex
 */
export function extractCity(address: string | undefined): string {
    if (!address) return "";

    // Basic heuristic: often addresses are comma separated
    const parts = address.split(',').map(p => p.trim());
    if (parts.length > 1) {
        // Return second to last part or last part depending on common formats
        // For now, let's just return the last part as a placeholder or improve if needed
        return parts[parts.length - 1];
    }

    return address;
}

/**
 * Maps expected mandatory columns to their possible aliases in raw CSVs for CRM mode
 */
const MANDATORY_ALIASES: Record<string, string[]> = {
    'full_name': ['full_name', 'fullname', 'name', 'Full Name', 'Name', 'FULL_NAME', 'FULL NAME'],
    'phone_number': ['phone_number', 'phone', 'mobile', 'Phone Number', 'Phone', 'Mobile', 'PHONE_NUMBER', 'PHONE', 'MOBILE'],
    'campaign_id': ['campaign_id', 'campaign', 'Campaign ID'],
    'platform': ['platform', 'source', 'Source', 'Platform']
};

/**
 * Aliases for WA Communication mode headers (name & phone only)
 */
const WA_ALIASES: Record<string, string[]> = {
    'full_name': ['full_name', 'fullname', 'name', 'Full Name', 'Name', 'FULL_NAME', 'FULL NAME', 'customer_name', 'Customer Name', 'Lead Name'],
    'phone_number': ['phone_number', 'phone', 'mobile', 'Phone Number', 'Phone', 'Mobile', 'PHONE_NUMBER', 'PHONE', 'MOBILE', 'contact', 'Contact', 'mobile_number', 'Mobile Number', 'wa_number']
};

/**
 * Maps optional City/Address columns to their possible aliases in raw CSVs
 */
const CITY_ALIASES = [
    'city', 'City', 'CITY',
    'adress', 'Adress', 'ADRESS',
    'address', 'Address', 'ADDRESS',
    'street_address', 'street_adress', 'Street_Address', 'Street Address',
    'street-address', 'street-adress', 'street address', 'street adress'
];

function normalizeHeader(value: string): string {
    return value.replace(/^\uFEFF/, '').trim().toLowerCase();
}

/**
 * Validates if the raw data has the mandatory columns (or their aliases)
 * and maps optional city/address headers for CRM mode.
 */
export function validateHeaders(headers: string[]): { isValid: boolean; missing: string[]; mapping: Record<string, string> } {
    const missing: string[] = [];
    const mapping: Record<string, string> = {};
    const normalizedHeaderMap = new Map<string, string>();

    headers.forEach((header) => {
        const normalized = normalizeHeader(header);
        if (!normalizedHeaderMap.has(normalized)) {
            normalizedHeaderMap.set(normalized, header);
        }
    });

    Object.entries(MANDATORY_ALIASES).forEach(([key, aliases]) => {
        const foundAlias = aliases
            .map((alias) => normalizedHeaderMap.get(normalizeHeader(alias)))
            .find((value): value is string => Boolean(value));
        if (foundAlias) {
            mapping[key] = foundAlias;
        } else {
            missing.push(key);
        }
    });

    // Match optional city column
    const foundCityAlias = CITY_ALIASES
        .map((alias) => normalizedHeaderMap.get(normalizeHeader(alias)))
        .find((value): value is string => Boolean(value));
    if (foundCityAlias) {
        mapping['city'] = foundCityAlias;
    }

    return {
        isValid: missing.length === 0,
        missing,
        mapping
    };
}

/**
 * Checks if a normalized header string looks like a Name column.
 */
function isNameHeader(normalized: string): boolean {
    // Exclude phone, email, campaign, id, address, etc.
    if (normalized.includes('phone') || normalized.includes('mobile') || normalized.includes('contact') || normalized.includes('number') || normalized.includes('email') || normalized.includes('city') || normalized.includes('address')) {
        return false;
    }
    // Match any header containing 'name', 'fname', 'lname', 'client', 'lead', 'person', 'user', 'customer'
    return normalized.includes('name') || normalized.includes('fname') || normalized.includes('lname') || normalized.includes('client') || normalized.includes('lead') || normalized.includes('person') || normalized.includes('user') || normalized.includes('customer');
}

/**
 * Checks if a normalized header string looks like a Phone / Mobile column.
 */
function isPhoneHeader(normalized: string): boolean {
    return normalized.includes('phone') ||
           normalized.includes('mobile') ||
           normalized.includes('contact') ||
           normalized.includes('cell') ||
           normalized.includes('whatsapp') ||
           normalized.includes('wa_num') ||
           normalized.includes('wanum') ||
           normalized.includes('tele') ||
           normalized.includes('ph_') ||
           normalized.includes('_ph') ||
           normalized === 'ph' ||
           normalized === 'mo' ||
           normalized === 'num' ||
           normalized === 'number';
}

/**
 * Validates if the raw data has Name and Phone columns
 * for WA Communication mode using flexible exact aliases and smart fuzzy keyword matching.
 */
export function validateHeadersWA(headers: string[]): { isValid: boolean; missing: string[]; mapping: Record<string, string> } {
    const missing: string[] = [];
    const mapping: Record<string, string> = {};
    const normalizedHeaderMap = new Map<string, string>();

    headers.forEach((header) => {
        const normalized = normalizeHeader(header);
        if (!normalizedHeaderMap.has(normalized)) {
            normalizedHeaderMap.set(normalized, header);
        }
    });

    // 1. Try exact predefined aliases first
    Object.entries(WA_ALIASES).forEach(([key, aliases]) => {
        const foundAlias = aliases
            .map((alias) => normalizedHeaderMap.get(normalizeHeader(alias)))
            .find((value): value is string => Boolean(value));
        if (foundAlias) {
            mapping[key] = foundAlias;
        }
    });

    // 2. Fallback to smart fuzzy matching if full_name was not matched
    if (!mapping['full_name']) {
        for (const header of headers) {
            const normalized = normalizeHeader(header);
            if (isNameHeader(normalized)) {
                mapping['full_name'] = header;
                break;
            }
        }
    }

    // 3. Fallback to smart fuzzy matching if phone_number was not matched
    if (!mapping['phone_number']) {
        for (const header of headers) {
            const normalized = normalizeHeader(header);
            if (isPhoneHeader(normalized)) {
                mapping['phone_number'] = header;
                break;
            }
        }
    }

    if (!mapping['full_name']) missing.push('full_name');
    if (!mapping['phone_number']) missing.push('phone_number');

    return {
        isValid: missing.length === 0,
        missing,
        mapping
    };
}

