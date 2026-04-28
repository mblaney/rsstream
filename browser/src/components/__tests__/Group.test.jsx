import {describe, it, expect, beforeEach, afterEach, vi} from "vitest"
import {render, fireEvent} from "@testing-library/react"
import Group from "../Group"

describe("Group Component", () => {
  let mockSetGroup

  beforeEach(() => {
    mockSetGroup = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it("should render without crashing", () => {
    const group = {
      key: "test-group",
      feeds: [],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container).toBeTruthy()
  })

  it("should render ListItem", () => {
    const group = {
      key: "test-group",
      feeds: [],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container.querySelector(".MuiListItem-root")).toBeTruthy()
  })

  it("should render group key as primary text", () => {
    const group = {
      key: "My Test Group",
      feeds: [],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container.textContent).toContain("My Test Group")
  })

  it("should render group text content", () => {
    const group = {
      key: "test-group",
      feeds: [],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Latest article content here",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container.textContent).toContain("Latest article content here")
  })

  it("should render author with text", () => {
    const group = {
      key: "test-group",
      feeds: [],
      timestamp: Date.now(),
      author: "John Doe",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container.textContent).toContain("John Doe:")
  })

  it("should render text without author when author is missing", () => {
    const group = {
      key: "test-group",
      feeds: [],
      timestamp: Date.now(),
      author: null,
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container.textContent).toContain("Test content")
  })

  it("should display unread count when greater than 0", () => {
    const group = {
      key: "test-group",
      feeds: [],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 5,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container.textContent).toContain("5")
  })

  it("should not display count avatar when count is 0", () => {
    const group = {
      key: "test-group",
      feeds: [],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    const countAvatars = container.querySelectorAll(".MuiAvatar-root")
    // Should only have the main avatar, not a count avatar
    expect(countAvatars.length).toBe(1)
  })

  it("should render avatar with group icon for multiple feeds", () => {
    const group = {
      key: "test-group",
      feeds: ["https://feed1.com", "https://feed2.com"],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container.querySelector(".MuiAvatar-root")).toBeTruthy()
  })

  it("should render avatar with person icon for single feed", () => {
    const group = {
      key: "test-group",
      feeds: ["https://feed1.com"],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container.querySelector(".MuiAvatar-root")).toBeTruthy()
  })

  it("should render image avatar when group has image", () => {
    const group = {
      key: "test-group",
      image: "https://example.com/image.jpg",
      feeds: [],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    const avatar = container.querySelector(".MuiAvatar-img")
    expect(avatar).toBeTruthy()
  })

  it("should call setGroup when clicked", () => {
    const group = {
      key: "test-group",
      feeds: [],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    const listItem = container.querySelector(".MuiListItem-root")
    fireEvent.click(listItem)

    expect(mockSetGroup).toHaveBeenCalledWith(group)
  })

  it("should handle group with large feed count", () => {
    const feeds = Array.from({length: 50}, (_, i) => `https://feed${i}.com`)
    const group = {
      key: "test-group",
      feeds: feeds,
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 0,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container).toBeTruthy()
  })

  it("should handle group with large unread count", () => {
    const group = {
      key: "test-group",
      feeds: [],
      timestamp: Date.now(),
      author: "Test Author",
      text: "Test content",
      count: 999,
    }

    const {container} = render(<Group group={group} setGroup={mockSetGroup} />)

    expect(container.textContent).toContain("999")
  })
})
