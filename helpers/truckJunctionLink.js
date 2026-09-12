/**
 * Whether a resolved URL belongs to Truck Junction (same origin as the
 * page under test, or any *.tractorjunction.com host). Used by TC-*-00 link
 * scans so footer social / ad / partner links are not health-checked.
 */
const isTruckJunctionUrl = (href, baseOrigin) => {
  try {
    const url = new URL(href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    const base = new URL(baseOrigin);
    if (url.origin === base.origin) {
      return true;
    }
    const host = url.hostname.toLowerCase();
    return host === 'tractorjunction.com' || host.endsWith('.tractorjunction.com');
  } catch (error) {
    return false;
  }
};

module.exports = {
  isTruckJunctionUrl,
};
