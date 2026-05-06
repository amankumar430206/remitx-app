import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dashboard } from '@/screens/Home/Dashboard'
import { PaymentHistory } from '@/screens/Payments/PaymentHistory'
import { ApprovalQueue } from '@/screens/Approve/ApprovalQueue'
import { AccountList } from '@/screens/Accounts/AccountList'
import { SettingsStack } from '@/navigation/SettingsStack'
import { colors } from '@/theme/colors'
import { fontSize } from '@/theme/spacing'

export type AppTabsParamList = {
  Dashboard: undefined
  Payments: undefined
  Approve: undefined
  Accounts: undefined
  Settings: undefined
}

const Tab = createBottomTabNavigator<AppTabsParamList>()

type TabIcon = {
  active: keyof typeof Ionicons.glyphMap
  inactive: keyof typeof Ionicons.glyphMap
}

const tabIcons: Record<keyof AppTabsParamList, TabIcon> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Payments: { active: 'swap-horizontal', inactive: 'swap-horizontal-outline' },
  Approve: { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  Accounts: { active: 'wallet', inactive: 'wallet-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
}

export function AppTabs() {
  const insets = useSafeAreaInsets()
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 56

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          const icons = tabIcons[route.name as keyof AppTabsParamList]
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size}
              color={focused ? colors.primary : colors.textMuted}
            />
          )
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [styles.tabBar, {
          height: tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
        }],
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Payments" component={PaymentHistory} />
      <Tab.Screen name="Approve" component={ApprovalQueue} />
      <Tab.Screen name="Accounts" component={AccountList} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: { paddingBottom: 4 },
  tabLabel: { fontSize: fontSize.xs, fontWeight: '500', marginTop: 2 },
})
