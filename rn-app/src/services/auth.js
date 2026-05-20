import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'pawmate_access_token';
const USER_ID_KEY = 'pawmate_user_id';

export async function saveAuthState({ token, userId }) {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
  if (userId) {
    await SecureStore.setItemAsync(USER_ID_KEY, String(userId));
  }
}

export async function getAuthToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getAuthUserId() {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function clearAuthState() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
}
