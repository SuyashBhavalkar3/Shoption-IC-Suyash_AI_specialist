import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const galleryDir = path.join(process.cwd(), "public", "gallery_assets");
    const items: any[] = [];
    let idCounter = 1;

    // Helper to scan directory
    const scanDir = (subDir: string, category: string) => {
      const fullPath = path.join(galleryDir, subDir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        files.forEach((file) => {
          if (file.toLowerCase().endsWith(".jpg") || file.toLowerCase().endsWith(".png") || file.toLowerCase().endsWith(".jpeg")) {
            // Encode spaces and special characters for URLs
            const urlPath = `/gallery_assets/${subDir}/${file}`.replace(/\\/g, "/");
            items.push({
              id: idCounter++,
              title: file.split(".")[0].replace(/[-_]/g, " "),
              category: category,
              src: urlPath,
              description: `${category.replace(/_/g, " ")} image - ${file}`
            });
          }
        });
      }
    };

    // Scan categories
    scanDir("Dealer meet", "dealer_meet");
    scanDir("Event/Expo 2024", "events");
    scanDir("life at Work", "farmers"); // Map 'life at Work' folder as 'farmers' or general category

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
