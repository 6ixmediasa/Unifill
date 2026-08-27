import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Unifill',
  slug: 'unifill',
  scheme: 'unifill',
  version: '1.1.1',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  jsEngine: 'hermes',
  icon: './assets/icon.png',
  android: {
    package: 'com.sixmediasa.unifill',
    versionCode: 6,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    blockedPermissions: ['CAMERA', 'RECORD_AUDIO', 'READ_MEDIA_VIDEO']
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/logo-horizontal.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F6F8FB'
      }
    ]
  ],
  extra: {
    appEnv: 'production'
  }
});
