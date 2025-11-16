import {useState} from "react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import FormControl from "@mui/material/FormControl"
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

const UpdatePassword = ({
  user,
  loggedIn,
  current,
  code,
  reset,
  mode,
  setMode,
}) => {
  const [name, setName] = useState(current ?? "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(loggedIn ? "Already logged in" : "")
  const [disabledButton, setDisabledButton] = useState(loggedIn)

  const update = username => {
    if (!username) {
      setMessage("Please choose a username")
      return
    }

    setDisabledButton(true)
    setMessage("Updating password...")

    user.create(username, password, err => {
      if (err) {
        if (err === "Username already exists") {
          let match = username.match(/^(\w+)\.(\d)$/)
          if (match) {
            let increment = Number(match[2]) + 1
            if (increment === 10) {
              setDisabledButton(false)
              setMessage("Too many password resets")
              return
            }
            update(`${match[1]}.${increment}`)
            return
          }
          update(`${username}.1`)
          return
        }
        setDisabledButton(false)
        setMessage(err)
        return
      }

      user.auth(username, password, err => {
        if (err) {
          setDisabledButton(false)
          setMessage(err)
          return
        }

        fetch(`${window.location.origin}/update-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=utf-8",
          },
          body: JSON.stringify({
            code: code ?? null,
            reset: reset ?? null,
            pub: user.is.pub,
            epub: user.is.epub,
            username: username,
            name: name,
          }),
        })
          .then(res => res.text().then(text => ({ok: res.ok, text: text})))
          .then(res => {
            if (!res.ok) {
              setDisabledButton(false)
              user.delete(username, password)
              setMessage(res.text)
              return
            }

            // The previous public key is returned to copy public user data.
            user.get([res.text, "public"], data => {
              user.get("public").put(data, err => {
                if (err) console.error(err)
              })
            })

            setMessage("Password updated")
            setTimeout(() => {
              setDisabledButton(false)
              window.location = "/login"
            }, 2000)
          })
      })
    })
  }

  return (
    <>
      {loggedIn && <SearchAppBar mode={mode} setMode={setMode} />}
      <Container maxWidth="sm">
        <Grid container>
          <Grid item xs={12}>
            <Card sx={{mt: 2}}>
              <CardContent>
                <Typography variant="h5">Update Password</Typography>
                <TextField
                  id="update-username"
                  label="Username"
                  variant="outlined"
                  fullWidth={true}
                  margin="normal"
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
                <FormControl
                  variant="outlined"
                  fullWidth={true}
                  margin="normal"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                >
                  <InputLabel htmlFor="update-password">Password</InputLabel>
                  <OutlinedInput
                    id="update-password"
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
                <Button
                  sx={{mt: 1}}
                  variant="contained"
                  disabled={disabledButton}
                  onClick={() => update(name)}
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
          </Grid>
        </Grid>
      </Container>
    </>
  )
}

export default UpdatePassword
