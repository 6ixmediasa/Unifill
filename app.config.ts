import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Unifill',
  slug: 'unifill',
  scheme: 'unifill',
  version: '1.1.2',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  jsEngine: 'hermes',
  icon: './assets/icon.png',
  android: {
    package: 'com.sixmediasa.unifill',
    versionCode: 7,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    blockedPermissions: ['CAMERA', 'RECORD_AUDIO', 'READ_MEDIA_VIDEO']
  },
  plugins: [
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-3940256099942544~3347511713',
        iosAppId: 'ca-app-pub-3940256099942544~1458002511'
      }
    ],
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
    appEnv: 'test-ads'
  }
});
