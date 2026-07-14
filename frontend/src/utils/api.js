import { API_BASE_URL } from "../data/constants";

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
