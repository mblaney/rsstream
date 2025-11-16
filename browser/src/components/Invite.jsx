import {useState} from "react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import SearchAppBar from "./SearchAppBar"

const Invite = ({loggedIn, mode, setMode}) => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [disabledButton, setDisabledButton] = useState(false)

  const invite = () => {
    if (!email) {
      setMessage("Please provide your email")
      return
    }

    setDisabledButton(true)
    setMessage("Requesting invite code...")
    fetch(`${window.location.origin}/request-invite-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        email: email,
      }),
    })
      .then(res => res.text().then(text => ({ok: res.ok, text: text})))
      .then(res => {
        setDisabledButton(false)
        setEmail("")
        setMessage(res.text)
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
                <Typography variant="h5">Request invite code</Typography>
                <TextField
                  id="invite-emil"
                  label="Email"
                  variant="outlined"
                  fullWidth={true}
                  margin="normal"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
                <Button
                  sx={{mt: 1}}
                  variant="contained"
                  disabled={disabledButton}
                  onClick={invite}
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

export default Invite
