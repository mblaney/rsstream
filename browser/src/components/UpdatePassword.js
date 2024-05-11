import { useState } from "react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
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

import Gun from "gun"
require("gun/lib/radix.js")
require("gun/lib/radisk.js")
require("gun/lib/store.js")
require("gun/lib/rindexed.js")
require("gun/sea")

const gun = Gun({
  peers: [`${window.location.protocol}//${window.location.hostname}:8765/gun`],
  axe: false,
  secure: true,
  localStorage: false,
  store: window.RindexedDB(),
})

const UpdatePassword = ({loggedIn, current, code, reset}) => {
  const [username, setUsername] = useState(current ?? "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(loggedIn? "Already logged in" : "")
  const [disabledButton, setDisabledButton] = useState(loggedIn)

  function update(alias) {
    if (!alias) {
      setMessage("Please choose a username")
      return
    }

    setDisabledButton(true)
    setMessage("Updating password...")

    const user = gun.user()
    user.create(alias, password, ack => {
      if (ack.err) {
        if (ack.err === "User already created!") {
          let match = alias.match(/(.*)\.(\d)$/)
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
          update(`${alias}.1`)
          return
        }
        setDisabledButton(false)
        setMessage(ack.err)
        return
      }

      user.auth(alias, password, ack => {
        if (ack.err) {
          setDisabledButton(false)
          setMessage(ack.err)
          return
        }

        fetch(`${window.location.origin}/update-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=utf-8"
          },
          body: JSON.stringify({
            code: code ?? null,
            reset: reset ?? null,
            pub: user.is.pub,
            alias: alias,
            name: username,
          }),
        })
        .then(res => res.text().then(text => ({ok: res.ok, text: text})))
        .then(res => {
          if (!res.ok) {
            setDisabledButton(false)
            user.delete(alias, password)
            setMessage(res.text)
            return
          }

          // The previous public key is returned to copy over public user data.
          gun.user(res.text).get("public").once(data => {
            if (data) {
              user.get("public").put(data)
            }
            setMessage("Password updated")
            setTimeout(() => {
              setDisabledButton(false)
              window.location = "/login"
            }, 2000)
          }, {wait: 0})
        })
      })
    })
  }

  return (
    <Grid item xs={12}>
      <Card sx={{mt:2}}>
        <CardContent>
          <Typography variant="h5">Update Password</Typography>
          <TextField
            id="update-username"
            label="Username"
            variant="outlined"
            fullWidth={true}
            margin="normal"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <FormControl variant="outlined"
            fullWidth={true}
            margin="normal"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
                    {showPassword ? <VisibilityOff/> : <Visibility/>}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
          </FormControl>
          <Button sx={{mt:1}} variant="contained" disabled={disabledButton}
            onClick={() => update(username)}
          >Submit</Button>
          {message &&
           <Typography sx={{m:1}} variant="string">{message}</Typography>}
        </CardContent>
      </Card>
    </Grid>
  )
}

export default UpdatePassword