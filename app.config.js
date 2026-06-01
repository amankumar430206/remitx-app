/**
 * Dynamic Expo config — reads EXPO_PUBLIC_ENV to adjust name and identifiers
 * per build profile (development / staging / production).
 *
 * EAS Build injects env vars from eas.json before this file is evaluated.
 * Local dev uses .env (EXPO_PUBLIC_ENV defaults to "development" if unset).
 */

const ENV = process.env.EXPO_PUBLIC_ENV ?? 'development'
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

const APP_VARIANTS = {
  development: {
    name: 'RemitX (Dev)',
    bundleId: 'com.remitx.mobile.dev',
    package: 'com.remitx.mobile.dev',
  },
  staging: {
    name: 'RemitX (Preview)',
    bundleId: 'com.remitx.mobile.preview',
    package: 'com.remitx.mobile.preview',
  },
  production: {
    name: 'RemitX',
    bundleId: 'com.remitx.mobile',
    package: 'com.remitx.mobile',
  },
}

const variant = APP_VARIANTS[ENV] ?? APP_VARIANTS.development

export default {
  expo: {
    name: variant.name,
    slug: 'remitx',
    version: '1.0.0',
    scheme: 'remitx',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0A0E1A',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: variant.bundleId,
      infoPlist: {
        NSFaceIDUsageDescription:
          'RemitX uses Face ID to securely authenticate your identity.',
        NSCameraUsageDescription:
          'RemitX uses the camera for document scanning during KYC verification.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0E1A',
      },
      package: variant.package,
      permissions: ['USE_BIOMETRIC', 'USE_FINGERPRINT', 'CAMERA'],
    },
    plugins: [
      [
        'expo-local-authentication',
        {
          faceIDPermission:
            'RemitX uses Face ID to securely authenticate your identity.',
        },
      ],
      ['expo-camera', { cameraPermission: 'RemitX uses your camera to scan KYC documents.' }],
      'expo-secure-store',
      '@react-native-community/datetimepicker',
    ],
    updates: {
      url: 'https://u.expo.dev/9f8c39f1-38f5-4694-bd47-615128ce5f1d',
    },
    runtimeVersion: { policy: 'appVersion' },
    extra: {
      apiUrl: API_URL,
      env: ENV,
      eas: {
        projectId: '9f8c39f1-38f5-4694-bd47-615128ce5f1d',
      },
    },
  },
}
