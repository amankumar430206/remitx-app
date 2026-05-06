import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Platform } from 'react-native'
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

function DashboardScreen() { return <PlaceholderScreen name="Dashboard" /> }
function PaymentsScreen() { return <PlaceholderScreen name="Payments" /> }
function ApproveScreen() { return <PlaceholderScreen name="Approve" /> }
function AccountsScreen() { return <PlaceholderScreen name="Accounts" /> }
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Approve" component={ApproveScreen} />
      <Tab.Screen name="Accounts" component={AccountsScreen} />
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
  tabItem: {
    paddingBottom: Platform.OS === 'ios' ? 4 : 8,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
})
