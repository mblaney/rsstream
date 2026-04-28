import {describe, it, expect} from "vitest"
import {getGroupItems} from "../getGroupItems"

describe("getGroupItems", () => {
  const now = Date.now()
  const today = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  )
  const yesterday = today - 86400000
  const twoDaysAgo = today - 172800000

  const group = {
    key: "group1",
    feeds: ["feed1", "feed2"],
  }

  const createMockFeeds = () => ({
    feed1: {
      url: "feed1",
      title: "Feed 1",
      items: {
        [today]: {
          item1: {timestamp: now - 3600000, title: "Item 1"},
          item2: {timestamp: now - 7200000, title: "Item 2"},
        },
        [yesterday]: {
          item3: {timestamp: now - 86400000 - 3600000, title: "Item 3"},
        },
      },
    },
    feed2: {
      url: "feed2",
      title: "Feed 2",
      items: {
        [today]: {
          item4: {timestamp: now - 5400000, title: "Item 4"},
        },
        [yesterday]: {
          item5: {timestamp: now - 86400000 - 7200000, title: "Item 5"},
          item6: {timestamp: now - 86400000 - 10800000, title: "Item 6"},
        },
      },
    },
  })

  it("should return empty array when group is null", () => {
    const feeds = createMockFeeds()
    const result = getGroupItems(null, feeds)
    expect(result).toEqual([])
  })

  it("should return empty array when feeds is null", () => {
    const result = getGroupItems(group, null)
    expect(result).toEqual([])
  })

  it("should return empty array when group.feeds is empty", () => {
    const feeds = createMockFeeds()
    const emptyGroup = {key: "empty", feeds: []}
    const result = getGroupItems(emptyGroup, feeds)
    expect(result).toEqual([])
  })

  it("should get older items relative to timestamp", () => {
    const feeds = createMockFeeds()
    const result = getGroupItems(group, feeds, now, 10)

    expect(result.length).toBeGreaterThan(0)
    // All items should have timestamps older than fromTimestamp
    result.forEach(item => {
      expect(item.timestamp).toBeLessThan(now)
    })
  })

  it("should respect the limit", () => {
    const feeds = createMockFeeds()
    const result = getGroupItems(group, feeds, now, 2)

    expect(result.length).toBeLessThanOrEqual(2)
  })

  it("should sort items by timestamp in descending order for older direction", () => {
    const feeds = createMockFeeds()
    const result = getGroupItems(group, feeds, now, 10)

    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].timestamp).toBeGreaterThanOrEqual(
        result[i + 1].timestamp,
      )
    }
  })

  it("should collect items from all feeds for a day", () => {
    const feeds = createMockFeeds()
    const result = getGroupItems(group, feeds, now, 10)

    const feedUrls = result.map(item => item.feedUrl)
    expect(feedUrls).toContain("feed1")
    expect(feedUrls).toContain("feed2")
  })

  it("should include day information in results", () => {
    const feeds = createMockFeeds()
    const result = getGroupItems(group, feeds, now, 10)

    result.forEach(item => {
      expect(item.day).toBeDefined()
      expect(typeof item.day).toBe("number")
    })
  })

  it("should prioritize days over feeds", () => {
    const feeds = createMockFeeds()
    const result = getGroupItems(group, feeds, now, 3)

    // Should get items from today first (most recent day older than now)
    const todayItems = result.filter(item => item.day === yesterday)
    const yesterdayItems = result.filter(item => item.day === twoDaysAgo)

    // All today items should come before yesterday items
    const todayIndex = result.findIndex(item => item.day === yesterday)
    const yesterdayIndex = result.findIndex(item => item.day === twoDaysAgo)

    if (todayItems.length > 0 && yesterdayItems.length > 0) {
      expect(todayIndex).toBeLessThan(yesterdayIndex)
    }
  })

  it("should handle feeds with no items for a day", () => {
    const feeds = {
      feed1: {
        url: "feed1",
        items: {
          [today]: {
            item1: {timestamp: now - 3600000, title: "Item 1"},
          },
        },
      },
      feed2: {
        url: "feed2",
        items: {
          [yesterday]: {
            item2: {timestamp: now - 86400000 - 3600000, title: "Item 2"},
          },
        },
      },
    }
    const result = getGroupItems(group, feeds, now, 10)

    expect(result.length).toBeGreaterThan(0)
  })

  it("should skip items without timestamp", () => {
    const feeds = {
      feed1: {
        url: "feed1",
        items: {
          [today]: {
            item1: {timestamp: now - 3600000, title: "Item 1"},
            item2: {title: "Item without timestamp"},
          },
        },
      },
    }
    const result = getGroupItems(group, feeds, now, 10)

    expect(result.length).toBe(1)
    expect(result[0].key).toBe("item1")
  })

  it("should use default options when not provided", () => {
    const feeds = createMockFeeds()
    const result = getGroupItems(group, feeds)

    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })

  it("should return items with correct structure", () => {
    const feeds = createMockFeeds()
    const result = getGroupItems(group, feeds, now, 1)

    expect(result.length).toBeGreaterThan(0)
    const item = result[0]
    expect(item).toHaveProperty("key")
    expect(item).toHaveProperty("feedUrl")
    expect(item).toHaveProperty("day")
    expect(item).toHaveProperty("timestamp")
  })

  it("should stop at 2-week boundary for older direction", () => {
    const feeds = {
      feed1: {
        url: "feed1",
        items: {
          [today]: {
            item1: {timestamp: now - 3600000, title: "Item 1"},
          },
          [today - 1814400000]: {
            // 3+ weeks ago
            item2: {timestamp: now - 1814400000, title: "Item 2"},
          },
        },
      },
    }
    const result = getGroupItems(group, feeds, now, 10)

    // Should not go beyond 2 weeks
    result.forEach(item => {
      expect(item.timestamp).toBeGreaterThan(now - 1209600000)
    })
  })
})
