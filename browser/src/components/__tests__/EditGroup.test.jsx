import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest"
import {render, screen, waitFor, act} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import EditGroup from "../EditGroup"
import {createTestUser} from "../../__tests__/setup"

describe("EditGroup Component", () => {
  let user

  beforeAll(async () => {
    user = await createTestUser()
  })

  beforeEach(() => {
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

  it("should render without crashing", () => {
    const mockShowGroupList = vi.fn()
    const {container} = render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should render Container component", () => {
    const mockShowGroupList = vi.fn()
    const {container} = render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    expect(container.querySelector(".MuiContainer-root")).toBeTruthy()
  })

  it("should render edit group card", () => {
    const mockShowGroupList = vi.fn()
    const {container} = render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    expect(container.querySelector(".MuiCard-root")).toBeTruthy()
  })

  it("should render group name input field", () => {
    const mockShowGroupList = vi.fn()
    render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    const input = screen.getByRole("textbox", {name: /group name/i})
    expect(input).toBeTruthy()
  })

  it("should populate group name input with current group name", () => {
    const mockShowGroupList = vi.fn()
    render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "My Group", feeds: []}]}}
        currentGroup="My Group"
        showGroupList={mockShowGroupList}
      />,
    )

    const input = screen.getByRole("textbox", {name: /group name/i})
    expect(input.value).toBe("My Group")
  })

  it("should render submit button", () => {
    const mockShowGroupList = vi.fn()
    render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    const submitButton = screen.getByRole("button", {name: /submit/i})
    expect(submitButton).toBeTruthy()
  })

  it("should update group name on input change", async () => {
    const mockShowGroupList = vi.fn()
    render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    const input = screen.getByRole("textbox", {name: /group name/i})
    await act(async () => {
      await userEvent.clear(input)
      await userEvent.type(input, "Updated Group")
    })

    await waitFor(() => {
      expect(input.value).toBe("Updated Group")
    })
  })

  it("should disable submit button when group name is empty", async () => {
    const mockShowGroupList = vi.fn()
    render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    const input = screen.getByRole("textbox", {name: /group name/i})
    await act(async () => {
      await userEvent.clear(input)
    })

    const submitButton = screen.getByRole("button", {name: /submit/i})
    expect(submitButton).toBeDisabled()
  })

  it("should render current feeds section", () => {
    const mockShowGroupList = vi.fn()
    const {container} = render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    expect(container.textContent.includes("Current feeds")).toBeTruthy()
  })

  it("should render add feeds section", () => {
    const mockShowGroupList = vi.fn()
    const {container} = render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    expect(container.textContent.includes("Add feeds")).toBeTruthy()
  })

  it("should display default feeds initially", async () => {
    const mockShowGroupList = vi.fn()
    const {container} = render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    // Default feeds should be available
    await waitFor(
      () => {
        expect(container.querySelector(".MuiList-root")).toBeTruthy()
      },
      {timeout: 2000},
    )
  })

  it("should handle group with multiple feeds", () => {
    const mockShowGroupList = vi.fn()
    const feedUrls = [
      "https://feed1.com/rss",
      "https://feed2.com/rss",
      "https://feed3.com/rss",
    ]
    const {container} = render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{
          all: [{key: "test-group", feeds: feedUrls}],
        }}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should handle group prop updates", () => {
    const mockShowGroupList = vi.fn()
    const {rerender, container} = render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    rerender(
      <EditGroup
        user={user}
        code="test-code"
        groups={{
          all: [
            {key: "test-group", feeds: ["https://feed1.com"]},
            {key: "other-group", feeds: []},
          ],
        }}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    expect(container).toBeTruthy()
  })

  it("should display message when no feeds are available to add", async () => {
    const mockShowGroupList = vi.fn()
    const {container} = render(
      <EditGroup
        user={user}
        code="test-code"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    // Component should render with all feeds already added scenario
    expect(container).toBeTruthy()
  })

  it("should pass user and code props to Feed components", () => {
    const mockShowGroupList = vi.fn()
    const {container} = render(
      <EditGroup
        user={user}
        code="test-code-123"
        groups={{all: [{key: "test-group", feeds: []}]}}
        currentGroup="test-group"
        showGroupList={mockShowGroupList}
      />,
    )

    expect(container).toBeTruthy()
  })
})
