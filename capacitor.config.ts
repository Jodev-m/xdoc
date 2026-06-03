import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xdoc.mobile',
  appName: 'xdoc-mobile',
  webDir: '.next',
  server: {
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
  },
};

export default config;
