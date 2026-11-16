import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '../ios/App/App/capacitor.config.json');

if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const json = JSON.parse(raw);
    if (Array.isArray(json.packageClassList)) {
      if (!json.packageClassList.includes('NativeStoreKitPlugin')) {
        json.packageClassList.push('NativeStoreKitPlugin');
        fs.writeFileSync(configPath, JSON.stringify(json, null, '\t') + '\n', 'utf-8');
        console.log('Successfully patched capacitor.config.json with NativeStoreKitPlugin');
      }
    }
  } catch (err) {
    console.error('Failed to patch capacitor.config.json:', err);
  }
}
