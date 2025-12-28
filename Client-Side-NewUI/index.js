import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

import App from './App';

// Suppress specific warnings/errors from showing as popups
LogBox.ignoreLogs([
  'Encountered two children with the same key', // Duplicate key warning (transfer stops)
  'Non-serializable values were found in the navigation state', // Navigation warning
  'VirtualizedLists should never be nested', // Nested list warning
]);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

