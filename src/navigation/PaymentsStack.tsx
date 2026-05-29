import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { colors } from '@/theme/colors'
import { type Payment } from '@/api/payments'
import { PaymentHistory } from '@/screens/Payments/PaymentHistory'
import { PaymentDetail } from '@/screens/Payments/PaymentDetail'

export type PaymentsStackParamList = {
  PaymentList: undefined
  PaymentDetail: { payment: Payment }
}

const Stack = createNativeStackNavigator<PaymentsStackParamList>()

export function PaymentsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="PaymentList" component={PaymentHistory} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetail} />
    </Stack.Navigator>
  )
}
