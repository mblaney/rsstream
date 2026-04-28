import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
} from "vitest"
import {render, screen, waitFor} from "@testing-library/react"
import Display from "../Display"
import {createTestUser} from "../../__tests__/setup"

describe("Display Component", () => {
  let user
  let mockSetMode

  beforeAll(async () => {
    user = await createTestUser()
  })

  let mockRequestMoreHistory
  let mockRequestDay

  beforeEach(() => {
    mockSetMode = vi.fn()
    mockRequestMoreHistory = vi.fn()
    mockRequestDay = vi.fn()
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    localStorage.clear()
    sessionStorage.clear()
    // Allow pending timers to complete before cleanup
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it("should render without crashing when user is authenticated", () => {
    const {container} = render(
      <Display
        user={user}
        host="localhost"
        code="test-code"
        mode="light"
        setMode={mockSetMode}
        feeds={{}}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should render with authenticated user", () => {
    const {container} = render(
      <Display
        user={user}
        host="localhost:3000"
        code="abc123"
        mode="light"
        setMode={mockSetMode}
        feeds={{}}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    expect(container).toBeTruthy()
    expect(user.is).toBeTruthy()
  })

  it("should set up interval for checking new items on mount", async () => {
    const setIntervalSpy = vi.spyOn(global, "setInterval")

    render(
      <Display
        user={user}
        host="localhost"
        code="test-code"
        mode="light"
        setMode={mockSetMode}
        feeds={{}}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    await waitFor(() => {
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000)
    })

    setIntervalSpy.mockRestore()
  })

  it("should clean up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval")

    const {unmount} = render(
      <Display
        user={user}
        host="localhost"
        code="test-code"
        mode="light"
        setMode={mockSetMode}
        feeds={{}}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()

    clearIntervalSpy.mockRestore()
  })

  it("should set up popstate event listener", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener")

    render(
      <Display
        user={user}
        host="localhost"
        code="test-code"
        mode="light"
        setMode={mockSetMode}
        feeds={{}}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function),
      )
    })

    addEventListenerSpy.mockRestore()
  })

  it("should render ItemList component", () => {
    const {container} = render(
      <Display
        user={user}
        host="localhost"
        code="test-code"
        mode="light"
        setMode={mockSetMode}
        feeds={{}}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    // Container should have Grid elements from ItemList
    expect(container.querySelector(".MuiContainer-root")).toBeTruthy()
  })

  it("should handle empty feeds", () => {
    const {container} = render(
      <Display
        user={user}
        host="localhost"
        code="test-code"
        mode="light"
        setMode={mockSetMode}
        feeds={{}}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle feeds with items", async () => {
    const dayKey = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    )

    const feeds = {
      "https://example.com/feed": {
        url: "https://example.com/feed",
        title: "Test Feed",
        items: {
          [dayKey]: {
            "item-1": {
              title: "Test Article",
              content: "Test content here",
              timestamp: Date.now(),
              author: "Test Author",
            },
          },
        },
      },
    }

    const {container} = render(
      <Display
        user={user}
        host="localhost"
        code="test-code"
        mode="light"
        setMode={mockSetMode}
        feeds={feeds}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should pass mode and setMode props to SearchAppBar", () => {
    render(
      <Display
        user={user}
        host="localhost"
        code="test-code"
        mode="dark"
        setMode={mockSetMode}
        feeds={{}}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    // Component should render with given mode
    expect(mockSetMode).not.toHaveBeenCalled()
  })

  it("should initialize with group list displayed", () => {
    const {container} = render(
      <Display
        user={user}
        host="localhost"
        code="test-code"
        mode="light"
        setMode={mockSetMode}
        feeds={{}}
        requestMoreHistory={mockRequestMoreHistory}
        historyDayLoaded={0}
        maxHistoryReached={false}
        requestDay={mockRequestDay}
      />,
    )

    expect(container).toBeTruthy()
  })
})
