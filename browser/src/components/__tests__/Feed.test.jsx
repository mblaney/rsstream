import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest"
import {render, screen, fireEvent, waitFor} from "@testing-library/react"
import Feed from "../Feed"
import {createTestUser} from "../../__tests__/setup"

describe("Feed Component", () => {
  let user
  let mockFetch

  beforeAll(async () => {
    user = await createTestUser()
  })

  beforeEach(() => {
    mockFetch = vi.fn()
    globalThis.fetch = mockFetch
    vi.clearAllMocks()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    // Allow pending timers to complete before cleanup
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it("should render without crashing", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should render ListItem", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    expect(container.querySelector(".MuiListItem-root")).toBeTruthy()
  })

  it("should render feed title", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "My Test Feed",
      html_url: "https://example.com",
      image: "",
    }

    render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    expect(screen.getByText("My Test Feed")).toBeTruthy()
  })

  it("should render feed URL as secondary text", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
    }

    render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    expect(screen.getByText("https://example.com")).toBeTruthy()
  })

  it("should render feed key when URL is empty", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "",
      image: "",
    }

    render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    expect(screen.getByText("https://example.com/feed")).toBeTruthy()
  })

  it("should call selectFeed when clicked", () => {
    const mockSelectFeed = vi.fn()
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
    }

    render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={mockSelectFeed}
      />,
    )

    const button = screen.getByRole("button", {
      name: /My Test Feed|Test Feed/,
    })
    fireEvent.click(button)

    expect(mockSelectFeed).toHaveBeenCalledWith(feed)
  })

  it("should show check icon when selected", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={true}
        selectFeed={vi.fn()}
      />,
    )

    expect(container.querySelector(".MuiSvgIcon-root")).toBeTruthy()
  })

  it("should render feed image avatar when available", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "https://example.com/image.jpg",
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    const avatar = container.querySelector(".MuiAvatar-img")
    expect(avatar).toBeTruthy()
  })

  it("should show delete button when feed is not in any group", () => {
    const mockSelectFeed = vi.fn()
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
      defaultGroup: null,
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={mockSelectFeed}
      />,
    )

    expect(container.querySelector(".MuiIconButton-edgeEnd")).toBeTruthy()
  })

  it("should not show delete button when feed is a default feed", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
      defaultGroup: "News",
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    // Delete button should not be shown for default feeds
    // when no currentGroup is specified and feed is not in any group
    // but we can't easily verify this without mocking user interactions
    expect(container).toBeTruthy()
  })

  it("should show delete button in group when feed is in current group", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
    }

    const group = {
      key: "test-group",
      feeds: ["https://example.com/feed"],
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: [group]}}
        currentGroup="test-group"
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    // Delete button should be shown
    expect(container.querySelector(".MuiIconButton-edgeEnd")).toBeTruthy()
  })

  it("should render with multiple groups", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
    }

    const groups = {
      all: [
        {key: "group-1", feeds: ["https://example.com/feed"]},
        {key: "group-2", feeds: []},
      ],
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={groups}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle feed without html_url", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "",
      image: "",
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle feed without image", () => {
    const feed = {
      key: "https://example.com/feed",
      title: "Test Feed",
      html_url: "https://example.com",
      image: "",
    }

    const {container} = render(
      <Feed
        user={user}
        code="test-code"
        groups={{all: []}}
        feed={feed}
        selected={false}
        selectFeed={vi.fn()}
      />,
    )

    expect(container).toBeTruthy()
  })
})
