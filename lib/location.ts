export type FieldLocation = {
  label: string;
  latitude: number;
  longitude: number;
  accuracy: number;
};

const LOCATION_KEY = "zivira.field.location";

export function readSavedLocation() {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem(LOCATION_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as FieldLocation;
  } catch {
    window.localStorage.removeItem(LOCATION_KEY);
    return null;
  }
}

function saveLocation(location: FieldLocation) {
  window.localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
}

function getPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location is mandatory for field attendance, but GPS is not available on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    });
  });
}

async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
    if (!response.ok) return "";

    const payload = await response.json();
    const address = payload?.address ?? {};
    return address.city ?? address.town ?? address.village ?? address.suburb ?? address.county ?? address.state_district ?? address.state ?? "";
  } catch {
    return "";
  }
}

export async function fetchCurrentLocation() {
  const position = await getPosition();
  const { latitude, longitude, accuracy } = position.coords;
  const label = await reverseGeocode(latitude, longitude);
  const location: FieldLocation = {
    label: label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    latitude,
    longitude,
    accuracy
  };

  saveLocation(location);
  return location;
}
