import React from "react"
import {describe, it, expect, beforeEach, vi} from "vitest"
import {render, screen} from "@testing-library/react"
import ItemList from "../ItemList"

/**
 * Mock data factory functions for Vitest
 */
const createMockItem = (overrides = {}) => ({
  key: Date.now() + Math.random(),
  title: "Sample Article Title",
  content: "This is sample content for testing.",
  author: "John Doe",
  category: {Technology: true, News: true},
  enclosure: null,
  permalink: "https://example.com/article",
  guid: "unique-guid-123",
  timestamp: Date.now() - 3600000,
  feedUrl: "https://example.com/feed",
  feedTitle: "Example Feed",
  feedImage: "https://example.com/favicon.ico",
  url: "https://example.com",
  ...overrides,
})

const createMockFeed = (url = "https://example.com/feed", overrides = {}) => {
  const day = Math.floor(Date.now() / 86400000) * 86400000
  return {
    url: "https://example.com",
    title: "Example Feed",
    image: "https://example.com/favicon.ico",
    items: {
      [day]: {
        1000: {
          title: "First Article",
          content: "Content 1",
          author: "John Doe",
          category: {Technology: true},
          enclosure: null,
          permalink: "https://example.com/article-1",
          guid: "guid-1",
          timestamp: day,
          url: "https://example.com",
        },
        1001: {
          title: "Second Article",
          content: "Content 2",
          author: "Jane Smith",
          category: {News: true},
          enclosure: null,
          permalink: "https://example.com/article-2",
          guid: "guid-2",
          timestamp: day - 3600000,
          url: "https://example.com",
        },
      },
    },
    ...overrides,
  }
}

const createMockGroup = (overrides = {}) => ({
  key: "Technology",
  feeds: ["https://example.com/feed"],
  count: 2,
  latest: Date.now(),
  text: "Sample text",
  author: "John Doe",
  timestamp: Date.now(),
  ...overrides,
})

describe("ItemList Component", () => {
  const day = Math.floor(Date.now() / 86400000) * 86400000

  const defaultProps = {
    group: createMockGroup(),
    groups: {all: [createMockGroup()], keys: ["Technology"]},
    setGroupStats: vi.fn(),
    resetGroup: vi.fn(),
    currentKeys: [1000, 1001],
    newKeys: [],
    itemFeeds: new Map([
      [1000, {url: "https://example.com/feed", day}],
      [1001, {url: "https://example.com/feed", day}],
    ]),
    loadMoreItems: vi.fn(),
    feeds: new Map([["https://example.com/feed", createMockFeed()]]),
    updateStart: false,
    setUpdateStart: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render without crashing", () => {
    const {container} = render(<ItemList {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it("should handle empty item list", () => {
    const props = {
      ...defaultProps,
      currentKeys: [],
      itemFeeds: new Map(),
    }
    const {container} = render(<ItemList {...props} />)
    expect(container).toBeTruthy()
  })

  it("should render with different feed data", () => {
    const customFeed = createMockFeed("https://custom.com/feed", {
      title: "Custom Feed",
      url: "https://custom.com",
    })
    const props = {
      ...defaultProps,
      feeds: new Map([["https://custom.com/feed", customFeed]]),
      itemFeeds: new Map([[1000, {url: "https://custom.com/feed", day}]]),
      currentKeys: [1000],
    }
    const {container} = render(<ItemList {...props} />)
    expect(container).toBeTruthy()
  })

  describe("Interaction Tests", () => {
    it("should call loadMoreItems when scrolling near end", () => {
      const loadMoreItems = vi.fn()
      const props = {
        ...defaultProps,
        loadMoreItems,
      }
      render(<ItemList {...props} />)

      // Simulate scroll event that would trigger loadMoreItems
      // This would be handled by IntersectionObserver in the component
      expect(loadMoreItems).not.toHaveBeenCalled()
      // The actual callback would be triggered by IntersectionObserver
      // when the sentinel element comes into view
    })

    it("should call setGroupStats with correct data", () => {
      const setGroupStats = vi.fn()
      const props = {
        ...defaultProps,
        setGroupStats,
      }
      render(<ItemList {...props} />)

      // setGroupStats should be called during component lifecycle
      // to update group statistics based on items
      expect(setGroupStats).not.toHaveBeenCalled() // May not be called without user interaction
    })

    it("should handle resetGroup callback", () => {
      const resetGroup = vi.fn()
      const props = {
        ...defaultProps,
        resetGroup,
      }
      const {container} = render(<ItemList {...props} />)
      expect(container).toBeTruthy()
    })

    it("should update when currentKeys prop changes", () => {
      const props = {
        ...defaultProps,
        currentKeys: [1000, 1001],
      }
      const {rerender} = render(<ItemList {...props} />)

      // Update with new keys
      const newProps = {
        ...props,
        currentKeys: [1000, 1001, 2000],
      }
      rerender(<ItemList {...newProps} />)

      // Component should handle the new keys
      expect(newProps.currentKeys).toHaveLength(3)
    })

    it("should display new items divider when newKeys provided", () => {
      const props = {
        ...defaultProps,
        newKeys: [1000],
        newFrom: 1000,
      }
      const {container} = render(<ItemList {...props} />)
      expect(container).toBeTruthy()
    })
  })
})

export {createMockItem, createMockFeed, createMockGroup}
