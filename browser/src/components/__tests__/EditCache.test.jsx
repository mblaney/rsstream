import {describe, it, expect, beforeEach, vi} from "vitest"
import {render, screen, act} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import EditCache from "../EditCache"

const mockRemoveItem = vi.fn()
const mockClearCache = vi.fn()

const emptyCacheData = {
  audio: {count: 0, size: 0, items: []},
  video: {count: 0, size: 0, items: []},
}

const filledCacheData = {
  audio: {
    count: 2,
    size: 5 * 1024 * 1024,
    items: [
      {url: "https://podcast.com/episodes/ep1.mp3", size: 3 * 1024 * 1024},
      {url: "https://podcast.com/episodes/ep2.mp3", size: 2 * 1024 * 1024},
    ],
  },
  video: {
    count: 1,
    size: 50 * 1024 * 1024,
    items: [{url: "https://video.com/clips/clip1.mp4", size: 50 * 1024 * 1024}],
  },
}

const manyAudioCacheData = {
  audio: {
    count: 15,
    size: 15 * 1024 * 1024,
    items: Array.from({length: 15}, (_, i) => ({
      url: `https://podcast.com/ep${i + 1}.mp3`,
      size: 1024 * 1024,
    })),
  },
  video: {count: 0, size: 0, items: []},
}

describe("EditCache Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders nothing when cacheData is null", () => {
    const {container} = render(
      <EditCache
        cacheData={null}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders cache storage card when cacheData is provided", () => {
    render(
      <EditCache
        cacheData={emptyCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    expect(screen.getByText("Cache storage")).toBeTruthy()
  })

  it("shows audio accordion with file count and size", () => {
    render(
      <EditCache
        cacheData={filledCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    expect(
      screen.getByRole("button", {name: /audio.*2 files.*5\.0 mb/i}),
    ).toBeTruthy()
  })

  it("shows video accordion with singular file label", () => {
    render(
      <EditCache
        cacheData={filledCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    expect(screen.getByRole("button", {name: /video.*1 file\b/i})).toBeTruthy()
  })

  it("shows no audio message when audio section is empty", async () => {
    render(
      <EditCache
        cacheData={emptyCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /audio/i}))
    })
    expect(screen.getByText("No audio cached")).toBeTruthy()
  })

  it("shows no video message when video section is empty", async () => {
    render(
      <EditCache
        cacheData={emptyCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /video/i}))
    })
    expect(screen.getByText("No video cached")).toBeTruthy()
  })

  it("shows filename and size for audio items when expanded", async () => {
    render(
      <EditCache
        cacheData={filledCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /audio/i}))
    })
    expect(screen.getByText("podcast.com: ep1.mp3")).toBeTruthy()
    expect(screen.getByText("3.0 MB")).toBeTruthy()
  })

  it("shows filename and size for video items when expanded", async () => {
    render(
      <EditCache
        cacheData={filledCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /video/i}))
    })
    expect(screen.getByText("video.com: clip1.mp4")).toBeTruthy()
    expect(screen.getByText("50.0 MB")).toBeTruthy()
  })

  it("calls removeItem with cache name and url when delete is clicked", async () => {
    render(
      <EditCache
        cacheData={filledCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /audio/i}))
    })
    const removeButtons = screen.getAllByLabelText("remove")
    await act(async () => {
      await userEvent.click(removeButtons[0])
    })
    expect(mockRemoveItem).toHaveBeenCalledWith(
      "audio",
      "https://podcast.com/episodes/ep1.mp3",
    )
  })

  it("calls clearCache with cache name when clear all is clicked", async () => {
    render(
      <EditCache
        cacheData={filledCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /audio/i}))
    })
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", {name: /clear all audio/i}),
      )
    })
    expect(mockClearCache).toHaveBeenCalledWith("audio")
  })

  it("shows only 10 items when there are more than 10", async () => {
    render(
      <EditCache
        cacheData={manyAudioCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /audio/i}))
    })
    expect(screen.getAllByLabelText("remove")).toHaveLength(10)
  })

  it("shows show more button and count when items are truncated", async () => {
    render(
      <EditCache
        cacheData={manyAudioCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /audio/i}))
    })
    expect(screen.getByText("Showing 10 of 15 files")).toBeTruthy()
    expect(screen.getByRole("button", {name: /show more/i})).toBeTruthy()
  })

  it("shows all items after clicking show more", async () => {
    render(
      <EditCache
        cacheData={manyAudioCacheData}
        removeItem={mockRemoveItem}
        clearCache={mockClearCache}
      />,
    )
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /audio/i}))
    })
    await act(async () => {
      await userEvent.click(screen.getByRole("button", {name: /show more/i}))
    })
    expect(screen.getAllByLabelText("remove")).toHaveLength(15)
    expect(screen.queryByRole("button", {name: /show more/i})).toBeNull()
  })
})
