import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { colors } from '@/theme/colors'
import { Profile } from '@/screens/Settings/Profile'
import { KycStatus } from '@/screens/Kyc/KycStatus'
import { KycDocumentUpload } from '@/screens/Kyc/KycDocumentUpload'
import { BeneficiaryList } from '@/screens/Beneficiaries/BeneficiaryList'
import { BeneficiaryNew } from '@/screens/Beneficiaries/BeneficiaryNew'
import { NetworkInspector } from '@/screens/Dev/NetworkInspector'

export type SettingsStackParamList = {
  Profile: undefined
  KycStatus: undefined
  KycDocumentUpload: { docType: string }
  BeneficiaryList: undefined
  BeneficiaryNew: undefined
  NetworkInspector: undefined
}

const Stack = createNativeStackNavigator<SettingsStackParamList>()

export function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="KycStatus" component={KycStatus} />
      <Stack.Screen name="KycDocumentUpload" component={KycDocumentUpload} />
      <Stack.Screen name="BeneficiaryList" component={BeneficiaryList} />
      <Stack.Screen name="BeneficiaryNew" component={BeneficiaryNew} />
      {__DEV__ && <Stack.Screen name="NetworkInspector" component={NetworkInspector} />}
    </Stack.Navigator>
  )
}
