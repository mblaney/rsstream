import {describe, it, expect, beforeAll, afterEach, vi} from "vitest"
import {render, screen} from "@testing-library/react"
import AppSettings from "../AppSettings"
import {createTestUser} from "../../__tests__/setup"

describe("Settings Component", () => {
  let user

  beforeAll(async () => {
    user = await createTestUser()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("renders without crashing", () => {
    const {container} = render(
      <AppSettings
        user={user}
        host=""
        code=""
        mode="light"
        setMode={vi.fn()}
      />,
    )
    expect(container).toBeTruthy()
  })

  it("shows account name from sessionStorage", () => {
    sessionStorage.setItem("name", "Alice")
    render(
      <AppSettings
        user={user}
        host=""
        code=""
        mode="light"
        setMode={vi.fn()}
      />,
    )
    expect(screen.getByText("Hello Alice")).toBeTruthy()
  })

  it("shows fallback message when name is not set", () => {
    render(
      <AppSettings
        user={user}
        host=""
        code=""
        mode="light"
        setMode={vi.fn()}
      />,
    )
    expect(screen.getByText(/Account not found/)).toBeTruthy()
  })

  it("renders password change form", () => {
    render(
      <AppSettings
        user={user}
        host=""
        code=""
        mode="light"
        setMode={vi.fn()}
      />,
    )
    expect(
      screen.getByText(/Use this form to change your password/),
    ).toBeTruthy()
    expect(screen.getByRole("button", {name: /submit/i})).toBeTruthy()
  })

  it("renders logout button", () => {
    render(
      <AppSettings
        user={user}
        host=""
        code=""
        mode="light"
        setMode={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", {name: /logout/i})).toBeTruthy()
  })

  it("renders sponsor link with correct href", () => {
    render(
      <AppSettings
        user={user}
        host=""
        code=""
        mode="light"
        setMode={vi.fn()}
      />,
    )
    const link = screen.getByRole("link", {name: /sponsor the project/i})
    expect(link).toBeTruthy()
    expect(link.getAttribute("href")).toBe(
      "https://github.com/sponsors/mblaney",
    )
  })

  it("does not show feed count when account is not loaded", () => {
    render(
      <AppSettings
        user={user}
        host=""
        code=""
        mode="light"
        setMode={vi.fn()}
      />,
    )
    expect(screen.queryByText(/feeds can be subscribed/)).toBeNull()
  })

  it("renders cache storage card when cache api is available", async () => {
    globalThis.caches = {
      has: vi.fn().mockResolvedValue(false),
      keys: vi.fn().mockResolvedValue([]),
      open: vi.fn(),
      delete: vi.fn(),
    }

    const {findByText} = render(
      <AppSettings
        user={user}
        host=""
        code=""
        mode="light"
        setMode={vi.fn()}
      />,
    )
    expect(await findByText("Cache storage")).toBeTruthy()

    delete globalThis.caches
  })
})
