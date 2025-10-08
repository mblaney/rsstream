import {useEffect, useMemo, useState} from "react"
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import Holster from "@mblaney/holster/src/holster.js"
import {red} from "@mui/material/colors"
import {ThemeProvider, createTheme} from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import Display from "./components/Display"
import Help from "./components/Help"
import Register from "./components/Register"
import Invite from "./components/Invite"
import Login from "./components/Login"
import Settings from "./components/Settings"
import ValidateEmail from "./components/ValidateEmail"
import ResetPassword from "./components/ResetPassword"
import UpdatePassword from "./components/UpdatePassword"

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
    return sessionStorage.getItem("code") || ""
  })
  const [mode, setMode] = useState(() => {
    return sessionStorage.getItem("mode") || "light"
  })
  const [feeds, setFeeds] = useState(new Map())
  const [feedsLoaded, setFeedsLoaded] = useState(false)
  const [loadedFeedUrls, setLoadedFeedUrls] = useState(new Set())
  const [allFeedUrls, setAllFeedUrls] = useState(new Set())
  const [backgroundUrls, setBackgroundUrls] = useState([])
  const [backgroundIndex, setBackgroundIndex] = useState(0)
  const [currentDayOffset, setCurrentDayOffset] = useState(1)
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

  useEffect(() => {
    if (!host) {
      fetch(`${window.location.origin}/host-public-key`).then(res => {
        if (res.ok) res.text().then(key => setHost(key))
      })
      return
    }

    localStorage.setItem("host", host)
    if (!user.is) return

    const updateAccounts = async accounts => {
      if (!accounts) return

      // Check accounts against the users list of contacts.
      const c = await new Promise(res => {
        user.get("public").next("contacts", res)
      })
      if (!c) return

      for (const [accountCode, account] of Object.entries(accounts)) {
        if (!account) continue

        let check = {
          pub: account.pub,
          username: account.username,
          name: account.name,
          ref: account.ref,
          host: account.host,
        }

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

    const updateFeeds = async allFeeds => {
      if (!allFeeds) return

      // Track all feed URLs that should be loaded
      setAllFeedUrls(new Set(Object.keys(allFeeds)))

      for (const [url, feed] of Object.entries(allFeeds)) {
        if (!url) continue

        if (feed && feed.title !== "") {
          setFeeds(
            f =>
              new Map(
                f.set(url, {
                  url: feed.html_url,
                  title: feed.title,
                  image: feed.image,
                }),
              ),
          )
        }
        const found = await new Promise(res => {
          user.get("public").next("feeds").next(url, res)
        })
        if (!found || found.title === "") continue

        if (feed && feed.title) {
          // Feed details have been updated.
          const data = {
            title: feed.title,
            description: feed.description ?? "",
            html_url: feed.html_url ?? "",
            language: feed.language ?? "",
            image: feed.image ?? "",
          }
          const err = await new Promise(res => {
            user.get("public").next("feeds").next(url).put(data, res)
          })
          if (err) console.error(err)

          // Also set up a listener for updates to items in the feed. Only fetch
          // the current day's items to avoid over-fetching historical data
          const currentDay = getCurrentDay()
          user
            .get([host, "feedItems"])
            .next(url)
            .next(currentDay)
            .on(items => {
              // Mark this feed as loaded
              setLoadedFeedUrls(loaded => new Set(loaded).add(url))

              if (!items) return

              setFeeds(
                f =>
                  new Map(
                    f.set(url, {
                      url: feed.html_url,
                      title: feed.title,
                      image: feed.image,
                      updated: Date.now(),
                      items: {[currentDay]: items},
                    }),
                  ),
              )
              // Add URL for background loading of previous 14 days
              setBackgroundUrls(urls =>
                urls.includes(url) ? urls : [...urls, url],
              )
            }, true)
          continue
        }

        // Otherwise the feed was removed.
        const err = await new Promise(res => {
          user.get("public").next("feeds").next(url).put({title: ""}, res)
        })
        if (err) {
          console.error(err)
          continue
        }

        // Request to lower subscribed count when a feed is removed.
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
    // Listen for feed changes to apply to our own feed list.
    user.get([host, "feeds"]).on(updateFeeds, true)
  }, [host, code])

  // Check if all feeds are loaded
  useEffect(() => {
    if (allFeedUrls.size > 0 && loadedFeedUrls.size === allFeedUrls.size) {
      setFeedsLoaded(true)
    }
  }, [loadedFeedUrls, allFeedUrls])

  // Processes days sequentially across all URLs with rate limiting.
  useEffect(() => {
    if (backgroundUrls.length === 0 || currentDayOffset > 14) return

    // Add delay to respect rate limits
    const delayTimer = setTimeout(() => {
      const currentUrl = backgroundUrls[backgroundIndex]

      // Calculate the day to fetch for current offset
      const currentDay = getCurrentDay()
      const dayToFetch = currentDay - currentDayOffset * 86400000

      // Fetch the specific day's items for this URL
      user
        .get([host, "feedItems"])
        .next(currentUrl)
        .next(dayToFetch)
        .next(dayItems => {
          if (dayItems) {
            setFeeds(f => {
              const currentFeed = f.get(currentUrl)
              if (!currentFeed) return f

              return new Map(
                f.set(currentUrl, {
                  ...currentFeed,
                  items: {
                    ...currentFeed.items,
                    [dayToFetch]: dayItems,
                  },
                }),
              )
            })
          }

          // Move to next URL, or next day if all URLs processed
          if (backgroundIndex + 1 < backgroundUrls.length) {
            setBackgroundIndex(index => index + 1)
          } else {
            // All URLs processed for this day, move to next day
            setCurrentDayOffset(offset => offset + 1)
            setBackgroundIndex(0)
          }
        })
    }, 2000)

    return () => clearTimeout(delayTimer)
  }, [backgroundUrls, backgroundIndex, currentDayOffset, host])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
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
              <ResetPassword loggedIn={user.is} mode={mode} setMode={setMode} />
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
            element={<Help loggedIn={user.is} mode={mode} setMode={setMode} />}
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
                  feedsLoaded={feedsLoaded}
                />
              ) : (
                <Help />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
