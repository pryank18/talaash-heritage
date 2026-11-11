// Visitors whose device clock is set to a European time zone (EU, EEA, UK,
// Switzerland and their neighbours). Their law (ePrivacy / PECR) asks for
// consent before a site stores anything on the device that is not needed for
// the page to work, such as an analytics ID. We do not ask; we simply do not
// store it for them. The time zone is read from the browser: no IP lookup, no
// request to anyone. Erring towards "strict" is harmless.
const EUROPE_TZ = /^(Europe\/|Atlantic\/(Reykjavik|Faroe|Faeroe|Canary|Madeira|Azores)$|Arctic\/Longyearbyen$)/;

let cached;

export function strictPrivacyRegion() {
  if (cached !== undefined) return cached;
  try {
    cached = EUROPE_TZ.test(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
  } catch {
    cached = false;
  }
  return cached;
}
