import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    screenshotsFolder: 'cypress_screenshots',
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        launchOptions.args.push('--window-size=1400,1400');
        return launchOptions;
      })
    },
    viewportWidth: 1280,
    viewportHeight: 1024
  },
});
