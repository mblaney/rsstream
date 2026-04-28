import {describe, it, expect, beforeEach, afterEach, vi} from "vitest"
import {act, render} from "@testing-library/react"
import GroupList from "../GroupList"

describe("GroupList Component", () => {
  let mockSetGroup

  beforeEach(() => {
    mockSetGroup = vi.fn()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    vi.useRealTimers()
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it("should render without crashing", () => {
    const groups = {
      all: [],
    }

    const {container} = render(
      <GroupList groups={groups} setGroup={mockSetGroup} />,
    )

    expect(container).toBeTruthy()
  })

  it("should render Container component", () => {
    const groups = {
      all: [],
    }

    const {container} = render(
      <GroupList groups={groups} setGroup={mockSetGroup} />,
    )

    expect(container.querySelector(".MuiContainer-root")).toBeTruthy()
  })

  it("should render Grid container", () => {
    const groups = {
      all: [],
    }

    const {container} = render(
      <GroupList groups={groups} setGroup={mockSetGroup} />,
    )

    expect(container.querySelector(".MuiGrid-container")).toBeTruthy()
  })

  it("should render List component", () => {
    const groups = {
      all: [],
    }

    const {container} = render(
      <GroupList groups={groups} setGroup={mockSetGroup} />,
    )

    expect(container.querySelector(".MuiList-root")).toBeTruthy()
  })

  it("should display welcome message when no groups have feeds", () => {
    const groups = {
      all: [
        {key: "group1", feeds: []},
        {key: "group2", feeds: []},
      ],
    }

    const {container, rerender} = render(
      <GroupList
        groups={groups}
        groupsLoaded={false}
        setGroup={mockSetGroup}
      />,
    )

    expect(container.querySelector(".MuiCircularProgress-root")).toBeTruthy()

    rerender(
      <GroupList groups={groups} groupsLoaded={true} setGroup={mockSetGroup} />,
    )

    expect(container.querySelector(".MuiCircularProgress-root")).toBeFalsy()
    act(() => vi.advanceTimersByTime(500))
    expect(container.textContent).toContain("Welcome")
  })

  it("should render groups with feeds", () => {
    const groups = {
      all: [
        {key: "group1", feeds: ["https://feed1.com"], timestamp: Date.now()},
        {key: "group2", feeds: ["https://feed2.com"], timestamp: Date.now()},
      ],
    }

    const {container} = render(
      <GroupList groups={groups} setGroup={mockSetGroup} />,
    )

    expect(container.textContent).toContain("group1")
    expect(container.textContent).toContain("group2")
  })

  it("should not render groups without feeds", () => {
    const groups = {
      all: [
        {
          key: "group-with-feeds",
          feeds: ["https://feed1.com"],
          timestamp: Date.now(),
        },
        {key: "group-without-feeds", feeds: []},
      ],
    }

    const {container} = render(
      <GroupList groups={groups} setGroup={mockSetGroup} />,
    )

    expect(container.textContent).toContain("group-with-feeds")
    expect(container.textContent).not.toContain("group-without-feeds")
  })

  it("should handle groups with multiple feeds", () => {
    const groups = {
      all: [
        {
          key: "multi-feed-group",
          feeds: [
            "https://feed1.com",
            "https://feed2.com",
            "https://feed3.com",
          ],
          timestamp: Date.now(),
        },
      ],
    }

    const {container} = render(
      <GroupList groups={groups} setGroup={mockSetGroup} />,
    )

    expect(container.textContent).toContain("multi-feed-group")
  })

  it("should handle null groups prop", () => {
    const {container} = render(
      <GroupList groups={null} setGroup={mockSetGroup} />,
    )

    expect(container).toBeTruthy()
  })

  it("should clear message when groups have feeds", async () => {
    const groups = {
      all: [
        {key: "group1", feeds: ["https://feed1.com"], timestamp: Date.now()},
      ],
    }

    const {container} = render(
      <GroupList groups={groups} setGroup={mockSetGroup} />,
    )

    // Message should be cleared immediately when groups have feeds
    expect(container.textContent).not.toContain("Welcome")
  })

  it("should handle groups prop updates", () => {
    const groups1 = {
      all: [],
    }

    const groups2 = {
      all: [
        {key: "group1", feeds: ["https://feed1.com"], timestamp: Date.now()},
      ],
    }

    const {rerender, container} = render(
      <GroupList groups={groups1} setGroup={mockSetGroup} />,
    )

    rerender(<GroupList groups={groups2} setGroup={mockSetGroup} />)

    expect(container).toBeTruthy()
  })
})
