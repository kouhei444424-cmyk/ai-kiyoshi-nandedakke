export const SITE_TITLE = "大人のオレが考えちゃいけないこと考える";
export const SITE_DESCRIPTION =
  "大人になると、考えなくなってしまうことを、もう一度考える。正解を急がず、常識をゼロから考え直す思考遊びのブログ。";

export function formatJapaneseDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
