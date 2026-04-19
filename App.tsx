import 'react-native-gesture-handler'
import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { Platform } from 'react-native'

import HomeScreen    from './src/screens/HomeScreen'
import OptionsScreen from './src/screens/OptionsScreen'
import HFTScreen     from './src/screens/HFTScreen'
import MT5Screen     from './src/screens/MT5Screen'
import CocoaScreen   from './src/screens/CocoaScreen'
import QuantScreen   from './src/screens/QuantScreen'
import { colors }    from './src/theme'

const Tab = createBottomTabNavigator()

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const TABS = [
  { name: 'Home',    component: HomeScreen,    icon: 'home',       label: 'Home'    },
  { name: 'Options', component: OptionsScreen, icon: 'options',    label: 'Options' },
  { name: 'HFT',     component: HFTScreen,     icon: 'pulse',      label: 'HFT'     },
  { name: 'MT5',     component: MT5Screen,     icon: 'calculator', label: 'MT5'     },
  { name: 'Cocoa',   component: CocoaScreen,   icon: 'leaf',       label: 'Cocoa'   },
  { name: 'Quant',   component: QuantScreen,   icon: 'analytics',  label: 'Quant'   },
]

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: colors.bg,
            borderBottomColor: colors.cardBorder,
            borderBottomWidth: 1,
          },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.cardBorder,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 6,
            paddingTop: 6,
            height: Platform.OS === 'ios' ? 82 : 62,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textDim,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarIcon: ({ focused, color }) => {
            const tab = TABS.find(t => t.name === route.name)
            const iconName: IoniconName = focused
              ? (tab?.icon as IoniconName)
              : (`${tab?.icon}-outline`) as IoniconName
            return <Ionicons name={iconName} size={22} color={color} />
          },
        })}
      >
        {TABS.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{ title: tab.label }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  )
}
