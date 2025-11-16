import {useState} from "react"
import Button from "@mui/material/Button"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import SearchAppBar from "./SearchAppBar"

const ValidateEmail = ({loggedIn, mode, setMode, code, validate}) => {
  const [message, setMessage] = useState("Validate your email address:")
  const [disabledButton, setDisabledButton] = useState(false)

  const validateEmail = () => {
    setMessage("Validating email...")
    setDisabledButton(true)

    fetch(`${window.location.origin}/validate-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        code: code ?? null,
        validate: validate ?? null,
      }),
    })
      .then(res => res.text().then(text => ({ok: res.ok, text: text})))
      .then(res => {
        setDisabledButton(false)
        setMessage(res.text)
        if (res.ok) {
          setTimeout(() => {
            window.location = "/"
          }, 1000)
        }
      })
  }

  return (
    <>
      {loggedIn && <SearchAppBar mode={mode} setMode={setMode} />}
      <Container maxWidth="sm">
        <Grid container>
          <Grid item xs={12}>
            <Typography sx={{m: 1}}>{message}</Typography>
            <Button
              sx={{mt: 1}}
              variant="contained"
              disabled={disabledButton}
              onClick={validateEmail}
            >
              Validate
            </Button>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}

export default ValidateEmail
