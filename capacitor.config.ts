import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.mobdemo.bookclub',
  appName: 'Book Club',
  webDir: 'www/browser',
  // Patches `fetch`/XHR to route through native networking when running as
  // a real iOS/Android app (not in a browser). Native requests aren't
  // subject to browser CORS restrictions, so this is what makes
  // ImageStorageService's cover-caching fetch actually succeed on-device -
  // no code change needed there once this is on.
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
      SplashScreen: {
      backgroundColor: '#ff9500'
    }
  },
};

export default config;
