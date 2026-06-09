import {describe, it, expect, beforeEach, afterEach, vi} from "vitest"
import {render, screen, act} from "@testing-library/react"
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
        setMessage={mockSetMessage}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
      />,
    )

    expect(container).toBeTruthy()
  })

  describe("search mode", () => {
    const dayKey = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    )

    const makeSearchFeeds = () => ({
      "https://feed1.com/rss": {
        url: "https://feed1.com/rss",
        title: "Feed One",
        image: "",
        items: {
          [dayKey]: {
            "item-climate": {
              title: "Climate Change Report",
              content: "Global warming findings",
              timestamp: Date.now() - 1000,
              author: "Reporter",
              permalink: "https://feed1.com/1",
              guid: "guid-1",
              url: "https://feed1.com/1",
            },
            "item-sports": {
              title: "Sports Weekly",
              content: "Latest match results",
              timestamp: Date.now() - 2000,
              author: "Reporter",
              permalink: "https://feed1.com/2",
              guid: "guid-2",
              url: "https://feed1.com/2",
            },
          },
        },
      },
      "https://feed2.com/rss": {
        url: "https://feed2.com/rss",
        title: "Feed Two",
        image: "",
        items: {
          [dayKey]: {
            "item-tech": {
              title: "Tech Breakthrough",
              content: "New climate technology announced",
              timestamp: Date.now() - 3000,
              author: "Journalist",
              permalink: "https://feed2.com/1",
              guid: "guid-3",
              url: "https://feed2.com/1",
            },
          },
        },
      },
    })

    it("renders items matching searchQuery in global search", async () => {
      const feeds = makeSearchFeeds()

      await act(async () => {
        render(
          <ItemList
            group={null}
            feeds={feeds}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={0}
            maxHistoryReached={false}
            searchQuery="climate"
          />,
        )
      })

      expect(document.body.textContent).toContain("Climate Change Report")
    })

    it("does not render items that do not match", async () => {
      const feeds = makeSearchFeeds()

      await act(async () => {
        render(
          <ItemList
            group={null}
            feeds={feeds}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={0}
            maxHistoryReached={false}
            searchQuery="climate"
          />,
        )
      })

      expect(screen.queryByText("Sports Weekly")).toBeNull()
    })

    it("scopes results to group feeds when group is provided", async () => {
      const feeds = makeSearchFeeds()
      const group = {
        key: "test-group",
        feeds: ["https://feed1.com/rss"],
      }

      await act(async () => {
        render(
          <ItemList
            group={group}
            feeds={feeds}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={0}
            maxHistoryReached={false}
            searchQuery="climate"
          />,
        )
      })

      expect(document.body.textContent).toContain("Climate Change Report")
      // feed2 item excluded because it's not in group.feeds
      expect(screen.queryByText("Tech Breakthrough")).toBeNull()
    })

    it("calls requestMoreHistory when search starts", async () => {
      vi.useFakeTimers()
      render(
        <ItemList
          group={null}
          feeds={makeSearchFeeds()}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
          searchQuery="climate"
        />,
      )

      // Initial results exist so requestMoreHistory is triggered via the
      // observer (set up after 100ms), not eagerly — advance past the timeout.
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      expect(mockRequestMoreHistory).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it("shows no results message when maxHistoryReached with no matches", async () => {
      await act(async () => {
        render(
          <ItemList
            group={null}
            feeds={{}}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={0}
            maxHistoryReached={true}
            searchQuery="xyzzy-no-match"
          />,
        )
      })

      expect(mockSetMessage).toHaveBeenCalledWith("No results found.")
    })

    it("accumulates new matches as history days load", async () => {
      const yesterday = dayKey - 86400000
      const initialFeeds = {
        "https://feed1.com/rss": {
          url: "https://feed1.com/rss",
          title: "Feed One",
          image: "",
          items: {
            [dayKey]: {
              "item-sports": {
                title: "Sports Weekly",
                content: "No match here",
                timestamp: Date.now() - 2000,
                author: "Reporter",
                permalink: "https://feed1.com/sports",
                guid: "guid-sports",
                url: "https://feed1.com/sports",
              },
            },
          },
        },
      }
      const feedsWithHistory = {
        "https://feed1.com/rss": {
          ...initialFeeds["https://feed1.com/rss"],
          items: {
            ...initialFeeds["https://feed1.com/rss"].items,
            [yesterday]: {
              "item-old-climate": {
                title: "Historic Climate Summit",
                content: "Older article",
                timestamp: yesterday + 43200000,
                author: "Reporter",
                permalink: "https://feed1.com/old",
                guid: "guid-old",
                url: "https://feed1.com/old",
              },
            },
          },
        },
      }

      const {rerender} = render(
        <ItemList
          group={null}
          feeds={initialFeeds}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
          searchQuery="climate"
        />,
      )

      await act(async () => {})

      expect(screen.queryByText("Historic Climate Summit")).toBeNull()

      await act(async () => {
        rerender(
          <ItemList
            group={null}
            feeds={feedsWithHistory}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={1}
            maxHistoryReached={false}
            searchQuery="climate"
          />,
        )
      })

      expect(document.body.textContent).toContain("Historic Climate Summit")
    })

    it("clears items when searchQuery is cleared", async () => {
      const feeds = makeSearchFeeds()

      const {rerender} = render(
        <ItemList
          group={null}
          feeds={feeds}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
          searchQuery="climate"
        />,
      )

      await act(async () => {})

      expect(document.body.textContent).toContain("Climate Change Report")

      await act(async () => {
        rerender(
          <ItemList
            group={null}
            feeds={feeds}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={0}
            maxHistoryReached={false}
            searchQuery=""
          />,
        )
      })

      expect(screen.queryByText("Climate Change Report")).toBeNull()
    })

    it("uses observer to trigger history loading when initial results exist", async () => {
      vi.useFakeTimers()
      render(
        <ItemList
          group={null}
          feeds={makeSearchFeeds()}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
          searchQuery="climate"
        />,
      )

      await act(async () => {})

      // With initial results, no eager requestMoreHistory call — observer is
      // set up on a 100ms delay instead.
      expect(mockRequestMoreHistory.mock.calls.length).toBe(0)

      // Observer setup fires, mock observer triggers immediately and calls
      // requestMoreHistory preemptively for the next history day.
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      expect(mockRequestMoreHistory).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it("cascades requestMoreHistory for search when history days have no matches", async () => {
      vi.useFakeTimers()
      const feedsWithoutMatch = {
        "https://feed1.com/rss": {
          url: "https://feed1.com/rss",
          title: "Feed One",
          image: "",
          items: {
            [dayKey]: {
              "item-sports": {
                title: "Sports Weekly",
                content: "Latest match results",
                timestamp: Date.now() - 2000,
                author: "Reporter",
                permalink: "https://feed1.com/sports",
                guid: "guid-sports",
                url: "https://feed1.com/sports",
              },
            },
          },
        },
      }

      const {rerender} = render(
        <ItemList
          group={null}
          feeds={feedsWithoutMatch}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
          searchQuery="climate"
        />,
      )

      await act(async () => {
        vi.advanceTimersByTime(50)
      })

      // No initial results → requestMoreHistory called immediately
      const callsAfterStart = mockRequestMoreHistory.mock.calls.length
      expect(callsAfterStart).toBe(1)

      // A day loads with still no matching items → cascade
      await act(async () => {
        rerender(
          <ItemList
            group={null}
            feeds={feedsWithoutMatch}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={1}
            maxHistoryReached={false}
            searchQuery="climate"
          />,
        )
      })

      expect(mockRequestMoreHistory.mock.calls.length).toBeGreaterThan(
        callsAfterStart,
      )
      vi.useRealTimers()
    })

    it("shows No more items available when maxHistoryReached after some results found", async () => {
      vi.useFakeTimers()
      const feeds = makeSearchFeeds()

      const {rerender} = render(
        <ItemList
          group={null}
          feeds={feeds}
          setMessage={mockSetMessage}
          requestMoreHistory={mockRequestMoreHistory}
          historyDayLoaded={0}
          maxHistoryReached={false}
          searchQuery="climate"
        />,
      )

      // Observer fires after 100ms, sets needsMoreItemsRef because local
      // search returns no new results beyond what's already rendered.
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      // History exhausted with no new matches — existing results are shown so
      // the message is "No more items available", not "No results found."
      await act(async () => {
        rerender(
          <ItemList
            group={null}
            feeds={feeds}
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={1}
            maxHistoryReached={true}
            searchQuery="climate"
          />,
        )
      })

      expect(mockSetMessage).toHaveBeenCalledWith("No more items available")
      vi.useRealTimers()
    })
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
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={1}
            maxHistoryReached={false}
          />,
        )
      })

      // Items found in yesterday's data: cascade stops, no further history request
      expect(mockRequestMoreHistory.mock.calls.length).toBe(callsAfterObserver)
      expect(mockSetMessage).not.toHaveBeenCalledWith("No more items available")
      vi.useRealTimers()
    })

    it("should show no more items when maxHistoryReached and loaded day is empty", async () => {
      vi.useFakeTimers()
      mockFeeds = makeFeeds()

      const {rerender} = render(
        <ItemList
          group={group}
          feeds={mockFeeds}
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
            setMessage={mockSetMessage}
            requestMoreHistory={mockRequestMoreHistory}
            historyDayLoaded={1}
            maxHistoryReached={true}
          />,
        )
      })

      expect(mockSetMessage).toHaveBeenCalledWith("No more items available")
      vi.useRealTimers()
    })
  })
})
