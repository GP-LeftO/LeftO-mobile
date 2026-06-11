import { registerRootComponent } from 'expo';

// Must run before App so screen modules read the clamped window width on web.
import './src/web/dimensionsClamp';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
