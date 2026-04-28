import {useRef, useState} from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Checkbox from "@mui/material/Checkbox"
import Container from "@mui/material/Container"
import FormControl from "@mui/material/FormControl"
import FormControlLabel from "@mui/material/FormControlLabel"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import InputLabel from "@mui/material/InputLabel"
import OutlinedInput from "@mui/material/OutlinedInput"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import SearchAppBar from "./SearchAppBar"

const Login = ({user, host, mode, setMode}) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [stayLoggedIn, setStayLoggedIn] = useState(false)
  const [message, setMessage] = useState(user.is ? "Already logged in" : "")
  const [disabledButton, setDisabledButton] = useState(user.is)
  const found = useRef(false)

  const checkAccount = async () => {
    if (!user.is) return

    setMessage("Credentials verified, looking up account...")
    const code = await new Promise(res => {
      user.get([host, "map"]).next("account:" + user.is.pub, res)
    })
    if (!code) return

    setMessage("Account found, verifying details...")
    const account = await new Promise(res => {
      user.get([host, "accounts"]).next(code, res)
    })
    if (!account) return

    if (account.pub !== user.is.pub) {
      // Previous account can be returned if user remembers their old password.
      return "Wrong username or password"
    }

    found.current = true
    sessionStorage.setItem("code", code)
    sessionStorage.setItem("name", account.name)
  }

  const login = u => {
    if (!user || !host) {
      setMessage("Host not available")
      localStorage.removeItem("host")
      setTimeout(() => window.location.reload(), 1000)
      return
    }

    setDisabledButton(true)
    setMessage("Verifying credentials...")
    user.auth(u, password, async err => {
      if (!err) {
        // auth is ok so look up account details in host data.
        err = await checkAccount()
        if (found.current) {
          user.store(stayLoggedIn)
          if (stayLoggedIn) {
            localStorage.setItem("code", sessionStorage.getItem("code"))
            localStorage.setItem("name", sessionStorage.getItem("name"))
          }
          window.location = "/"
          return
        }

        if (!err) {
          setDisabledButton(false)
          setMessage("Account not found. Please try logging in again")
          // Remove db and resync in case there's a problem with local data.
          window.indexedDB.deleteDatabase("radata")
          localStorage.removeItem("host")
          setTimeout(() => window.location.reload(), 2000)
          user.leave()
          return
        }
      }

      if (err === "Wrong username or password") {
        let match = u.match(/(.*)\.(\d)$/)
        if (match) {
          let increment = Number(match[2]) + 1
          if (increment === 10) {
            setDisabledButton(false)
            setMessage("Wrong username or password")
            return
          }
          setMessage(`Trying username variant ${match[1]}.${increment}...`)
          login(`${match[1]}.${increment}`)
          return
        }
        setMessage(`Trying username variant ${u}.1...`)
        login(`${u}.1`)
        return
      }

      setDisabledButton(false)
      setMessage("Wrong username or password")
    })
  }

  return (
    <>
      {user.is && <SearchAppBar mode={mode} setMode={setMode} />}
      <Container maxWidth="sm">
        <Grid container>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography variant="h5">Login</Typography>
                <TextField
                  id="login-username"
                  label="Username"
                  variant="outlined"
                  fullWidth={true}
                  margin="normal"
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  InputLabelProps={{shrink: true}}
                />
                <FormControl
                  variant="outlined"
                  fullWidth={true}
                  margin="normal"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                >
                  <InputLabel htmlFor="login-password">Password</InputLabel>
                  <OutlinedInput
                    id="login-password"
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
                    label="Password"
                  />
                </FormControl>
                <Box sx={{display: "flex", alignItems: "center", mt: 1}}>
                  {!user.is && !message && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={stayLoggedIn}
                          onChange={e => setStayLoggedIn(e.target.checked)}
                        />
                      }
                      label="Stay logged in"
                    />
                  )}
                  {message && (
                    <Typography variant="body2">{message}</Typography>
                  )}
                  <Button
                    sx={{ml: "auto"}}
                    variant="contained"
                    disabled={disabledButton}
                    onClick={() => login(username)}
                  >
                    Submit
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}

export default Login
