import {describe, it, expect, beforeEach, afterEach, vi} from "vitest"
import {render, act} from "@testing-library/react"
import ItemList from "../ItemList"

describe("ItemList Component", () => {
  let mockFeeds
  let mockSetMessage
  let mockRequestMoreHistory

  beforeEach(() => {
    mockFeeds = {}
    mockSetMessage = vi.fn()
    mockRequestMoreHistory = vi.fn()
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it("should render without crashing", () => {
    const group = {
      key: "test-group",
      feeds: [],
    }

    const {container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should render Container component", () => {
    const group = {
      key: "test-group",
      feeds: [],
    }

    const {container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container.querySelector(".MuiContainer-root")).toBeTruthy()
  })

  it("should render Grid container", () => {
    const group = {
      key: "test-group",
      feeds: [],
    }

    const {container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container.querySelector(".MuiGrid-container")).toBeTruthy()
  })

  it("should handle null group", () => {
    const {container} = render(
      <ItemList
        group={null}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle group with multiple feeds", () => {
    const group = {
      key: "test-group",
      feeds: [
        "https://feed1.com/rss",
        "https://feed2.com/rss",
        "https://feed3.com/rss",
      ],
    }

    const {container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle empty newItems array", () => {
    const group = {
      key: "test-group",
      feeds: ["https://example.com/feed"],
    }

    const {container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle newItems as null", () => {
    const group = {
      key: "test-group",
      feeds: ["https://example.com/feed"],
    }

    const {container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={null}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should render with valid feed data", () => {
    const dayKey = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    )

    const group = {
      key: "test-group",
      feeds: ["https://example.com/feed"],
    }

    mockFeeds = {
      "https://example.com/feed": {
        url: "https://example.com/feed",
        title: "Test Feed",
        image: "",
        items: {
          [dayKey]: {
            "item-1": {
              title: "Test Article",
              content: "Test content",
              timestamp: Date.now(),
              author: "Test Author",
              url: "https://example.com/article",
            },
          },
        },
      },
    }

    const {container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle group prop updates", () => {
    const group1 = {
      key: "group-1",
      feeds: [],
    }

    const group2 = {
      key: "group-2",
      feeds: [],
    }

    const {rerender, container} = render(
      <ItemList
        group={group1}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    rerender(
      <ItemList
        group={group2}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle feedsRef with empty feeds object", () => {
    const group = {
      key: "test-group",
      feeds: ["https://example.com/feed"],
    }

    const {container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should maintain state across re-renders", () => {
    const group = {
      key: "test-group",
      feeds: [],
    }

    const {rerender, container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    rerender(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle switching from group to null", () => {
    const group = {
      key: "test-group",
      feeds: [],
    }

    const {rerender, container} = render(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    rerender(
      <ItemList
        group={null}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle switching from null to group", () => {
    const group = {
      key: "test-group",
      feeds: [],
    }

    const {rerender, container} = render(
      <ItemList
        group={null}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    rerender(
      <ItemList
        group={group}
        feeds={mockFeeds}
        newItems={[]}
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  describe("history loading flow", () => {
    const makeFeeds = (timestamp = Date.now() - 1000) => {
      const dayKey = Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      )
      return {
        "https://example.com/feed": {
          url: "https://example.com/feed",
          title: "Test Feed",
          image: "",
          items: {
            [dayKey]: {
              "item-1": {
                title: "Test Article",
                content: "Test content",
                timestamp,
                author: "Test Author",
                url: "https://example.com/article",
              },
            },
          },
        },
      }
    }

    const group = {key: "test-group", feeds: ["https://example.com/feed"]}

    it("should call requestMoreHistory when scrollback observer fires", async () => {
      vi.useFakeTimers()
      mockFeeds = makeFeeds()

      render(
        <ItemList
          group={group}
          feeds={mockFeeds}
          newItems={[]}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
        />,
      )

      // Advance past the 100ms timeout that sets up the observer after initial render
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      expect(mockRequestMoreHistory).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it("should cascade requestMoreHistory when a loaded day has no items for the group", async () => {
      vi.useFakeTimers()
      mockFeeds = makeFeeds()

      const {rerender} = render(
        <ItemList
          group={group}
          feeds={mockFeeds}
          newItems={[]}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
        />,
      )

      // Observer fires — requestMoreHistory called once, needsMoreItems set
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      const callsAfterObserver = mockRequestMoreHistory.mock.calls.length
      expect(callsAfterObserver).toBeGreaterThan(0)

      // Simulate a day finishing with no new items in feeds for this group
      await act(async () => {
        rerender(
          <ItemList
            group={group}
            feeds={mockFeeds}
            newItems={[]}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={1}
            maxHistoryReached={false}
          />,
        )
      })

      expect(mockRequestMoreHistory.mock.calls.length).toBeGreaterThan(
        callsAfterObserver,
      )
      vi.useRealTimers()
    })

    // Display sets feedsRef.current = feeds synchronously in its render body so
    // that by the time any child effect runs, the ref already contains the new
    // day's items. ItemList mirrors this pattern internally. This test asserts
    // the expected outcome: historyDayLoaded fires with current feeds, items are
    // found, and the cascade stops without requesting more history.
    it("should stop cascade when feeds is current at the time historyDayLoaded fires", async () => {
      vi.useFakeTimers()
      mockFeeds = makeFeeds()

      const feedUrl = "https://example.com/feed"
      const yesterday = Date.UTC(
        new Date(Date.now() - 86400000).getUTCFullYear(),
        new Date(Date.now() - 86400000).getUTCMonth(),
        new Date(Date.now() - 86400000).getUTCDate(),
      )
      const feedsWithYesterday = {
        [feedUrl]: {
          ...mockFeeds[feedUrl],
          items: {
            ...mockFeeds[feedUrl].items,
            [yesterday]: {
              "item-yesterday": {
                title: "Yesterday",
                content: "Content",
                timestamp: yesterday + 43200000,
                author: "Author",
                url: "https://example.com/yesterday",
              },
            },
          },
        },
      }

      const {rerender} = render(
        <ItemList
          group={group}
          feeds={mockFeeds}
          newItems={[]}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
        />,
      )

      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      const callsAfterObserver = mockRequestMoreHistory.mock.calls.length
      expect(callsAfterObserver).toBeGreaterThan(0)

      // Pass updated feeds and incremented historyDayLoaded together so that
      // feedsRef.current is already current when the historyDayLoaded effect runs.
      await act(async () => {
        rerender(
          <ItemList
            group={group}
            feeds={feedsWithYesterday}
            newItems={[]}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={1}
            maxHistoryReached={false}
          />,
        )
      })

      // Items found in yesterday's data: cascade stops, no further history request
      expect(mockRequestMoreHistory.mock.calls.length).toBe(callsAfterObserver)
      expect(mockSetMessage).not.toHaveBeenCalledWith(
        "No more items available for this group.",
      )
      vi.useRealTimers()
    })

    it("should show no more items when maxHistoryReached and loaded day is empty", async () => {
      vi.useFakeTimers()
      mockFeeds = makeFeeds()

      const {rerender} = render(
        <ItemList
          group={group}
          feeds={mockFeeds}
          newItems={[]}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
        />,
      )

      // Observer fires — needsMoreItems set
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      // History exhausted — day loads but still no older items for group
      await act(async () => {
        rerender(
          <ItemList
            group={group}
            feeds={mockFeeds}
            newItems={[]}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={1}
            maxHistoryReached={true}
          />,
        )
      })

      expect(mockSetMessage).toHaveBeenCalledWith(
        "No more items available for this group.",
      )
      vi.useRealTimers()
    })
  })
})
