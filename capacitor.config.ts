import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jerusalem.ministry.app',
  appName: 'Jerusalem Ministry',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Optional plugin configurations
  },
};

export default config;
