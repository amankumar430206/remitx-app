import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { Platform, StyleSheet } from 'react-native'
import { Dashboard } from '@/screens/Home/Dashboard'
import { PaymentHistory } from '@/screens/Payments/PaymentHistory'
import { ApprovalQueue } from '@/screens/Approve/ApprovalQueue'
import { AccountList } from '@/screens/Accounts/AccountList'
import { PlaceholderScreen } from '@/screens/placeholders/PlaceholderScreen'
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

function SettingsScreen() { return <PlaceholderScreen name="Settings" /> }

export function AppTabs() {
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
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Payments" component={PaymentHistory} />
      <Tab.Screen name="Approve" component={ApprovalQueue} />
      <Tab.Screen name="Accounts" component={AccountList} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
    height: Platform.OS === 'ios' ? 85 : 65,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: { paddingBottom: Platform.OS === 'ios' ? 4 : 8 },
  tabLabel: { fontSize: fontSize.xs, fontWeight: '500', marginTop: 2 },
})
