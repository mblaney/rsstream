import {describe, it, expect, beforeEach, afterEach, vi} from "vitest"
import {render, screen, fireEvent} from "@testing-library/react"
import Item from "../Item"

describe("Item Component", () => {
  let mockItemRefs

  beforeEach(() => {
    mockItemRefs = {current: new Map()}
    vi.clearAllMocks()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    // Allow pending timers to complete before cleanup
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it("should render without crashing", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    const {container} = render(
      <Item item={item} itemRefs={mockItemRefs} newFrom={0} />,
    )

    expect(container).toBeTruthy()
  })

  it("should render Grid item", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    const {container} = render(
      <Item item={item} itemRefs={mockItemRefs} newFrom={0} />,
    )

    expect(container.querySelector(".MuiGrid-item")).toBeTruthy()
  })

  it("should render item title", () => {
    const item = {
      key: "item-1",
      title: "Test Article Title",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    render(<Item item={item} itemRefs={mockItemRefs} newFrom={0} />)

    expect(screen.getByText(/Test Article Title/)).toBeTruthy()
  })

  it("should render item author", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "John Doe",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    render(<Item item={item} itemRefs={mockItemRefs} newFrom={0} />)

    expect(screen.getByText("John Doe")).toBeTruthy()
  })

  it("should render feed title when author is not provided", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: null,
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "My Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    render(<Item item={item} itemRefs={mockItemRefs} newFrom={0} />)

    expect(screen.getByText("My Feed")).toBeTruthy()
  })

  it("should render item content", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "<p>Test content here</p>",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    render(<Item item={item} itemRefs={mockItemRefs} newFrom={0} />)

    expect(screen.getByText(/Test content here/)).toBeTruthy()
  })

  it("should show 'show more' link for long content", () => {
    const longContent = "<p>" + "x".repeat(1300) + "</p>"
    const item = {
      key: "item-1",
      title: "Test Article",
      content: longContent,
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    render(<Item item={item} itemRefs={mockItemRefs} newFrom={0} />)

    expect(screen.getByText("show more")).toBeTruthy()
  })

  it("should toggle show more/less", () => {
    const longContent = "<p>" + "x".repeat(1300) + "</p>"
    const item = {
      key: "item-1",
      title: "Test Article",
      content: longContent,
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    render(<Item item={item} itemRefs={mockItemRefs} newFrom={0} />)

    const showMoreLink = screen.getByText("show more")
    fireEvent.click(showMoreLink)

    expect(screen.getByText("show less")).toBeTruthy()
  })

  it("should render short content without show more link", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "<p>Short content</p>",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    render(<Item item={item} itemRefs={mockItemRefs} newFrom={0} />)

    expect(screen.queryByText("show more")).not.toBeInTheDocument()
  })

  it("should render feed image avatar when available", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "https://example.com/image.jpg",
      url: "https://example.com/article",
    }

    const {container} = render(
      <Item item={item} itemRefs={mockItemRefs} newFrom={0} />,
    )

    const avatar = container.querySelector(".MuiAvatar-img")
    expect(avatar).toBeTruthy()
  })

  it("should render permalink link", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      permalink: "https://example.com/article-1",
      url: "https://example.com/article",
    }

    render(<Item item={item} itemRefs={mockItemRefs} newFrom={0} />)

    const link = screen.getByRole("link")
    expect(link.href).toContain("https://example.com/article-1")
  })

  it("should render divider for new items", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    const {container} = render(
      <Item item={item} itemRefs={mockItemRefs} newFrom="item-1" />,
    )

    expect(container.querySelector(".MuiDivider-root")).toBeTruthy()
  })

  it("should add item ref on mount", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      url: "https://example.com/article",
    }

    render(<Item item={item} itemRefs={mockItemRefs} newFrom={0} />)

    expect(mockItemRefs.current.has("item-1")).toBeTruthy()
  })

  it("should render enclosure images", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      enclosure: {
        photo: [{link: "https://example.com/photo.jpg", alt: "Photo"}],
      },
      url: "https://example.com/article",
    }

    const {container} = render(
      <Item item={item} itemRefs={mockItemRefs} newFrom={0} />,
    )

    const img = container.querySelector("img")
    expect(img).toBeTruthy()
  })

  it("should render enclosure audio", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      enclosure: {
        audio: ["https://example.com/audio.mp3"],
      },
      url: "https://example.com/article",
    }

    const {container} = render(
      <Item item={item} itemRefs={mockItemRefs} newFrom={0} />,
    )

    const audio = container.querySelector("audio")
    expect(audio).toBeTruthy()
  })

  it("should render enclosure video", () => {
    const item = {
      key: "item-1",
      title: "Test Article",
      content: "Test content",
      author: "Test Author",
      timestamp: Date.now(),
      feedUrl: "https://example.com/feed",
      feedTitle: "Test Feed",
      feedImage: "",
      enclosure: {
        video: ["https://example.com/video.mp4"],
      },
      url: "https://example.com/article",
    }

    const {container} = render(
      <Item item={item} itemRefs={mockItemRefs} newFrom={0} />,
    )

    const video = container.querySelector("video")
    expect(video).toBeTruthy()
  })
})
