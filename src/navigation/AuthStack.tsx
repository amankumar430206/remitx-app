import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Login } from '@/screens/Login'
import { MfaChallenge } from '@/screens/MfaChallenge'
import { colors } from '@/theme/colors'

export type AuthStackParamList = {
  Login: undefined
  MfaChallenge: { challengeToken: string; tenantSlug: string }
}

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="MfaChallenge" component={MfaChallenge} />
    </Stack.Navigator>
  )
}
