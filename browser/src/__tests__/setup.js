import {Server} from "mock-socket"
import Holster from "@mblaney/holster/src/holster.js"

const testUsername = "testuser"
const testPassword = "testpassword"

// Each createTestUser call gets its own isolated server on a unique port so
// tests that run concurrently don't share state.
let nextPort = 9100

/**
 * Create and authenticate a test Holster user.
 *
 * Creates a mock-socket Server (which patches globalThis.WebSocket so that
 * Holster's peer connections are routed through it), then creates a Holster
 * server instance backed by that socket, registers the test user, and
 * authenticates.  Returns the authenticated user object.
 */
export async function createTestUser() {
  const port = nextPort++
  const wss = new Server(`ws://localhost:${port}`)
  const holster = Holster({wss, file: `/tmp/holster-test-${port}`})
  const user = holster.user()

  await new Promise((resolve, reject) => {
    user.create(testUsername, testPassword, err => {
      if (err && !err.includes("already exists")) reject(new Error(err))
      else resolve()
    })
  })

  await new Promise((resolve, reject) => {
    user.auth(testUsername, testPassword, err => {
      if (err) reject(new Error(err))
      else resolve()
    })
  })

  return user
}
