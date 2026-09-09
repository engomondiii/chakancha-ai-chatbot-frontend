/**
 * Content API — public site content.
 *
 * Weather is fetched through our own backend rather thandirectly from the provider:
 * MET Norway requires an identifying User-Agent, which browsers are not
 * permitted to set, and the response is cached server-side so visitor traffic
 * does not map one-to-one onto upstream requests.
 */

import api from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Current weather at the tea-origin location.
 *
 * Returns the reading, or null when unavailable. Callers must treat null as
 * "render without weather" — the map is not allowed to break because a
 * forecast could not be retrieved.
 */
export async function fetchOriginWeather() {
  try {
    const data = await api.get(ENDPOINTS.CONTENT.WEATHER);
    if (!data || data.available === false) return null;
    if (typeof data.temperature !== "number") return null;
    return data;
  } catch (err) {
    console.warn("Weather unavailable:", err?.message || err);
    return null;
  }
}

export default { fetchOriginWeather };
