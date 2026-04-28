import {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import Holster from "@mblaney/holster/src/holster.js"
import {red} from "@mui/material/colors"
import {ThemeProvider, createTheme} from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import GlobalStyles from "@mui/material/GlobalStyles"
import Display from "./components/Display"
import DebugPanel from "./components/DebugPanel"
import Help from "./components/Help"
import Register from "./components/Register"
import Invite from "./components/Invite"
import Login from "./components/Login"
import Settings from "./components/Settings"
import ValidateEmail from "./components/ValidateEmail"
import ResetPassword from "./components/ResetPassword"
import UpdatePassword from "./components/UpdatePassword"
import {logEvent} from "./utils/debugEvents"

// If on localhost assume Holster is directly available and use the default
// settings, otherwise assume a secure connection is required.
let peers
if (window.location.hostname !== "localhost") {
  peers = ["wss://" + window.location.hostname]
}

const holster = Holster({peers: peers, secure: true, indexedDB: true})
// This provides access to the API via the console.
window.holster = holster

const user = holster.user()
user.recall()

const params = new URLSearchParams(window.location.search)
const pages = [
  "invite",
  "register",
  "login",
  "settings",
  "help",
  "validate-email",
  "reset-password",
  "update-password",
]
const redirect = params.get("redirect")
const to = redirect ? (pages.includes(redirect) ? `/${redirect}` : "/") : ""

const App = () => {
  const getCurrentDay = () => {
    const t = new Date()
    return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
  }

  const [host, setHost] = useState(() => {
    return localStorage.getItem("host") || ""
  })
  const [code] = useState(() => {
    return sessionStorage.getItem("code") || localStorage.getItem("code") || ""
  })
  const [mode, setMode] = useState(() => {
    return sessionStorage.getItem("mode") || "light"
  })
  const [loggedIn] = useState(!!user.is)
  const [feeds, setFeeds] = useState({})
  const [backgroundIndex, setBackgroundIndex] = useState(0)
  const [currentDayOffset, setCurrentDayOffset] = useState(0)
  const [historyDayLoaded, setHistoryDayLoaded] = useState(0)
  const [pendingHistoryRequest, setPendingHistoryRequest] = useState(true)
  const [feedsLoaded, setFeedsLoaded] = useState(false)
  const [accountsReady, setAccountsReady] = useState(false)
  const [hostFeedsProcessed, setHostFeedsProcessed] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [currentDay, setCurrentDay] = useState(getCurrentDay)
  const feedUrlsRef = useRef([])

  useEffect(() => {
    const handler = e => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setDebugMode(d => !d)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Roll over the current day at UTC midnight so item listeners re-register
  // for the new day's data.
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setUTCHours(24, 0, 0, 0)
    const id = setTimeout(
      () => setCurrentDay(getCurrentDay()),
      tomorrow - Date.now() + 100,
    )
    return () => clearTimeout(id)
  }, [currentDay])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: red[900],
          },
          secondary: {
            main: red[500],
          },
        },
        components: {
          MuiDivider: {
            styleOverrides: {
              root: {
                color: red[900],
              },
            },
          },
        },
      }),
    [mode],
  )

  // Fetch host public key if needed
  useEffect(() => {
    if (!host) {
      fetch(`${window.location.origin}/host-public-key`).then(res => {
        if (res.ok) res.text().then(key => setHost(key))
      })
    } else {
      localStorage.setItem("host", host)
    }
  }, [host])

  // Listen to account updates
  useEffect(() => {
    if (!host || !loggedIn) return

    const updateAccounts = async accounts => {
      if (!accounts) return

      setAccountsReady(true)
      logEvent("ACCOUNTS_UPDATED", {count: Object.keys(accounts).length})

      // Check accounts against the users list of contacts.
      const c = await new Promise(res => {
        user.get("public").next("contacts", res)
      })
      if (!c) return

      for (const [accountCode, account] of Object.entries(accounts)) {
        if (!account) continue

        // Only include properties that are present in the account
        let check = {}
        if (account.pub !== undefined) check.pub = account.pub
        if (account.username !== undefined) check.username = account.username
        if (account.name !== undefined) check.name = account.name
        if (account.ref !== undefined) check.ref = account.ref
        if (account.host !== undefined) check.host = account.host

        let found = false
        for (const [contactCode, contact] of Object.entries(c)) {
          if (contactCode !== accountCode) continue

          found = true
          // The account we're checking hasn't changed.
          if (contact.pub === check.pub) break

          // If the public key has changed for this contact then store their
          // new account details and re-share encrypted data with them to
          // help restore their account.
          const err = await new Promise(res => {
            user
              .get("public")
              .next("contacts")
              .next(contactCode)
              .put(check, res)
          })
          if (err) console.error(err)

          const oldEpub = await new Promise(res => {
            user.get([contact.pub, "epub"], res)
          })
          if (!oldEpub) {
            console.error("User not found for old public key")
            break
          }

          const epub = await new Promise(res => {
            user.get([check.pub, "epub"], res)
          })
          if (!epub) {
            console.error("User not found for new public key")
            break
          }

          const shared = await new Promise(res => {
            user.get("shared").next(contactCode, res)
          })
          if (!shared) break

          const oldSecret = await holster.SEA.secret(oldEpub, user.is)
          const secret = await holster.SEA.secret(epub, user.is)
          const update = {}
          for (const [key, oldEnc] of Object.entries(shared)) {
            if (!key) continue

            const data = await holster.SEA.decrypt(oldEnc, oldSecret)
            const enc = await holster.SEA.encrypt(data, secret)
            update[key] = enc
          }
          if (Object.keys(update).length !== 0) {
            const err = await new Promise(res => {
              user.get("shared").next(contactCode).put(update, res)
            })
            if (err) console.error(err)
          }
        }
        // Add the new contact if we referred them.
        if (!found && account.ref === code) {
          user
            .get("public")
            .next("contacts")
            .next(accountCode)
            .put(check, err => {
              if (err) console.error(err)
            })
        }
      }
    }
    user.get([host, "accounts"]).on(updateAccounts, true)

    return () => {
      user.get([host, "accounts"]).off(updateAccounts)
    }
  }, [host, loggedIn, code])

  // Listen to feeds setup
  useEffect(() => {
    if (!host || !loggedIn || !code) return

    const feedHandlers = new Map() // Track feed listener callbacks
    const itemHandlers = new Map() // Track item listener callbacks
    const staggerTimeouts = [] // Track pending stagger timeouts for cleanup

    const setupFeedsListener = userFeeds => {
      if (!userFeeds) return

      if (Object.keys(userFeeds).length === 0) return

      // Store user-specific feed metadata (defaultGroup etc.) in app state so
      // child components can use appFeeds directly without their own Holster
      // listeners.
      setFeeds(f => {
        const updated = {...f}
        for (const [url, feed] of Object.entries(userFeeds)) {
          if (!url || !feed) continue
          updated[url] = {
            ...(updated[url] || {}),
            defaultGroup: feed.defaultGroup ?? "",
          }
        }
        return updated
      })

      // Get the list of active feeds for the user
      const userFeedUrls = Object.keys(userFeeds).filter(
        url => url && (!userFeeds[url] || userFeeds[url].title !== ""),
      )

      // Only reset background processing when the feed URL list changes (feeds
      // added/removed), not metadata updates which also trigger this listener.
      const prevUrls = feedUrlsRef.current
      const urlListChanged =
        userFeedUrls.length !== prevUrls.length ||
        userFeedUrls.some(url => !prevUrls.includes(url))

      if (urlListChanged) {
        setHostFeedsProcessed(false)
        setBackgroundIndex(0)
        setCurrentDayOffset(0)
      }

      // Remove listeners for feeds that are no longer active
      for (const [url, handler] of feedHandlers.entries()) {
        if (!userFeedUrls.includes(url)) {
          user.get([host, "feeds"]).next(url).off(handler)
          feedHandlers.delete(url)
        }
      }
      for (const [url, handler] of itemHandlers.entries()) {
        if (!userFeedUrls.includes(url)) {
          const currentDay = getCurrentDay()
          user.get([host, "feedItems"]).next(url).next(currentDay).off(handler)
          itemHandlers.delete(url)
        }
      }

      // Set up listeners for each of the feeds, staggered to avoid
      // flooding the connection on cold start (no IndexedDB data).
      const settling = {count: 0}
      const settledUrls = new Set()
      let newFeedIndex = 0
      for (const url of userFeedUrls) {
        if (feedHandlers.has(url)) {
          continue // Already listening
        }

        const feedHandler = async hostFeed => {
          if (!hostFeed || !hostFeed.title) return

          // Update feed in local state
          setFeeds(f => ({
            ...f,
            [url]: {
              ...f[url],
              url: hostFeed.html_url,
              title: hostFeed.title,
              image: hostFeed.image,
              description: hostFeed.description ?? "",
              language: hostFeed.language ?? "",
            },
          }))
          logEvent("FEED_UPDATED", {url, title: hostFeed.title})

          // Update user's personal feed data
          const userData = await new Promise(res => {
            user.get("public").next("feeds").next(url, res)
          })

          const data = {
            title: hostFeed.title,
            description: hostFeed.description ?? "",
            html_url: hostFeed.html_url ?? "",
            language: hostFeed.language ?? "",
            image: hostFeed.image ?? "",
          }

          const hasChanged =
            !userData ||
            userData.title !== data.title ||
            userData.description !== data.description ||
            userData.html_url !== data.html_url ||
            userData.language !== data.language ||
            userData.image !== data.image

          if (hasChanged) {
            const err = await new Promise(res => {
              user.get("public").next("feeds").next(url).put(data, res)
            })
            if (err) console.error(err)
          }
        }

        // Listen for item updates for the current day
        const itemHandler = items => {
          if (!settledUrls.has(url)) {
            settledUrls.add(url)
            settling.count++
            if (settling.count === userFeedUrls.length) {
              setFeedsLoaded(true)
              logEvent("FEEDS_LOADED", {count: userFeedUrls.length})
            }
          }

          if (!items) return

          setFeeds(f => {
            const currentFeed = f[url] || {
              url: "",
              title: "",
              image: "",
            }
            return {
              ...f,
              [url]: {
                ...currentFeed,
                updated: Date.now(),
                items: {
                  ...(currentFeed.items || {}),
                  [currentDay]: items,
                },
              },
            }
          })
          logEvent("ITEMS_UPDATED", {
            url,
            day: currentDay,
            count: Object.keys(items).length,
          })
        }

        // Register handlers in maps immediately to prevent duplicate setup,
        // but delay the actual .on() calls to stagger connection requests.
        feedHandlers.set(url, feedHandler)
        itemHandlers.set(url, itemHandler)
        const staggerDelay = (newFeedIndex + 1) * 100
        newFeedIndex++
        const timeoutId = setTimeout(() => {
          // Skip if this feed was removed before the timeout fired
          if (!feedHandlers.has(url)) return
          user.get([host, "feeds"]).next(url).on(feedHandler, true)
          user
            .get([host, "feedItems"])
            .next(url)
            .next(currentDay)
            .on(itemHandler, true)
        }, staggerDelay)
        staggerTimeouts.push(timeoutId)
      }

      // Update feedUrlsRef for background loading
      feedUrlsRef.current = userFeedUrls
      if (urlListChanged) {
        setHostFeedsProcessed(true)
        logEvent("HOST_FEEDS_PROCESSED", {count: userFeedUrls.length})
      }
    }

    user.get("public").next("feeds").on(setupFeedsListener, true)

    return () => {
      // Cancel any pending stagger timeouts
      staggerTimeouts.forEach(id => clearTimeout(id))

      // Clean up all listeners
      user.get("public").next("feeds").off(setupFeedsListener)

      for (const [url, handler] of feedHandlers.entries()) {
        user.get([host, "feeds"]).next(url).off(handler)
      }

      for (const [url, handler] of itemHandlers.entries()) {
        user.get([host, "feedItems"]).next(url).next(currentDay).off(handler)
      }
    }
  }, [host, loggedIn, code, currentDay])

  // Handle feed removal
  useEffect(() => {
    if (!host || !loggedIn || !code) return

    const handleAllFeeds = async allFeeds => {
      if (!allFeeds) return

      for (const [url, feed] of Object.entries(allFeeds)) {
        if (!url || !feed) continue

        if (feed.title === "") {
          // Check user's personal feed record
          const userFeed = await new Promise(res => {
            user.get("public").next("feeds").next(url, res)
          })

          // If user's feed is not yet marked as removed, do so now
          if (userFeed && userFeed.title !== "") {
            await new Promise(res => {
              user.get("public").next("feeds").next(url).put({title: ""}, res)
            })

            // Remove from state
            setFeeds(f => {
              const newFeeds = {...f}
              delete newFeeds[url]
              return newFeeds
            })

            // Notify server to lower subscriber count
            try {
              const signedUrl = await holster.SEA.sign(url, user.is)
              const res = await fetch(
                `${window.location.origin}/remove-subscriber`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json;charset=utf-8",
                  },
                  body: JSON.stringify({code: code, url: signedUrl}),
                },
              )
              if (!res.ok) {
                console.error(res)
              }
            } catch (error) {
              console.error(error)
            }
          }
        }
      }
    }

    user.get([host, "feeds"]).on(handleAllFeeds, true)

    return () => {
      user.get([host, "feeds"]).off(handleAllFeeds)
    }
  }, [host, loggedIn, code])

  // Processes days sequentially across all URLs with rate limiting.
  // Only advances to the next day when requested via requestMoreHistory.
  useEffect(() => {
    if (!hostFeedsProcessed || !feedsLoaded || currentDayOffset > 14) return
    if (!pendingHistoryRequest) return

    const currentUrl = feedUrlsRef.current[backgroundIndex]
    if (!currentUrl) return

    // Calculate the day to fetch for current offset
    const currentDay = getCurrentDay()
    const dayToFetch = currentDay - currentDayOffset * 86400000

    // Fetch the specific day's items for this URL
    logEvent("BG_REQUEST", {
      url: currentUrl,
      day: new Date(dayToFetch).toDateString(),
    })
    user
      .get([host, "feedItems"])
      .next(currentUrl)
      .next(dayToFetch, dayItems => {
        logEvent("BG_RESPONSE", {
          url: currentUrl,
          day: new Date(dayToFetch).toDateString(),
          items: dayItems ? Object.keys(dayItems).length : null,
        })
        if (dayItems) {
          setFeeds(f => {
            const currentFeed = f[currentUrl] || {url: "", title: "", image: ""}
            return {
              ...f,
              [currentUrl]: {
                ...currentFeed,
                items: {
                  ...(currentFeed.items || {}),
                  [dayToFetch]: dayItems,
                },
              },
            }
          })
        }

        // Move to next URL, or finish this day if all URLs processed
        if (backgroundIndex + 1 < feedUrlsRef.current.length) {
          setBackgroundIndex(index => index + 1)
        } else {
          // All URLs processed for this day — signal and wait for next request
          setCurrentDayOffset(offset => offset + 1)
          setBackgroundIndex(0)
          setHistoryDayLoaded(n => n + 1)
          // Auto-load 3 days before requiring scrollback to trigger more
          if (currentDayOffset > 1) {
            setPendingHistoryRequest(false)
          }
        }
      })
  }, [
    hostFeedsProcessed,
    feedsLoaded,
    backgroundIndex,
    currentDayOffset,
    pendingHistoryRequest,
    host,
  ])

  const requestMoreHistory = useCallback(() => {
    setPendingHistoryRequest(true)
  }, [])

  // When the app becomes visible again, catch up on any feed items that may
  // have been missed while the browser throttled the background tab or while
  // the user was in another application.
  // Also updates currentDay in case midnight passed while hidden.
  useEffect(() => {
    if (!host || !loggedIn) return

    let catchUpTimer = null
    const catchUp = () => {
      // Advance the day if midnight passed while away.
      // getCurrentDay() is stable if the day hasn't changed, so this is safe.
      setCurrentDay(getCurrentDay())

      // Re-fetch today's items for all active feeds to catch up.
      const today = getCurrentDay()
      for (const url of feedUrlsRef.current) {
        user
          .get([host, "feedItems"])
          .next(url)
          .next(today, items => {
            if (!items) return
            setFeeds(f => {
              const currentFeed = f[url] || {url: "", title: "", image: ""}
              return {
                ...f,
                [url]: {
                  ...currentFeed,
                  updated: Date.now(),
                  items: {
                    ...(currentFeed.items || {}),
                    [today]: items,
                  },
                },
              }
            })
          })
      }
    }

    // Multiple events can fire together when returning to the app, so debounce
    // to avoid sending redundant wire requests for each event.
    const debouncedCatchUp = () => {
      clearTimeout(catchUpTimer)
      catchUpTimer = setTimeout(catchUp, 300)
    }

    // visibilitychange covers: tab switching, minimise/restore, mobile app switching.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") debouncedCatchUp()
    }

    // focus covers: desktop PWA app switching where the window stays rendered
    // but loses focus (visibilitychange may not fire in that case).
    // pageshow covers: iOS PWA returning from background (more reliable than
    // visibilitychange on iOS, also fires from BFCache restores).
    // online covers: returning from offline / network reconnection.
    window.addEventListener("focus", debouncedCatchUp)
    window.addEventListener("pageshow", debouncedCatchUp)
    window.addEventListener("online", debouncedCatchUp)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      clearTimeout(catchUpTimer)
      window.removeEventListener("focus", debouncedCatchUp)
      window.removeEventListener("pageshow", debouncedCatchUp)
      window.removeEventListener("online", debouncedCatchUp)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [host, loggedIn])

  // Directly fetch a specific day for all given feed URLs. Used to pre-load
  // the day containing group.latest when a group's data arrives from Holster,
  // so the item is ready before the user opens the group.
  const requestDay = useCallback(
    (dayKey, feedUrls) => {
      if (!feedUrls || feedUrls.length === 0) return
      for (const url of feedUrls) {
        user
          .get([host, "feedItems"])
          .next(url)
          .next(dayKey, dayItems => {
            if (!dayItems) return
            setFeeds(f => {
              const currentFeed = f[url] || {url: "", title: "", image: ""}
              return {
                ...f,
                [url]: {
                  ...currentFeed,
                  items: {
                    ...(currentFeed.items || {}),
                    [dayKey]: dayItems,
                  },
                },
              }
            })
          })
      }
    },
    [host],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={theme => ({
          a: {color: theme.palette.text.secondary},
          blockquote: {
            borderLeft: `4px solid ${theme.palette.divider}`,
            color: theme.palette.text.secondary,
            paddingLeft: theme.spacing(2),
            marginLeft: 0,
            marginRight: 0,
          },
        })}
      />
      <BrowserRouter>
        <div
          style={debugMode ? {height: "60vh", overflowY: "auto"} : undefined}
        >
          <Routes>
            <Route
              path="/invite"
              element={
                <Invite loggedIn={user.is} mode={mode} setMode={setMode} />
              }
            />
            <Route
              path="/register"
              element={<Register user={user} mode={mode} setMode={setMode} />}
            />
            <Route
              path="/login"
              element={
                <Login user={user} host={host} mode={mode} setMode={setMode} />
              }
            />
            <Route
              path="/validate-email"
              element={
                <ValidateEmail
                  loggedIn={user.is}
                  mode={mode}
                  setMode={setMode}
                  code={params.get("code")}
                  validate={params.get("validate")}
                />
              }
            />
            <Route
              path="/reset-password"
              element={
                <ResetPassword
                  loggedIn={user.is}
                  mode={mode}
                  setMode={setMode}
                />
              }
            />
            <Route
              path="/update-password"
              element={
                <UpdatePassword
                  user={user}
                  current={params.get("username")}
                  code={params.get("code")}
                  reset={params.get("reset")}
                  mode={mode}
                  setMode={setMode}
                />
              }
            />
            <Route
              path="/settings"
              element={
                user.is ? (
                  <Settings
                    user={user}
                    host={host}
                    code={code}
                    mode={mode}
                    setMode={setMode}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/help"
              element={
                <Help loggedIn={user.is} mode={mode} setMode={setMode} />
              }
            />
            <Route
              path="/"
              element={
                to ? (
                  <Navigate to={to} />
                ) : user.is ? (
                  <Display
                    user={user}
                    host={host}
                    code={code}
                    mode={mode}
                    setMode={setMode}
                    feeds={feeds}
                    debugMode={debugMode}
                    requestMoreHistory={requestMoreHistory}
                    historyDayLoaded={historyDayLoaded}
                    maxHistoryReached={currentDayOffset > 14}
                    requestDay={requestDay}
                  />
                ) : (
                  <Help />
                )
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
      {debugMode && (
        <DebugPanel
          user={user}
          host={host}
          feeds={feeds}
          accountsReady={accountsReady}
          feedsLoaded={feedsLoaded}
          hostFeedsProcessed={hostFeedsProcessed}
          backgroundIndex={backgroundIndex}
          currentDayOffset={currentDayOffset}
        />
      )}
    </ThemeProvider>
  )
}

export default App
