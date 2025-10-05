
const API_URL = 'http://localhost:5000/api';

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

async function refreshToken() {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = fetch(`${API_URL}/users/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function fetchApi(path: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  let response = await fetch(`${API_URL}${path}`, {
    ...defaultOptions,
    ...options,
  });

  // If the response is 401 and it's not a refresh token request
  if (response.status === 401 && !path.includes('/refresh-token')) {
    try {
      // Try to refresh the token
      await refreshToken();
      
      // Retry the original request
      response = await fetch(`${API_URL}${path}`, {
        ...defaultOptions,
        ...options,
      });
    } catch (error) {
      // If refresh token fails, throw the error
      console.error('Token refresh failed:', error);
      throw new Error('Session expired. Please login again.');
    }
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'An API error occurred');
  }

  return result;
}

export default fetchApi;
