// lib/googleMaps.ts
export const GOOGLE_MAPS_LIBRARIES = ["places"]; // add more later like "geometry", "routes", etc.

export const GOOGLE_MAPS_API_URL = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=${GOOGLE_MAPS_LIBRARIES.join(",")}`;
