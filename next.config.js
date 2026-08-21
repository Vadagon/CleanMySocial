/** @type {import('next').NextConfig} */
const NOINDEX = "noindex, nofollow, noarchive, nosnippet";

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      ["messenger-cleaner", "facebook-instagram-cleaner"],
      ["mass-friends-remover", "mass-unfriender"],
      ["followers-tracker", "instagram-followers-tracker"],
      ["ig-followers-tracker", "instagram-followers-tracker"],
    ].flatMap(([source, destination]) => [
      { source: `/${source}`, destination: `/${destination}`, permanent: true },
      {
        source: `/privacy/${source}`,
        destination: `/privacy/${destination}`,
        permanent: true,
      },
    ]).concat([
      // /about was indexed and linked from llms.txt and article footers before
      // it was removed. Support is where the developer is still named and
      // reachable, so the URL lands somewhere true instead of 404ing.
      { source: "/about", destination: "/support", permanent: true },
      // Bundles and combos were retired when every tool moved to its own
      // monthly/lifetime pricing. The old package URLs were indexed and linked
      // from older emails, so send them to the price list rather than a 404.
      { source: "/packages", destination: "/pricing", permanent: true },
      { source: "/packages/:slug", destination: "/pricing", permanent: true },
    ]);
  },
  async headers() {
    return [
      {
        // The private record browser and its API: kept out of every index,
        // independent of the host's own header config.
        source: "/vault/:path*",
        headers: [
          { key: "X-Robots-Tag", value: NOINDEX },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        source: "/vault",
        headers: [
          { key: "X-Robots-Tag", value: NOINDEX },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: NOINDEX }],
      },
    ];
  },
};

module.exports = nextConfig;
