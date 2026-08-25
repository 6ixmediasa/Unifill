import type { ExpoConfig, ConfigContext } from 'expo/config';

const PROD_ADMOB_APP_ID = 'ca-app-pub-4506776618810594~2864195386';
const TEST_ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

export default ({ config }: ConfigContext): ExpoConfig => {
  const production = process.env.EAS_BUILD_PROFILE === 'production' || process.env.APP_ENV === 'production';
  const admobAppId = production ? PROD_ADMOB_APP_ID : TEST_ADMOB_APP_ID;

  return {
    ...config,
    name: 'Unifill',
    slug: 'unifill',
    scheme: 'unifill',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#F7F8FC'
    },
    android: {
      package: 'com.sixmediasa.unifill',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#F7F8FC'
      },
      permissions: ['POST_NOTIFICATIONS'],
      blockedPermissions: ['CAMERA', 'RECORD_AUDIO', 'READ_MEDIA_VIDEO']
    },
    plugins: [
      'expo-router',
      'expo-notifications',
      [
        'expo-build-properties',
        {
          android: {
            extraProguardRules: '-keep class com.google.android.gms.internal.consent_sdk.** { *; }'
          }
        }
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: admobAppId,
          delayAppMeasurementInit: true
        }
      ]
    ],
    extra: {
      eas: { projectId: process.env.EAS_PROJECT_ID || undefined },
      appEnv: production ? 'production' : 'development'
    }
  };
};
