import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const production = process.env.EAS_BUILD_PROFILE === 'production' || process.env.APP_ENV === 'production';

  return {
    ...config,
    name: 'Unifill',
    slug: 'unifill',
    scheme: 'unifill',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    icon: './assets/icon.png',
    android: {
      package: 'com.sixmediasa.unifill',
      versionCode: 2,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF'
      },
      permissions: ['POST_NOTIFICATIONS'],
      blockedPermissions: ['CAMERA', 'RECORD_AUDIO', 'READ_MEDIA_VIDEO']
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/logo-horizontal.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#F7F8FC'
        }
      ],
      'expo-notifications',
      [
        'expo-build-properties',
        {
          android: {
            extraProguardRules: '-keep class expo.modules.** { *; }'
          }
        }
      ]
    ],
    extra: {
      eas: { projectId: process.env.EAS_PROJECT_ID || undefined },
      appEnv: production ? 'production' : 'development'
    }
  };
};
