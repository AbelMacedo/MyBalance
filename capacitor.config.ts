import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abelmacedo.mybalance',
  appName: 'MyBalance',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    cleartext: false
  }
};

export default config;
