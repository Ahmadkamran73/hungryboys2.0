import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: BASE_URL,
});

export async function authHeaders(user) {
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
