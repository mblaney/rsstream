import {useEffect, useState} from "react"
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
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import OutlinedInput from "@mui/material/OutlinedInput"
import Typography from "@mui/material/Typography"
import ContentCopy from "@mui/icons-material/ContentCopy"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import {buildDate} from "../utils/buildDate.js"
import SearchAppBar from "./SearchAppBar"

const Settings = ({user, host, code, mode, setMode}) => {
  const [name] = useState(() => {
    return sessionStorage.getItem("name") || ""
  })
  const [invites, setInvites] = useState([])
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [disabledButton, setDisabledButton] = useState(false)

  useEffect(() => {
    if (!user || !host || !code) return

    const updated = new Map()
    user.get([host, "epub"], async epub => {
      if (!epub) {
        console.error("No epub for host!")
        return
      }

      const secret = await user.SEA.secret({epub: epub}, user.is)
      const update = async codes => {
        if (!codes) return

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
      user
        .get([host, "shared"])
        .next("invite_codes")
        .next(code)
        .on(update, true)
    })
  }, [user, host, code])

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
                {invites.length !== 0 && (
                  <Typography sx={{m: 1}}>
                    You have {invites.length} invite code
                    {invites.length > 1 && "s"} you can share
                  </Typography>
                )}
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
              </CardContent>
            </Card>
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
