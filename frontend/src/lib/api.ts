
const API_URL = 'http://localhost:5000/api';

async function fetchApi(path: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...defaultOptions,
    ...options,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'An API error occurred');
  }

  return result;
}

export default fetchApi;
