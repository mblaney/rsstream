/**
 * Holster WebSocket Mock
 * Simulates the WebSocket transport layer for Holster authentication and data operations.
 * Intercepts messages from the Holster client and responds with properly formatted
 * wire protocol messages, including real cryptographic operations via SEA.
 */

import {text} from "@mblaney/holster/src/utils.js"
import SEA from "@mblaney/holster/src/sea.js"

const testUsername = "testuser"
const testPassword = "testpassword"
let testPubKey = null // Will be set after key pair generation

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
  testPubKey = testKeyPair.pub // Use the actual generated public key

  // Only store private key components - public parts come from server response
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
 * Processes GET/PUT requests and returns appropriate responses
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
            [pubSoul]: {"#": pubSoul}, // Key is the soul reference with ~
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
 * Main WebSocket mock factory
 * Creates a mock WebSocket that simulates Holster server behavior
 * Uses property-based event handlers (onmessage, onopen, etc.) as Holster does
 */
/**
 * WebSocket constants matching the real WebSocket API
 */
createMockHolsterWebSocket.CONNECTING = 0
createMockHolsterWebSocket.OPEN = 1
createMockHolsterWebSocket.CLOSING = 2
createMockHolsterWebSocket.CLOSED = 3

export function createMockHolsterWebSocket(url) {
  const handler = createServerHandler()

  const mockWs = {
    // Event handler properties (assigned directly by Holster)
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,

    // Standard WebSocket properties
    readyState: 1, // OPEN
    url: url,

    send: data => {
      const message = JSON.parse(data)

      // Process request and send response
      setTimeout(async () => {
        let response = null

        if (message.get) {
          const soul = message.get["#"]

          if (soul.startsWith("~@")) {
            // Phase 1: Username lookup
            response = await handler.handleUsernameLookup(soul, message["#"])
          } else if (soul.startsWith("~") && !soul.startsWith("~@")) {
            // Phase 2: User data request
            response = await handler.handleUserDataRequest(
              soul,
              message["#"],
              cachedTestAuthData,
            )
          } else {
            // Unknown request
            response = handler.handleUnknownRequest(soul, message["#"])
          }
        } else if (message.put) {
          // Handle PUT requests
          response = handler.handlePutRequest(message["#"])
        }

        if (response && mockWs.onmessage) {
          sendMessage(response)
        }
      }, 10) // Small delay to simulate network
    },

    close: () => {
      // Closes the WebSocket connection (required by WebSocket API)
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

  // Simulate connection opening
  setTimeout(() => {
    if (mockWs.onopen) {
      mockWs.onopen(new Event("open"))
    }
  }, 10)

  return mockWs
}
