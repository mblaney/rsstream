import {useCallback, useEffect, useState} from "react"
import {grey} from "@mui/material/colors"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import FilledInput from "@mui/material/FilledInput"
import FormControl from "@mui/material/FormControl"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import InputLabel from "@mui/material/InputLabel"
import Link from "@mui/material/Link"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import OutlinedInput from "@mui/material/OutlinedInput"
import Typography from "@mui/material/Typography"
import ContentCopy from "@mui/icons-material/ContentCopy"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import {buildDate} from "../utils/buildDate.js"
import EditCache from "./EditCache"
import SearchAppBar from "./SearchAppBar"

const Settings = ({user, host, code, mode, setMode}) => {
  const [name] = useState(() => {
    return sessionStorage.getItem("name") || localStorage.getItem("name") || ""
  })
  const [invites, setInvites] = useState([])
  const [account, setAccount] = useState(null)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [disabledButton, setDisabledButton] = useState(false)
  const [cacheData, setCacheData] = useState(null)

  useEffect(() => {
    if (!user || !host || !code) return

    const updated = new Map()
    let secret = null

    const update = async codes => {
      if (!codes || !secret) return

      for (const [key, enc] of Object.entries(codes)) {
        if (!key) continue

        if (enc) {
          updated.set(key, {
            key: key,
            code: await user.SEA.decrypt(enc, secret),
          })
        } else {
          updated.delete(key)
        }
      }
      setInvites([...updated.values()])
    }

    user.get([host, "epub"], async epub => {
      if (!epub) {
        console.error("No epub for host!")
        return
      }

      secret = await user.SEA.secret({epub: epub}, user.is)
      user
        .get([host, "shared"])
        .next("invite_codes")
        .next(code)
        .on(update, true)
    })

    return () => {
      user.get([host, "shared"]).next("invite_codes").next(code).off(update)
    }
  }, [user, host, code])

  useEffect(() => {
    if (!user || !host || !code) return

    const updateAccount = acc => {
      if (acc) setAccount(acc)
    }

    user.get([host, "accounts"]).next(code).on(updateAccount, true)

    return () => {
      user.get([host, "accounts"]).next(code).off(updateAccount)
    }
  }, [user, host, code])

  const loadCacheData = useCallback(async () => {
    if (!("caches" in window)) return

    const loadCache = async name => {
      if (!(await caches.has(name))) return {count: 0, size: 0, items: []}
      const cache = await caches.open(name)
      const keys = await cache.keys()
      let totalSize = 0
      const items = []
      for (const request of keys) {
        const response = await cache.match(request)
        const cl = response?.headers.get("content-length")
        const size = cl ? parseInt(cl, 10) : 0
        const name = response?.headers.get("x-cache-name") || null
        totalSize += size
        items.push({url: request.url, size, name})
      }
      items.sort((a, b) => b.size - a.size)
      return {count: keys.length, size: totalSize, items}
    }

    const [audio, video] = await Promise.all([
      loadCache("audio"),
      loadCache("video"),
    ])
    setCacheData({audio, video})
  }, [])

  useEffect(() => {
    loadCacheData()
  }, [loadCacheData])

  const removeItem = async (cacheName, url) => {
    const cache = await caches.open(cacheName)
    await cache.delete(url)
    loadCacheData()
  }

  const clearCache = async cacheName => {
    await caches.delete(cacheName)
    loadCacheData()
  }

  const select = target => {
    const li = target.closest("li")
    if (li && li.childNodes[0].childNodes[0].nodeName === "INPUT") {
      li.childNodes[0].childNodes[0].select()
    } else {
      console.error("not input field", li.childNodes[0].childNodes[0].nodeName)
      console.log("parent li", li)
    }
  }

  const changePassword = () => {
    if (!password) {
      setMessage("Please provide your current password")
      return
    }

    if (!newPassword) {
      setMessage("Please provide a new password")
      return
    }

    setDisabledButton(true)
    setMessage("Updating password...")
    user.change(user.is.username, password, newPassword, err => {
      setDisabledButton(false)
      if (err) {
        setMessage(err)
      } else {
        setMessage("Password updated")
      }
    })
  }

  return (
    <>
      {user.is && (
        <SearchAppBar page="settings" mode={mode} setMode={setMode} />
      )}
      <Container maxWidth="sm">
        <Grid container>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography sx={{m: 1}}>
                  {name
                    ? "Hello " + name
                    : "Account not found. Please try logging in again."}
                </Typography>
                {invites.length > 0 && (
                  <>
                    <Typography sx={{m: 1}}>
                      You have <strong>{invites.length}</strong> invite code
                      {invites.length > 1 ? "s" : ""} you can share
                    </Typography>
                    <List dense={true} sx={{maxHeight: 300, overflow: "auto"}}>
                      {invites.map(invite => (
                        <ListItem key={invite.key}>
                          <FilledInput
                            defaultValue={invite.code}
                            readOnly={true}
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton
                                  edge="end"
                                  aria-label="copy invite code"
                                  onClick={event => select(event.target)}
                                >
                                  <ContentCopy />
                                </IconButton>
                              </InputAdornment>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
                {account && account.feeds && (
                  <Typography sx={{m: 1}}>
                    {(account.subscribed ?? 0) >= account.feeds ? (
                      "No more feeds can be subscribed to"
                    ) : (
                      <>
                        <strong>
                          {account.feeds - (account.subscribed ?? 0)}/
                          {account.feeds}
                        </strong>{" "}
                        feeds can be subscribed to
                      </>
                    )}
                  </Typography>
                )}
                <Typography sx={{m: 1}}>
                  <Link href="https://github.com/sponsors/mblaney">
                    Sponsor the project
                  </Link>{" "}
                  to add invite codes and feeds
                </Typography>
              </CardContent>
            </Card>
            <EditCache
              cacheData={cacheData}
              removeItem={removeItem}
              clearCache={clearCache}
            />
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography sx={{m: 1}}>
                  Use this form to change your password
                </Typography>
                <FormControl
                  variant="outlined"
                  fullWidth={true}
                  margin="normal"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                >
                  <InputLabel htmlFor="settings-password">
                    Current Password
                  </InputLabel>
                  <OutlinedInput
                    id="settings-password"
                    autoComplete="password"
                    type={showPassword ? "text" : "password"}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(show => !show)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Current Password"
                  />
                </FormControl>
                <FormControl
                  variant="outlined"
                  fullWidth={true}
                  margin="normal"
                  value={newPassword}
                  onChange={event => setNewPassword(event.target.value)}
                >
                  <InputLabel htmlFor="settings-password">
                    New Password
                  </InputLabel>
                  <OutlinedInput
                    id="settings-new-password"
                    autoComplete="new-password"
                    type={showNewPassword ? "text" : "password"}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={() => setShowNewPassword(show => !show)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="New Password"
                  />
                </FormControl>
                <Button
                  sx={{mt: 1}}
                  variant="contained"
                  disabled={disabledButton}
                  onClick={changePassword}
                >
                  Submit
                </Button>
                {message && (
                  <Typography sx={{m: 1}} variant="string">
                    {message}
                  </Typography>
                )}
              </CardContent>
            </Card>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography sx={{m: 1}}>Log out of your account</Typography>
                <Button
                  sx={{mt: 1}}
                  variant="contained"
                  onClick={() => {
                    user.leave()
                    sessionStorage.removeItem("name")
                    sessionStorage.removeItem("code")
                    localStorage.removeItem("name")
                    localStorage.removeItem("code")
                    window.location = "/login"
                  }}
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
            <Typography sx={{m: 1, color: grey[400]}}>
              Build date: {buildDate}
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}

export default Settings
