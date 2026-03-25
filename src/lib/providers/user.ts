import { api } from "../apiClient";

async function me() {
  const r = await api.get(`/api/auth/me`);
  return r.data;
}

async function logout() {

    }

export default {
  me,
  logout
};