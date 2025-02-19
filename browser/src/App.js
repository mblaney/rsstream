import {useEffect, useMemo, useState} from "react"
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
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
import "./App.css"

import Gun from "gun"
require("gun/lib/radix.js")
require("gun/lib/radisk.js")
require("gun/lib/store.js")
require("gun/lib/rindexed.js")
require("gun/lib/then.js")
require("gun/sea")

const gun = Gun({
  // Assume Gun is directly available on localhost, otherwise reverse proxy.
  peers: [
    window.location.hostname === "localhost"
      ? "http://localhost:8765/gun"
      : window.location.origin + "/gun",
  ],
  axe: false,
  secure: true,
  localStorage: false,
  store: window.RindexedDB(),
})

const user = gun.user().recall({sessionStorage: true})
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
  const [host, setHost] = useState(null)
  const [pub, setPub] = useState(() => {
    return localStorage.getItem("pub") || ""
  })
  const [code] = useState(() => {
    return sessionStorage.getItem("code") || ""
  })
  const [mode, setMode] = useState(() => {
    return sessionStorage.getItem("mode") || "light"
  })
  const [feeds, setFeeds] = useState(new Map())
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
    if (!pub) {
      fetch(`${window.location.origin}/host-public-key`).then(res => {
        if (res.ok) res.text().then(key => setPub(key))
      })
      return
    }

    setHost(gun.user(pub))
    localStorage.setItem("pub", pub)
    if (!user.is) return

    const updateAccount = (account, accountCode) => {
      if (!account) return

      let check = {
        pub: account.pub,
        alias: account.alias,
        name: account.name,
        ref: account.ref,
        host: account.host,
      }
      // Check this account against the users list of contacts.
      const contacts = user.get("public").get("contacts")
      contacts.once(async c => {
        if (c) delete c._
        let found = false
        for (const contactCode of Object.keys(c ?? {})) {
          if (contactCode !== accountCode) continue

          found = true
          const contact = await contacts.get(contactCode).then()
          if (contact.pub === check.pub) break

          // If the public key has changed for this contact then store their
          // new account details and re-share encrypted data with them to
          // help restore their account.
          contacts.get(contactCode).put(check, ack => {
            if (ack.err) console.error(ack.err)
          })
          gun
            .user(contact.pub)
            .get("epub")
            .once(oldEPub => {
              if (!oldEPub) {
                console.error("User not found for old public key")
                return
              }

              gun
                .user(check.pub)
                .get("epub")
                .once(epub => {
                  if (!epub) {
                    console.error("User not found for new public key")
                    return
                  }

                  const shared = user.get("shared").get(contactCode)
                  shared.once(async s => {
                    if (!s) return

                    delete s._
                    const oldSecret = await Gun.SEA.secret(oldEPub, user._.sea)
                    const secret = await Gun.SEA.secret(epub, user._.sea)
                    for (const key of Object.keys(s)) {
                      if (!key) continue

                      const oldEnc = await shared.get(key).then()
                      let data = await Gun.SEA.decrypt(oldEnc, oldSecret)
                      let enc = await Gun.SEA.encrypt(data, secret)
                      shared.get(key).put(enc, ack => {
                        if (ack.err) console.error(ack.err)
                      })
                    }
                  })
                })
            })
          break
        }
        // Add the new contact if we referred them.
        if (!found && account.ref === code) {
          contacts.get(accountCode).put(check, ack => {
            if (ack.err) console.error(ack.err)
          })
        }
      })
    }
    // Listen for account changes to add new contacts, update existing contacts.
    gun.user(pub).get("accounts").map().on(updateAccount)

    const updateFeed = (feed, url) => {
      if (!url) return

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
      const userFeed = user.get("public").get("feeds").get(url)
      userFeed.once(found => {
        if (!found || found.title === "") return

        if (feed && feed.title !== "") {
          // Feed details have been updated.
          const data = {
            title: feed.title,
            description: feed.description,
            html_url: feed.html_url,
            language: feed.language,
            image: feed.image,
          }
          userFeed.put(data, ack => {
            if (ack.err) console.error(ack.err)
          })
          return
        }

        // Otherwise the feed was removed.
        userFeed.put({title: ""}, async ack => {
          if (ack.err) {
            console.error(ack.err)
            return
          }

          // Request to lower account subscribed count when a feed is removed.
          try {
            const signedUrl = await Gun.SEA.sign(url, user._.sea)
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
        })
      })
    }
    // Listen for feed changes to apply to our own feed list.
    gun.user(pub).get("feeds").map().once(updateFeed)
    gun.user(pub).get("feeds").map().on(updateFeed)
  }, [pub, code])

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
            element={
              <Register loggedIn={user.is} mode={mode} setMode={setMode} />
            }
          />
          <Route
            path="/login"
            element={
              <Login host={host} user={user} mode={mode} setMode={setMode} />
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
                loggedIn={user.is}
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
                  host={host}
                  user={user}
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
                  host={host}
                  user={user}
                  code={code}
                  mode={mode}
                  setMode={setMode}
                  feeds={feeds}
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
