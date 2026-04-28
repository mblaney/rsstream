/**
 * Shared test utilities and helpers for all tests
 * Includes Holster mock setup and test user creation
 */

import {text} from "@mblaney/holster/src/utils.js"
import SEA from "@mblaney/holster/src/sea.js"
import Holster from "@mblaney/holster/src/holster.js"

const testUsername = "testuser"
const testPassword = "testpassword"
let testPubKey = null

// Pre-generated SEA-encrypted test data and key pair
let cachedTestAuthData = null
let testKeyPair = null

/**
 * Initialize test authentication data with real EC key pair and encrypted private keys.
 * Must be called before creating the Holster instance so test data is available
 * when wire protocol requests are made.
 */
export async function initializeTestAuthData() {
  if (cachedTestAuthData) return

  const salt = text.random(64)
  const work = await SEA.work(testPassword, salt)

  // Generate real EC keys using SEA.pair()
  testKeyPair = await SEA.pair()
  testPubKey = testKeyPair.pub

  const privateKeys = {
    priv: testKeyPair.priv,
    epriv: testKeyPair.epriv,
  }

  const enc = await SEA.encrypt(privateKeys, work)

  cachedTestAuthData = {
    enc: enc,
    salt: salt,
  }
}

/**
 * Server-side handler for Holster wire protocol messages
 */
function createServerHandler() {
  return {
    async handleUsernameLookup(soul, messageId) {
      const now = Date.now()
      const pubSoul = `~${testPubKey}`
      const signature = await SEA.signTimestamp(now, testKeyPair)
      return {
        "#": text.random(9),
        "@": messageId,
        put: {
          [soul]: {
            [pubSoul]: {"#": pubSoul},
            _: {
              "#": soul,
              ">": {
                [pubSoul]: now,
              },
              s: {
                [now]: signature,
              },
            },
          },
        },
      }
    },

    async handleUserDataRequest(soul, messageId, authData) {
      const now = Date.now()
      const signature = await SEA.signTimestamp(now, testKeyPair)
      return {
        "#": text.random(9),
        "@": messageId,
        put: {
          [soul]: {
            username: testUsername,
            pub: testKeyPair.pub,
            epub: testKeyPair.epub,
            auth: JSON.stringify(authData),
            _holster_user_public_key: testKeyPair.pub,
            _: {
              "#": soul,
              ">": {
                username: now,
                pub: now,
                epub: now,
                auth: now,
                _holster_user_public_key: now,
              },
              s: {
                [now]: signature,
              },
            },
          },
        },
      }
    },

    handlePutRequest(messageId) {
      return {
        "#": text.random(9),
        "@": messageId,
      }
    },

    handleUnknownRequest(soul, messageId) {
      return {
        "#": text.random(9),
        "@": messageId,
        put: {
          [soul]: null,
        },
      }
    },
  }
}

/**
 * WebSocket mock factory
 */
createMockHolsterWebSocket.CONNECTING = 0
createMockHolsterWebSocket.OPEN = 1
createMockHolsterWebSocket.CLOSING = 2
createMockHolsterWebSocket.CLOSED = 3

export function createMockHolsterWebSocket(url) {
  const handler = createServerHandler()

  const mockWs = {
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
    readyState: 1,
    url: url,

    send: data => {
      const message = JSON.parse(data)

      setTimeout(async () => {
        let response = null

        if (message.get) {
          const soul = message.get["#"]

          if (soul.startsWith("~@")) {
            response = await handler.handleUsernameLookup(soul, message["#"])
          } else if (soul.startsWith("~") && !soul.startsWith("~@")) {
            response = await handler.handleUserDataRequest(
              soul,
              message["#"],
              cachedTestAuthData,
            )
          } else {
            response = handler.handleUnknownRequest(soul, message["#"])
          }
        } else if (message.put) {
          response = handler.handlePutRequest(message["#"])
        }

        if (response && mockWs.onmessage) {
          sendMessage(response)
        }
      }, 10)
    },

    close: () => {
      // Closes the WebSocket connection
    },
  }

  function sendMessage(data) {
    const event = new MessageEvent("message", {
      data: JSON.stringify(data),
    })
    if (mockWs.onmessage) {
      mockWs.onmessage(event)
    }
  }

  setTimeout(() => {
    if (mockWs.onopen) {
      mockWs.onopen(new Event("open"))
    }
  }, 10)

  return mockWs
}

// Queue to serialize createTestUser calls and prevent WebSocket race conditions
let webSocketQueue = Promise.resolve()

/**
 * Create and authenticate a test Holster user
 * @param {Object} options - Configuration options
 * @param {number} options.waitTime - Wait timeout for wire.get operations in ms (default: 500)
 * @returns {Promise<Object>} Authenticated user object
 */
export async function createTestUser(options = {}) {
  const {waitTime = 500} = options

  await initializeTestAuthData()

  // Queue this user creation to prevent concurrent WebSocket conflicts
  return (webSocketQueue = webSocketQueue.then(async () => {
    const originalWebSocket = globalThis.WebSocket
    globalThis.WebSocket = createMockHolsterWebSocket

    try {
      // Create Holster instance with short wait timeout for tests
      const holster = Holster({wait: waitTime})
      const user = holster.user()

      await new Promise((resolve, reject) => {
        user.auth(testUsername, testPassword, err => {
          if (err) reject(err)
          else resolve()
        })

        // Give it extra time to account for async operations
        setTimeout(() => reject(new Error("Auth timeout")), waitTime + 500)
      })

      return user
    } finally {
      // Always restore original WebSocket after a delay to let pending operations complete
      // This prevents "WebSocket is not defined" errors from Holster's wire protocol
      await new Promise(resolve => setTimeout(resolve, 300))

      if (originalWebSocket) {
        globalThis.WebSocket = originalWebSocket
      } else {
        delete globalThis.WebSocket
      }
    }
  }))
}
