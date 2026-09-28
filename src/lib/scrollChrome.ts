import { makeMutable } from 'react-native-reanimated';

/**
 * Shared between the active screen's scroll view and the floating tab bar:
 * 1 while the user is scrolling down through content (bar compacts), 0 otherwise.
 */
export const tabBarCompactTarget = makeMutable(0);
