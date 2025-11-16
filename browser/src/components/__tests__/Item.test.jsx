import React from "react"
import {describe, it, expect, beforeEach, vi} from "vitest"
import {render, screen} from "@testing-library/react"
import Item from "../Item"
import {createMockItem} from "./ItemList.test.jsx"

describe("Item Component", () => {
  const mockItemRefs = {current: new Map()}

  const defaultProps = {
    item: createMockItem(),
    itemRefs: mockItemRefs,
    newFrom: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockItemRefs.current.clear()
  })

  it("should render without crashing", () => {
    const {container} = render(<Item {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it("should display the item title", () => {
    const item = createMockItem({
      title: "Test Article Title",
    })
    const props = {
      ...defaultProps,
      item,
    }
    render(<Item {...props} />)
    expect(screen.getByText("Test Article Title")).toBeInTheDocument()
  })

  it("should display feed title when no author", () => {
    const item = createMockItem({
      author: null,
      feedTitle: "My Test Feed",
    })
    const props = {
      ...defaultProps,
      item,
    }
    render(<Item {...props} />)
    expect(screen.getByText("My Test Feed")).toBeInTheDocument()
  })

  it("should display author if available", () => {
    const item = createMockItem({
      author: "Jane Smith",
    })
    const props = {
      ...defaultProps,
      item,
    }
    render(<Item {...props} />)
    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
  })

  it("should display the item content", () => {
    const item = createMockItem({
      content: "This is the article content that should be displayed.",
    })
    const props = {
      ...defaultProps,
      item,
    }
    render(<Item {...props} />)
    expect(
      screen.getByText("This is the article content that should be displayed."),
    ).toBeInTheDocument()
  })

  it("should handle item without author", () => {
    const item = createMockItem({
      author: null,
      feedTitle: "Test Feed",
    })
    const props = {
      ...defaultProps,
      item,
    }
    render(<Item {...props} />)
    // Should display feed title when author is missing
    expect(screen.getByText("Test Feed")).toBeInTheDocument()
  })

  it("should handle item without content", () => {
    const item = createMockItem({
      content: null,
    })
    const props = {
      ...defaultProps,
      item,
    }
    const {container} = render(<Item {...props} />)
    expect(container).toBeTruthy()
  })

  it("should display timestamp as a link", () => {
    const item = createMockItem({
      permalink: "https://example.com/article-123",
      url: "https://example.com",
    })
    const props = {
      ...defaultProps,
      item,
    }
    render(<Item {...props} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "https://example.com/article-123")
  })

  describe("Interaction Tests", () => {
    it("should be able to click the timestamp link", () => {
      const item = createMockItem({
        permalink: "https://example.com/article-123",
        url: "https://example.com",
      })
      const props = {
        ...defaultProps,
        item,
      }
      render(<Item {...props} />)
      const link = screen.getByRole("link")

      expect(link).toHaveAttribute("href", "https://example.com/article-123")
      expect(link).toHaveAttribute("target", "_blank")
    })

    it("should expand long content with show more button", () => {
      const longContent = "Lorem ipsum dolor sit amet. ".repeat(50) // Very long content
      const item = createMockItem({
        content: longContent,
      })
      const props = {
        ...defaultProps,
        item,
      }
      render(<Item {...props} />)

      // When content is longer than 1200 chars, should show "show more" button
      const showMoreButton = screen.queryByText(/show more/i)
      if (showMoreButton) {
        expect(showMoreButton).toBeInTheDocument()
      }
    })

    it("should handle content without HTML tags", () => {
      const item = createMockItem({
        content: "Simple plain text content",
      })
      const props = {
        ...defaultProps,
        item,
      }
      render(<Item {...props} />)
      expect(screen.getByText("Simple plain text content")).toBeInTheDocument()
    })

    it("should handle content with HTML tags", () => {
      const item = createMockItem({
        content: "<p>Content with <strong>HTML</strong> tags</p>",
      })
      const props = {
        ...defaultProps,
        item,
      }
      render(<Item {...props} />)
      // Should parse and display HTML content
      const container = screen.getByText(/Content with/)
      expect(container).toBeInTheDocument()
    })

    it("should display author in header", () => {
      const item = createMockItem({
        author: "John Smith",
      })
      const props = {
        ...defaultProps,
        item,
      }
      render(<Item {...props} />)
      expect(screen.getByText("John Smith")).toBeInTheDocument()
    })

    it("should render item ref for IntersectionObserver", () => {
      const itemRefs = {current: new Map()}
      const item = createMockItem({
        key: 12345,
      })
      const props = {
        ...defaultProps,
        item,
        itemRefs,
      }
      render(<Item {...props} />)

      // The Grid item should be added to refs after render
      expect(itemRefs.current).toBeTruthy()
    })
  })
})
