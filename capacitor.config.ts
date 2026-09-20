import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.godspeed.grader',
  appName: 'Godspeed Grader',
  webDir: 'dist',
  plugins: {
    // Allow the camera plugin to use the rear camera by default
    Camera: {
      // No extra config needed – handled in code
    },
  },
  android: {
    // Ensures the app uses HTTPS for any external API calls (Firebase, sync API)
    allowMixedContent: false,
    // Larger back-stack so scanner → results navigation feels native
    overrideUserAgent: 'GodspeedGrader-Android',
  },
  // ── DEV-ONLY: point at your Vite dev server on the local network ──────────
  // Uncomment the block below while developing. Replace the IP with your
  // machine's LAN address (run `ipconfig` to find it).
  //
  // server: {
  //   url: 'http://192.168.x.x:5173',
  //   cleartext: true,
  // },
};

export default config;
