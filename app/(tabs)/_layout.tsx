import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';
import { ConnectionBanner } from '@/components/ConnectionBanner';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.item}>
      <Text style={[tabStyles.icon, { color: focused ? COLORS.cyan : '#555' }]}>
        {icon}
      </Text>
      <Text style={[tabStyles.label, { color: focused ? COLORS.cyan : '#444' }]}>
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default function TabLayout() {
  return (
    <>
    <ConnectionBanner />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: '#555',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jugar',
          tabBarIcon: ({ focused }) => <TabIcon icon="▶" label="Jugar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Tienda',
          tabBarIcon: ({ focused }) => <TabIcon icon="♦" label="Tienda" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ focused }) => <TabIcon icon="◆" label="Ranking" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon icon="●" label="Perfil" focused={focused} />,
        }}
      />
    </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0d0e1a',
    borderTopColor: '#1a1b2e',
    borderTopWidth: 1,
    height: Platform.OS === 'web' ? 50 : 60,
    paddingBottom: Platform.OS === 'web' ? 4 : 12,
    paddingTop: 4,
  },
});
