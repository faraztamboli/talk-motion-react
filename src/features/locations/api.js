import { apiFetch } from "../../api/http";

/** Venue locations (server/api/app/routers/locations.py). */

export const listLocations = () => apiFetch("/locations");

export const createLocation = ({ name, admin }) => apiFetch("/locations", { method: "POST", body: { name, admin } });

export const listMembers = (id) => apiFetch(`/locations/${id}/members`);

export const updateLocation = (id, body) => apiFetch(`/locations/${id}`, { method: "PATCH", body });

export const addMember = (id, { user, role }) =>
  apiFetch(`/locations/${id}/members`, { method: "POST", body: { user, role } });

export const removeMember = (id, userId) => apiFetch(`/locations/${id}/members/${userId}`, { method: "DELETE" });

export const fetchSummary = (id, month) =>
  apiFetch(`/locations/${id}/summary${month ? `?month=${encodeURIComponent(month)}` : ""}`);

/** The last `count` months as "YYYY-MM", newest first. */
export function recentMonths(count = 12, today = new Date()) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}
