export const SITE_TITLE = "大人のオレが考えちゃいけないこと考える";
export const SITE_DESCRIPTION =
  "大人になると、考えなくなってしまうことを、もう一度考える。AIきよしの思想・思考遊びブログ。";
export const SITE_TAGLINE =
  "AIきよし、たまにどうでもいいことを真面目に考える。";

export function formatJapaneseDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
