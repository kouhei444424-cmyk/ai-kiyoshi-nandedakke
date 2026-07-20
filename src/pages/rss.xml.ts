import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { SITE_DESCRIPTION, SITE_TITLE } from "../config/site";
import { getPublishedArticles } from "../utils/articles";

export const GET: APIRoute = async (context) => {
  const articles = await getPublishedArticles();

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site ?? "http://localhost:4321",
    customData: "<language>ja-jp</language>",
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishedAt,
      link: `/articles/${article.id}/`,
    })),
  });
};
