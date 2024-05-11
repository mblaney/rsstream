import { useState } from "react"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"

const ValidateEmail = ({code, validate}) => {
  const [message, setMessage] = useState("Validate your email address:")
  const [disabledButton, setDisabledButton] = useState(false)

  function validateEmail() {
    setMessage("Validating email...")
    setDisabledButton(true)

    fetch(`${window.location.origin}/validate-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
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
    <Grid item xs={12}>
      <Typography sx={{m:1}}>{message}</Typography>
      <Button sx={{mt:1}} variant="contained" disabled={disabledButton}
        onClick={validateEmail}
      >Validate</Button>
    </Grid>
  )
}

export default ValidateEmail