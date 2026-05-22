let memoryToken = null;
let memoryUserId = null;

export async function saveAuthState({ token, userId }) {
  if (token) {
    memoryToken = token;
  }
  if (userId) {
    memoryUserId = String(userId);
  }
}

export async function getAuthToken() {
  return memoryToken;
}

export async function getAuthUserId() {
  return memoryUserId;
}

export async function clearAuthState() {
  memoryToken = null;
  memoryUserId = null;
}
