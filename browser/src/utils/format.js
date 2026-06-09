export const decodeEntities = str =>
  str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")

// TODO: Add locale support.
const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h12",
})

export const formatDate = key => {
  if (!key) return ""

  const p = formatter.formatToParts(key)
  return `${p[0].value} ${p[2].value} ${p[4].value}${p[5].value}${p[6].value}${p[8].value}`
}
