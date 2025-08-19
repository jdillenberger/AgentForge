const fs = require('fs');
const path = require('path');
const https = require('https');

// Create fonts directory if it doesn't exist
const fontsDir = path.join(__dirname, '../src/assets/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Font URLs from Google Fonts (WOFF2 format for modern browsers)
const fonts = {
  // Inter - UI Font
  'Inter-Regular.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
  'Inter-Medium.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2',
  'Inter-SemiBold.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2',
  'Inter-Bold.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2',
  
  // Inter Display - For large headings
  'InterDisplay-Medium.woff2': 'https://fonts.gstatic.com/s/interdisplay/v5/Jenrp4AHuUmlVSPNLdfKWc5Ode1b4NS8iIN6__rJ8cg.woff2',
  'InterDisplay-SemiBold.woff2': 'https://fonts.gstatic.com/s/interdisplay/v5/Jenrp4AHuUmlVSPNLdfKWc5Ode1b4NS8iIN6_8bJ8cg.woff2',
  
  // Source Serif 4 - Content Font
  'SourceSerif4-Regular.woff2': 'https://fonts.gstatic.com/s/sourceserif4/v8/vEFI2_tTDB4M7-auWDN0ahZJW1ge5JB2AXwP8BPYWWOkm08tUjQ.woff2',
  'SourceSerif4-Medium.woff2': 'https://fonts.gstatic.com/s/sourceserif4/v8/vEFI2_tTDB4M7-auWDN0ahZJW1ge5JB2AXwP8BBaWWOkm08tUjQ.woff2',
  'SourceSerif4-SemiBold.woff2': 'https://fonts.gstatic.com/s/sourceserif4/v8/vEFI2_tTDB4M7-auWDN0ahZJW1ge5JB2AXwP8BBuWWOkm08tUjQ.woff2',
  
  // JetBrains Mono - Code Font
  'JetBrainsMono-Regular.woff2': 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2',
  'JetBrainsMono-Medium.woff2': 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKyhPVmUsaaDhw.woff2',
  'JetBrainsMono-Bold.woff2': 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2'
};

// Function to download a file
function downloadFont(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, filename);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded ${filename}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete file on error
        reject(err);
      });
    }).on('error', reject);
  });
}

// Download all fonts
async function downloadAllFonts() {
  console.log('📥 Downloading fonts locally for GDPR compliance...\n');
  
  try {
    for (const [filename, url] of Object.entries(fonts)) {
      await downloadFont(url, filename);
    }
    console.log('\n🎉 All fonts downloaded successfully!');
    console.log('📁 Location: src/assets/fonts/');
  } catch (error) {
    console.error('❌ Error downloading fonts:', error);
    process.exit(1);
  }
}

downloadAllFonts();