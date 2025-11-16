import React from "react"
import {describe, it, expect, beforeEach, vi} from "vitest"
import {render, screen} from "@testing-library/react"
import Holster from "@mblaney/holster/src/holster.js"
import Display from "../Display"
import {
  createMockHolsterWebSocket,
  initializeTestAuthData,
} from "./holster-mock.js"

describe("Display Component", () => {
  let user
  let holster

  beforeEach(async () => {
    // Initialize real SEA-encrypted test data once
    await initializeTestAuthData()

    // Create a real Holster instance with our mock WebSocket
    // Mock the global WebSocket constructor that Holster uses for client connections
    globalThis.WebSocket = createMockHolsterWebSocket
    holster = Holster()

    // Get a user instance
    user = holster.user()

    // Authenticate the user using the real Holster auth flow
    await new Promise((resolve, reject) => {
      user.auth("testuser", "testpassword", err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })

      // Set a timeout to fail if auth doesn't complete
      setTimeout(() => reject(new Error("Auth timeout")), 5000)
    })
  })

  afterEach(() => {
    // Clean up Holster connections and pending operations
    vi.clearAllTimers()
    vi.clearAllMocks()
  })

  const defaultProps = {
    user: null,
    code: "test-code",
    host: "http://localhost",
    modeSwitch: false,
    setModeSwitch: vi.fn(),
    darkMode: false,
    setDarkMode: vi.fn(),
    feedsLoaded: true,
    feeds: new Map(),
  }

  it("should render without crashing", () => {
    const props = {...defaultProps, user}
    const {container} = render(<Display {...props} />)
    expect(container).toBeTruthy()
  })

  it("should handle authenticated user", () => {
    const props = {
      ...defaultProps,
      user,
    }
    const {container} = render(<Display {...props} />)
    expect(container).toBeTruthy()
  })
})
