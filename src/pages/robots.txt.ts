import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL("http://localhost:4321");
  const sitemapUrl = new URL("sitemap-index.xml", origin);

  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${sitemapUrl.href}\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
};
