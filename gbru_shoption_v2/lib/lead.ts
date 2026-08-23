import 'server-only';
import fs from 'fs';
import path from 'path';

export async function createB2CLead(leadName: string, mobileNo: string) {
  try {
    // Bulletproof fallback: manually parse .env.local if Next.js fails to load env variables in dev
    if (!process.env.CAMPAIGN_NAME) {
      try {
        // Try workspace root (process.cwd()) and directory tree upward traversal
        const pathsToTry = [
          path.resolve(process.cwd(), '.env.local'),
          path.resolve(process.cwd(), '../.env.local'),
          path.resolve(__dirname, '../../../../.env.local'),
          path.resolve(__dirname, '../../../.env.local'),
          path.resolve(__dirname, '../../.env.local')
        ];
        
        let envPath = "";
        for (const p of pathsToTry) {
          if (fs.existsSync(p)) {
            envPath = p;
            break;
          }
        }

        if (envPath) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          envContent.split('\n').forEach((line) => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
              const key = match[1];
              let value = match[2] || '';
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
              }
              if (value.startsWith("'") && value.endsWith("'")) {
                value = value.substring(1, value.length - 1);
              }
              process.env[key] = value.trim();
            }
          });
        }
      } catch (err: any) {}
    }

    const baseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;
    const campaignName = process.env.CAMPAIGN_NAME;

    if (!baseUrl || !apiKey || !apiSecret) {
      return { success: false, message: 'Missing API credentials' };
    }

    if (!campaignName) {
      return { success: false, message: 'Missing CAMPAIGN_NAME' };
    }

    const requestBody = {
      lead_name: leadName,
      mobile_no: mobileNo,
      campaign_name: campaignName,
    };
    

    const res = await fetch(`${baseUrl}/api/method/warrior.apis.lead.add_b2c_auto_lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      
      return { success: false, status: res.status, message: errorText };
    }

    const data = await res.json();
    
    return { success: true, data };
  } catch (error: any) {
    
    return { success: false, error: error.message };
  }
}
