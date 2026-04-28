export function getGroupItems(group, feeds, from = Date.now(), limit = 10) {
  if (!group || !group.feeds || !feeds) {
    return []
  }

  const items = []
  const t = new Date(from)
  let currentDay = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
  const twoWeeksAgo = from - 1209600000

  while (items.length < limit) {
    // Collect all items from all feeds for the current day
    const dayItems = []
    for (const feedUrl of group.feeds) {
      const feed = feeds[feedUrl]
      if (!feed || !feed.items || !feed.items[currentDay]) continue

      const feedDayItems = feed.items[currentDay]
      for (const [itemKey, item] of Object.entries(feedDayItems)) {
        if (!item || !item.timestamp) continue

        // Include items older than from
        if (item.timestamp < from) {
          dayItems.push({
            key: itemKey,
            feedUrl,
            day: currentDay,
            timestamp: item.timestamp,
          })
        }
      }
    }

    // Sort items from this day in descending order (newest first)
    dayItems.sort((a, b) => b.timestamp - a.timestamp)
    items.push(...dayItems)

    // Stop if we go beyond 2 weeks back
    if (currentDay < twoWeeksAgo) break

    // Move to previous day
    currentDay -= 86400000
  }

  return items.slice(0, limit)
}
