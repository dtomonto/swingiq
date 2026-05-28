import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: { backgroundColor: '#052e16' },
        headerTintColor: '#fff',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'SwingIQ',
        }}
      />
      <Tabs.Screen name="sessions" options={{ title: 'Sessions' }} />
      <Tabs.Screen name="diagnose" options={{ title: 'Diagnose' }} />
      <Tabs.Screen name="training" options={{ title: 'Training' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
