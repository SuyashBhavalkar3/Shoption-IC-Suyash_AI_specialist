const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service key needed to bypass RLS for seeding

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const matchUrl = line.match(/^\s*NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$/);
    const matchKey = line.match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)$/);
    const matchAnon = line.match(/^\s*NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)$/);
    if (matchUrl) supabaseUrl = matchUrl[1].trim().replace(/['"]/g, '');
    if (matchKey) supabaseServiceKey = matchKey[1].trim().replace(/['"]/g, '');
    else if (matchAnon && !supabaseServiceKey) {
      // Fallback to anon key if service key not specified, though write policy may block depending on RLS
      supabaseServiceKey = matchAnon[1].trim().replace(/['"]/g, '');
    }
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Please specify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CATEGORIES = ['Mobiles', 'Laptops', 'Audio', 'Gaming', 'Accessories', 'Smart Home'];

const PRODUCT_TEMPLATES = {
  Mobiles: [
    { name: 'Quantum X Pro', brand: 'Aero', basePrice: 999 },
    { name: 'PixelFold Lite', brand: 'Nova', basePrice: 799 },
    { name: 'Vortex 12 Note', brand: 'Zetta', basePrice: 499 },
    { name: 'Horizon Flip', brand: 'Aero', basePrice: 1099 },
    { name: 'Luna Secure SE', brand: 'Cipher', basePrice: 349 },
    { name: 'Neo 5G Active', brand: 'Zetta', basePrice: 299 },
    { name: 'Apex Ultra Max', brand: 'Aero', basePrice: 1199 },
    { name: 'Prime X1', brand: 'Nova', basePrice: 199 }
  ],
  Laptops: [
    { name: 'AeroBook Pro 14', brand: 'Aero', basePrice: 1299 },
    { name: 'Titan Gaming 17', brand: 'Vortex', basePrice: 2199 },
    { name: 'NovaBook Air', brand: 'Nova', basePrice: 949 },
    { name: 'Zenith Creator 16', brand: 'Zetta', basePrice: 1799 },
    { name: 'Flex Note Duo', brand: 'Aero', basePrice: 1499 },
    { name: 'Chromium Cloud 11', brand: 'Nova', basePrice: 249 },
    { name: 'Vapor Thin 13', brand: 'Vortex', basePrice: 1099 }
  ],
  Audio: [
    { name: 'AeroPods Max Noise-Cancelling', brand: 'Aero', basePrice: 299 },
    { name: 'NovaBuds Live Wireless', brand: 'Nova', basePrice: 129 },
    { name: 'Vortex Stage Soundbar', brand: 'Vortex', basePrice: 249 },
    { name: 'StudioPro Monitor Headset', brand: 'AudioQuest', basePrice: 199 },
    { name: 'PocketBeat Bluetooth Speaker', brand: 'Zetta', basePrice: 49 },
    { name: 'SubZero Bass Over-Ear', brand: 'Vortex', basePrice: 159 },
    { name: 'EchoFlow In-Ear Buds', brand: 'Nova', basePrice: 79 }
  ],
  Gaming: [
    { name: 'Vortex Console X', brand: 'Vortex', basePrice: 499 },
    { name: 'ProStrike Mechanical Keyboard', brand: 'Apex', basePrice: 129 },
    { name: 'G-Sens Elite Wireless Mouse', brand: 'Apex', basePrice: 89 },
    { name: 'HoloView VR Headset', brand: 'Nova', basePrice: 599 },
    { name: 'OmniDirectional Gaming Mat', brand: 'Apex', basePrice: 39 },
    { name: 'RetroCade Mini Handheld', brand: 'Zetta', basePrice: 69 },
    { name: 'Apex Commander Gaming Chair', brand: 'Apex', basePrice: 299 }
  ],
  Accessories: [
    { name: 'VoltCharge 100W Multi-Port', brand: 'Volt', basePrice: 59 },
    { name: 'MagHold Wireless Car Mount', brand: 'Volt', basePrice: 39 },
    { name: 'ArmorCase Heavy Duty', brand: 'Armor', basePrice: 29 },
    { name: 'Type-C Travel Dock 8-in-1', brand: 'Volt', basePrice: 79 },
    { name: 'Carbon Shield Backpack', brand: 'Armor', basePrice: 99 },
    { name: 'VoltSafe Braided Cable 2m', brand: 'Volt', basePrice: 15 },
    { name: 'Nano Screen Protector', brand: 'Armor', basePrice: 12 }
  ],
  'Smart Home': [
    { name: 'EchoHub Smart Display', brand: 'Aero', basePrice: 149 },
    { name: 'Luna Lumina Smart Bulb Pack', brand: 'Nova', basePrice: 39 },
    { name: 'ThermoSense Smart Thermostat', brand: 'Zetta', basePrice: 199 },
    { name: 'SecureCam Pro Outdoor', brand: 'Cipher', basePrice: 179 },
    { name: 'SmartLock Touchless Entry', brand: 'Cipher', basePrice: 249 },
    { name: 'FlowWater Smart Leak Detector', brand: 'Zetta', basePrice: 49 },
    { name: 'AeroPure Air Purifier Connected', brand: 'Aero', basePrice: 229 }
  ]
};

// Generates 100 products
function generateProducts() {
  const products = [];
  let idCounter = 1;

  // We want to make sure we get exactly 100 products
  // Let's distribute them relatively evenly across categories
  const targetCount = 100;
  const itemsPerCategory = Math.ceil(targetCount / CATEGORIES.length);

  // Realistic product stock availability status
  const stockDistribution = [0, 5, 12, 24, 45, 90, 150];

  for (let i = 0; i < targetCount; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const templates = PRODUCT_TEMPLATES[category];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Add variations so the 100 items are distinct
    const suffixIndex = Math.floor(i / CATEGORIES.length) + 1;
    const variationSuffix = suffixIndex === 1 ? '' : ` (Gen ${suffixIndex})`;
    
    const name = `${template.name}${variationSuffix}`;
    const priceVariance = (Math.random() * 0.2 - 0.1) * template.basePrice; // +/- 10%
    const price = Math.round((template.basePrice + priceVariance) * 100) / 100;
    
    const stock = stockDistribution[Math.floor(Math.random() * stockDistribution.length)];
    
    // Unsplash tech categories
    let imageKeyword = 'gadget';
    if (category === 'Mobiles') imageKeyword = 'smartphone';
    else if (category === 'Laptops') imageKeyword = 'laptop';
    else if (category === 'Audio') imageKeyword = 'headphones';
    else if (category === 'Gaming') imageKeyword = 'gaming';
    else if (category === 'Accessories') imageKeyword = 'charger';
    else if (category === 'Smart Home') imageKeyword = 'smarthome';

    // Seeded image path using picsum or stable unsplash urls
    // Using a different ID so we get distinct looking placeholder images
    const imageUrl = `https://images.unsplash.com/photo-${1600000000000 + i * 12345}?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&q=80`;

    const description = `The high-performance ${name} from ${template.brand} is engineered for modern users who demand efficiency, longevity, and design excellence. Features top-tier specifications in the ${category} class, offering seamless integration with your lifestyle. Designed with premium materials and backed by industry-standard warranties.`;

    products.push({
      name,
      description,
      price,
      image_url: imageUrl,
      category,
      stock,
      created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString() // Created at offset for sorting
    });
  }

  return products;
}

async function seed() {
  console.log('Starting seed process...');
  const products = generateProducts();

  console.log(`Generated ${products.length} products.`);

  // Clear existing products - we do this by deleting all rows
  try {
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all products

    if (deleteError) {
      console.warn('Warning: Could not clear existing products. This is fine if seeding for the first time.', deleteError.message);
    } else {
      console.log('Cleared existing products successfully.');
    }

    // Insert 100 products in chunks of 20 to avoid payload limits
    const chunkSize = 20;
    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('products')
        .insert(chunk)
        .select();

      if (error) {
        throw error;
      }
      console.log(`Successfully seeded products ${i + 1} to ${Math.min(i + chunkSize, products.length)}`);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
