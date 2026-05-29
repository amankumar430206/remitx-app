import React, { useMemo } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { type NavigatorScreenParams } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dashboard } from '@/screens/Home/Dashboard'
import { PaymentsStack, type PaymentsStackParamList } from '@/navigation/PaymentsStack'
import { ApprovalQueue } from '@/screens/Approve/ApprovalQueue'
import { AccountList } from '@/screens/Accounts/AccountList'
import { SettingsStack } from '@/navigation/SettingsStack'
import { useColors, type Colors } from '@/hooks/useColors'
import { fontSize } from '@/theme/spacing'

export type AppTabsParamList = {
  Dashboard: undefined
  Payments: NavigatorScreenParams<PaymentsStackParamList> | undefined
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
  Payments:  { active: 'swap-horizontal', inactive: 'swap-horizontal-outline' },
  Approve:   { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  Accounts:  { active: 'wallet', inactive: 'wallet-outline' },
  Settings:  { active: 'settings', inactive: 'settings-outline' },
}

export function AppTabs() {
  const insets = useSafeAreaInsets()
  const colors = useColors()
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 56
  const s = useMemo(() => createStyles(colors), [colors])

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
        tabBarLabelStyle: s.tabLabel,
        tabBarStyle: [s.tabBar, {
          height: tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
        }],
        tabBarItemStyle: s.tabItem,
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Payments" component={PaymentsStack} />
      <Tab.Screen name="Approve" component={ApprovalQueue} />
      <Tab.Screen name="Accounts" component={AccountList} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  )
}

const createStyles = (c: Colors) => StyleSheet.create({
  tabBar: {
    backgroundColor: c.card,
    borderTopColor: c.border,
    borderTopWidth: 1,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: { paddingBottom: 4 },
  tabLabel: { fontSize: fontSize.xs, fontWeight: '500', marginTop: 2 },
})
