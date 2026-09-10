/**
 * Pulls each <url><loc> from a sitemap urlset. Ignores xhtml:link alternates
 * and image/video <image:loc> / <video:loc> tags — those are not page addresses.
 */
const parseSitemapLocs = (xml) => {
  const urlBlocks = String(xml).match(/<url\b[^>]*>[\s\S]*?<\/url>/gi) || [];
  const locs = urlBlocks
    .map((block) => {
      const match = block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/i);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);

  return Array.from(new Set(locs));
};

const httpsSitemapLocs = (locs) => locs.filter((loc) => /^https:\/\//i.test(loc));

module.exports = { parseSitemapLocs, httpsSitemapLocs };
