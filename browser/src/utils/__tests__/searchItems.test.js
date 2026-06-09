import {describe, it, expect} from "vitest"
import {searchItems} from "../searchItems"

describe("searchItems", () => {
  const now = Date.now()
  const today = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  )

  const makeFeeds = () => ({
    feed1: {
      url: "feed1",
      title: "Feed One",
      items: {
        [today]: {
          "item-climate": {
            title: "Climate Change Report",
            content: "Global warming findings",
            timestamp: now - 1000,
          },
          "item-sports": {
            title: "Sports Weekly",
            content: "Latest match results",
            timestamp: now - 2000,
          },
        },
      },
    },
    feed2: {
      url: "feed2",
      title: "Feed Two",
      items: {
        [today]: {
          "item-tech": {
            title: "Tech Breakthrough",
            content: "New climate technology announced",
            timestamp: now - 3000,
          },
        },
      },
    },
  })

  it("returns empty array when query is empty", () => {
    expect(searchItems("", makeFeeds())).toEqual([])
  })

  it("returns empty array when feeds is null", () => {
    expect(searchItems("climate", null)).toEqual([])
  })

  it("matches by title", () => {
    const results = searchItems("climate", makeFeeds())
    expect(results.map(r => r.key)).toContain("item-climate")
  })

  it("matches by content", () => {
    const results = searchItems("climate", makeFeeds())
    expect(results.map(r => r.key)).toContain("item-tech")
  })

  it("matches by author", () => {
    const feeds = {
      feed1: {
        url: "feed1",
        items: {
          [today]: {
            "item-authored": {
              title: "Some Article",
              content: "Some content",
              author: "Jane Climate",
              timestamp: now - 1000,
            },
          },
        },
      },
    }
    const results = searchItems("jane", feeds)
    expect(results.map(r => r.key)).toContain("item-authored")
  })

  it("matches by feed url", () => {
    const feeds = {
      "https://climate.example.com/feed": {
        url: "https://climate.example.com/feed",
        items: {
          [today]: {
            "item-url": {
              title: "Some Article",
              content: "Some content",
              timestamp: now - 1000,
            },
          },
        },
      },
    }
    const results = searchItems("climate.example", feeds)
    expect(results.map(r => r.key)).toContain("item-url")
  })

  it("is case-insensitive", () => {
    const results = searchItems("CLIMATE", makeFeeds())
    expect(results.map(r => r.key)).toContain("item-climate")
    expect(results.map(r => r.key)).toContain("item-tech")
  })

  it("strips HTML tags from content before matching", () => {
    const feeds = {
      feed1: {
        url: "feed1",
        items: {
          [today]: {
            "item-html": {
              title: "Article",
              content: "<p>This is <strong>important</strong> news</p>",
              timestamp: now - 1000,
            },
          },
        },
      },
    }
    const results = searchItems("important", feeds)
    expect(results.map(r => r.key)).toContain("item-html")
  })

  it("returns empty array when no items match", () => {
    expect(searchItems("xyzzy-no-match", makeFeeds())).toEqual([])
  })

  it("scopes results to feedUrls when provided", () => {
    const results = searchItems("climate", makeFeeds(), ["feed1"])
    expect(results.map(r => r.feedUrl)).not.toContain("feed2")
    expect(results.map(r => r.feedUrl)).toContain("feed1")
  })

  it("searches all feeds when feedUrls is null", () => {
    const results = searchItems("climate", makeFeeds(), null)
    expect(results.map(r => r.feedUrl)).toContain("feed1")
    expect(results.map(r => r.feedUrl)).toContain("feed2")
  })

  it("returns results sorted newest first", () => {
    const results = searchItems("climate", makeFeeds())
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].timestamp).toBeGreaterThanOrEqual(
        results[i + 1].timestamp,
      )
    }
  })

  it("skips items without timestamp", () => {
    const feeds = {
      feed1: {
        url: "feed1",
        items: {
          [today]: {
            "item-no-ts": {title: "Climate without timestamp"},
            "item-with-ts": {
              title: "Climate with timestamp",
              timestamp: now - 1000,
            },
          },
        },
      },
    }
    const results = searchItems("climate", feeds)
    expect(results.map(r => r.key)).not.toContain("item-no-ts")
    expect(results.map(r => r.key)).toContain("item-with-ts")
  })

  it("returns items with key, feedUrl, day, and timestamp fields", () => {
    const results = searchItems("climate", makeFeeds())
    expect(results.length).toBeGreaterThan(0)
    const item = results[0]
    expect(item).toHaveProperty("key")
    expect(item).toHaveProperty("feedUrl")
    expect(item).toHaveProperty("day")
    expect(item).toHaveProperty("timestamp")
  })

  it("handles feeds with no items gracefully", () => {
    const feeds = {
      feed1: {url: "feed1", items: {}},
      feed2: {url: "feed2"},
    }
    expect(searchItems("anything", feeds)).toEqual([])
  })

  it("searches across multiple days", () => {
    const yesterday = today - 86400000
    const feeds = {
      feed1: {
        url: "feed1",
        items: {
          [today]: {
            "item-today": {
              title: "Climate Today",
              timestamp: now - 1000,
            },
          },
          [yesterday]: {
            "item-yesterday": {
              title: "Climate Yesterday",
              timestamp: now - 86400000,
            },
          },
        },
      },
    }
    const results = searchItems("climate", feeds)
    expect(results.map(r => r.key)).toContain("item-today")
    expect(results.map(r => r.key)).toContain("item-yesterday")
  })
})
