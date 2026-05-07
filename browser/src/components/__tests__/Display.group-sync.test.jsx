import {describe, it, expect, beforeAll, vi} from "vitest"
import {render, screen, waitFor, act} from "@testing-library/react"
import {readdirSync} from "node:fs"
import {rm} from "node:fs/promises"
import {Server} from "mock-socket"
import Holster from "@mblaney/holster/src/holster.js"
import Display from "../Display"

const testUsername = "syncuser"
const testPassword = "syncpassword"
const PORT = 9200
const WS_URL = `ws://localhost:${PORT}`
const feedUrl = "https://example.com/sync-test-feed"
const groupName = "Cross-Device Sync Group"

describe("Display cross-device group sync", () => {
  let userA, userB
  let groupSoulId

  beforeAll(async () => {
    await Promise.all(
      readdirSync("/tmp")
        .filter(f => f.startsWith(`holster-sync-${PORT}`))
        .map(f => rm(`/tmp/${f}`, {recursive: true, force: true})),
    )

    const wss = new Server(WS_URL)
    const server = Holster({wss, file: `/tmp/holster-sync-${PORT}-server`})
    const serverUser = server.user()

    await new Promise((resolve, reject) => {
      serverUser.create(testUsername, testPassword, err => {
        if (err && !err.includes("already exists")) reject(new Error(err))
        else resolve()
      })
    })

    const holsterA = Holster({
      peers: [WS_URL],
      file: `/tmp/holster-sync-${PORT}-a`,
    })
    userA = holsterA.user()
    await new Promise((resolve, reject) => {
      userA.auth(testUsername, testPassword, err => {
        if (err) reject(new Error(err))
        else resolve()
      })
    })

    const holsterB = Holster({
      peers: [WS_URL],
      file: `/tmp/holster-sync-${PORT}-b`,
    })
    userB = holsterB.user()
    await new Promise((resolve, reject) => {
      userB.auth(testUsername, testPassword, err => {
        if (err) reject(new Error(err))
        else resolve()
      })
    })
  }, 15000)

  const displayProps = () => ({
    user: userA,
    host: "localhost",
    code: "test-code",
    mode: "light",
    setMode: vi.fn(),
    feeds: {},
    requestMoreHistory: vi.fn(),
    historyDayLoaded: 0,
    maxHistoryReached: false,
    requestDay: vi.fn(),
  })

  it("shows a group created by Device B on Device A without a reload", async () => {
    render(<Display {...displayProps()} />)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
    })

    // Capture the soul ID as it arrives so the edit test can use it.
    const captureId = new Promise(resolve => {
      const handler = data => {
        if (!data) return
        const id = Object.keys(data).find(k => k !== "_")
        if (id) {
          groupSoulId = id
          userA.get("public").next("groups").off(handler)
          resolve()
        }
      }
      userA.get("public").next("groups").on(handler, true)
    })

    await act(async () => {
      await new Promise((resolve, reject) => {
        userB
          .get("public")
          .next("groups")
          .put(
            {
              name: groupName,
              feeds: {[feedUrl]: true},
              count: 0,
              latest: Date.now(),
              text: "",
              author: "",
              timestamp: Date.now(),
            },
            true,
            err => {
              if (err) reject(new Error(`Group create failed: ${err}`))
              else resolve()
            },
          )
      })
    })

    await act(async () => {
      await captureId
    })

    await waitFor(() => expect(screen.getByText(groupName)).toBeTruthy(), {
      timeout: 5000,
      interval: 200,
    })
  }, 20000)

  it("shows a group name update from Device B on Device A without a reload", async () => {
    const updatedName = "Updated Sync Group"

    render(<Display {...displayProps()} />)

    // The group from the previous test is already in the store. Wait for it to
    // appear so we know Display has subscribed to the group soul listener.
    await waitFor(() => expect(screen.getByText(groupName)).toBeTruthy(), {
      timeout: 5000,
      interval: 200,
    })

    // Give the async rel resolution in holster.js time to move the listener
    // from the groups collection soul onto the actual group soul.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
    })

    await act(async () => {
      await new Promise((resolve, reject) => {
        userB
          .get("public")
          .next("groups")
          .next(groupSoulId)
          .put(
            {
              name: updatedName,
              feeds: {[feedUrl]: true},
              count: 0,
              latest: Date.now(),
              text: "",
              author: "",
              timestamp: Date.now(),
            },
            err => {
              if (err) reject(new Error(`Group update failed: ${err}`))
              else resolve()
            },
          )
      })
    })

    await waitFor(() => expect(screen.getByText(updatedName)).toBeTruthy(), {
      timeout: 5000,
      interval: 200,
    })
  }, 20000)
})
