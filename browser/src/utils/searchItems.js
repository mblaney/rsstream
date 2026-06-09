export function searchItems(query, feeds, feedUrls = null) {
  if (!query || !feeds) return []

  const urls = feedUrls || Object.keys(feeds)
  const q = query.toLowerCase()
  const results = []

  for (const url of urls) {
    const feed = feeds[url]
    if (!feed || !feed.items) continue

    for (const [day, dayItems] of Object.entries(feed.items)) {
      if (!dayItems) continue
      for (const [key, item] of Object.entries(dayItems)) {
        if (!item || !item.timestamp) continue

        const titleMatch = item.title && item.title.toLowerCase().includes(q)
        const authorMatch = item.author && item.author.toLowerCase().includes(q)
        const feedTitleMatch =
          feed.title && feed.title.toLowerCase().includes(q)
        const urlMatch = url.toLowerCase().includes(q)
        const contentMatch =
          item.content &&
          item.content
            .replace(/(<([^>]+)>)/g, "")
            .toLowerCase()
            .includes(q)

        if (
          titleMatch ||
          authorMatch ||
          feedTitleMatch ||
          urlMatch ||
          contentMatch
        ) {
          results.push({
            key,
            feedUrl: url,
            day: parseInt(day),
            timestamp: item.timestamp,
          })
        }
      }
    }
  }

  results.sort((a, b) => b.timestamp - a.timestamp)
  return results
}
