import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import StackNavigator from './src/navigation/StackNavigator';

export default function App() {
  return (
    <View style={styles.container}>
      <StackNavigator />
      <StatusBar style="translucent" />
      {/* Or style="light" depending on your app bar color */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Or your base background color
  },
});