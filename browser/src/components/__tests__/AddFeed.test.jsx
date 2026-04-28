import {describe, it, expect, beforeEach, afterEach, vi} from "vitest"
import {render, screen, waitFor} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AddFeed from "../AddFeed"

function makeChain(readValue = null) {
  const chain = {
    next: vi.fn((key, cb) => {
      if (typeof cb === "function") {
        setTimeout(() => cb(readValue), 0)
      }
      return makeChain(readValue)
    }),
    put: vi.fn((data, cb) => {
      setTimeout(() => cb(null), 0)
      return chain
    }),
  }
  return chain
}

function createMockUser() {
  return {
    is: {pub: "test-pub"},
    SEA: {
      sign: vi.fn(async val => "signed:" + val),
    },
    get: vi.fn(key => {
      if (Array.isArray(key) && key[1] === "accounts") {
        return makeChain({subscribed: 0, feeds: 10})
      }
      return makeChain(null)
    }),
  }
}

const mockResults = [
  {type: "feed", url: "https://example.com/feed.xml", name: "Example Feed"},
  {
    type: "feed",
    url: "https://example.com/articles/rss",
    name: {0: "Example Articles"},
  },
  {
    type: "feed",
    url: "https://example.com/notes/rss",
    name: {0: "Example Notes"},
  },
]

describe("AddFeed Component", () => {
  let mockUser

  beforeEach(() => {
    mockUser = createMockUser()
    global.fetch = vi.fn(async url => {
      if (url.includes("/add-feed")) {
        return {
          ok: true,
          json: async () => ({
            add: {
              url: "https://example.com/",
              title: "Example Domain",
              description: "",
              html_url: "https://example.com/",
              language: "",
              image: "",
            },
            results: [
              {
                type: "feed",
                url: "https://example.com/",
                name: "Example Domain",
              },
              ...mockResults,
            ],
          }),
        }
      }
      return {ok: true, json: async () => ({})}
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should render the feed input and submit button", () => {
    render(<AddFeed user={mockUser} host="test-host" code="test-code" />)

    expect(screen.getByRole("textbox", {name: /feed/i})).toBeTruthy()
    expect(screen.getByRole("button", {name: /submit/i})).toBeTruthy()
  })

  it("should disable submit button when input is empty", () => {
    render(<AddFeed user={mockUser} host="test-host" code="test-code" />)

    expect(screen.getByRole("button", {name: /submit/i})).toBeDisabled()
  })

  it("shows other feeds as checkboxes when multiple are discovered", async () => {
    render(<AddFeed user={mockUser} host="test-host" code="test-code" />)

    userEvent.type(
      screen.getByRole("textbox", {name: /feed/i}),
      "https://example.com",
    )
    userEvent.click(screen.getByRole("button", {name: /submit/i}))

    await waitFor(() => {
      expect(screen.getByText(/added, other feeds found/i)).toBeTruthy()
    })

    expect(screen.getByText("Example Feed")).toBeTruthy()
    expect(screen.getByText("Example Articles")).toBeTruthy()
    expect(screen.getByText("Example Notes")).toBeTruthy()
  })

  it("does not list the added feed in the other feeds", async () => {
    render(<AddFeed user={mockUser} host="test-host" code="test-code" />)

    userEvent.type(
      screen.getByRole("textbox", {name: /feed/i}),
      "https://example.com",
    )
    userEvent.click(screen.getByRole("button", {name: /submit/i}))

    await waitFor(() => {
      expect(screen.getByText(/added, other feeds found/i)).toBeTruthy()
    })

    const checkboxes = screen.getAllByRole("checkbox")
    expect(checkboxes).toHaveLength(mockResults.length)
  })

  it("shows Add selected button only when a checkbox is checked", async () => {
    render(<AddFeed user={mockUser} host="test-host" code="test-code" />)

    userEvent.type(
      screen.getByRole("textbox", {name: /feed/i}),
      "https://example.com",
    )
    userEvent.click(screen.getByRole("button", {name: /submit/i}))

    await waitFor(() => {
      expect(screen.getByText(/added, other feeds found/i)).toBeTruthy()
    })

    expect(screen.queryByRole("button", {name: /add selected/i})).toBeNull()

    userEvent.click(screen.getAllByRole("checkbox")[0])

    await waitFor(() => {
      expect(screen.getByRole("button", {name: /add selected/i})).toBeTruthy()
    })
  })
})
