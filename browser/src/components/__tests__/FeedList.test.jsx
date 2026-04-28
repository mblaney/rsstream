import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest"
import {render, screen, fireEvent, waitFor, act} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import FeedList from "../FeedList"
import {createTestUser} from "../../__tests__/setup"

describe("FeedList Component", () => {
  let user
  let mockShowGroupList

  beforeAll(async () => {
    user = await createTestUser()
  })

  beforeEach(() => {
    mockShowGroupList = vi.fn()
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    // Allow pending timers to complete before cleanup
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it("should render without crashing", async () => {
    const {container} = render(
      <FeedList
        user={user}
        code="test-code"
        groups={{all: []}}
        showGroupList={mockShowGroupList}
      />,
    )

    await waitFor(() => {
      expect(container).toBeTruthy()
    })
  })

  it("should render Container component", async () => {
    const {container} = render(
      <FeedList
        user={user}
        code="test-code"
        groups={{all: []}}
        showGroupList={mockShowGroupList}
      />,
    )

    await waitFor(() => {
      expect(container.querySelector(".MuiContainer-root")).toBeTruthy()
    })
  })

  it("should render new group card", async () => {
    const {container} = render(
      <FeedList
        user={user}
        code="test-code"
        groups={{all: []}}
        showGroupList={mockShowGroupList}
      />,
    )

    await waitFor(() => {
      expect(container.querySelector(".MuiCard-root")).toBeTruthy()
    })
  })

  it("should render group name input field", async () => {
    render(
      <FeedList
        user={user}
        code="test-code"
        groups={{all: []}}
        showGroupList={mockShowGroupList}
      />,
    )

    await waitFor(() => {
      const input = screen.getByRole("textbox", {name: /group name/i})
      expect(input).toBeTruthy()
    })
  })

  it("should render submit button", async () => {
    render(
      <FeedList
        user={user}
        code="test-code"
        groups={{all: []}}
        showGroupList={mockShowGroupList}
      />,
    )

    await waitFor(() => {
      const submitButton = screen.getByRole("button", {name: /submit/i})
      expect(submitButton).toBeTruthy()
    })
  })

  it("should disable submit button when no feeds selected", async () => {
    render(
      <FeedList
        user={user}
        code="test-code"
        groups={{all: []}}
        showGroupList={mockShowGroupList}
      />,
    )

    await waitFor(() => {
      const submitButton = screen.getByRole("button", {name: /submit/i})
      expect(submitButton).toBeDisabled()
    })
  })

  it("should disable submit button when group name is empty", async () => {
    render(
      <FeedList
        user={user}
        code="test-code"
        groups={{all: []}}
        showGroupList={mockShowGroupList}
      />,
    )

    await waitFor(() => {
      const submitButton = screen.getByRole("button", {name: /submit/i})
      expect(submitButton).toBeDisabled()
    })
  })

  it("should render List component for feeds", async () => {
    const {container} = render(
      <FeedList
        user={user}
        code="test-code"
        groups={{all: []}}
        showGroupList={mockShowGroupList}
      />,
    )

    await waitFor(() => {
      expect(container.querySelector(".MuiList-root")).toBeTruthy()
    })
  })

  it("should render List component for feeds after delay", async () => {
    const {container} = render(
      <FeedList
        user={user}
        code="test-code"
        groups={{all: []}}
        showGroupList={mockShowGroupList}
      />,
    )

    await waitFor(
      () => {
        expect(container.querySelector(".MuiList-root")).toBeTruthy()
      },
      {timeout: 2000},
    )
  })
})
