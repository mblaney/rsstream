import {useState} from "react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

const AddFeed = ({user, host, code, setAddFeed}) => {
  const [url, setUrl] = useState("")
  const [message, setMessage] = useState("")
  const [disabledButton, setDisabledButton] = useState(false)

  const addFeed = async () => {
    if (!url) {
      setMessage("Feed required")
      return
    }
    if (!host) {
      setMessage("Host not available")
      return
    }
    if (!code) {
      setMessage("Code not found. Please try logging in again")
      return
    }

    const account = await new Promise(res => {
      user.get([host, "accounts"]).next(code, res)
    })
    if (!account) {
      setMessage("Account not found. Please try logging in again")
      return
    }
    if (account.subscribed === account.feeds) {
      setMessage(`Account currently has a limit of ${account.feeds} feeds`)
      return
    }

    setDisabledButton(true)
    setMessage("Adding feed...")
    const feed = await new Promise(res => {
      user.get([host, "feeds"]).next(url, res)
    })
    if (feed && feed.title) {
      user
        .get("public")
        .next("feeds")
        .next(url, userFeed => {
          if (userFeed && userFeed.title) {
            setDisabledButton(false)
            setMessage("Already added feed")
            return
          }

          const data = {
            title: feed.title,
            description: feed.description,
            html_url: feed.html_url,
            language: feed.language,
            image: feed.image,
          }
          user
            .get("public")
            .next("feeds")
            .next(url)
            .put(data, async err => {
              setDisabledButton(false)
              if (err) {
                console.error(err)
                setMessage("Error adding feed")
                return
              }

              setMessage("Feed added")
              setTimeout(() => setAddFeed(false), 1000)
              try {
                const signedUrl = await user.SEA.sign(url, user.is)
                const res = await fetch(
                  `${window.location.origin}/add-subscriber`,
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
      return
    }

    try {
      const signedUrl = await user.SEA.sign(url, user.is)
      const res = await fetch(`${window.location.origin}/add-feed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify({code: code, url: signedUrl}),
      })
      if (!res.ok) {
        setDisabledButton(false)
        setMessage("Error adding feed")
        console.error(res)
        return
      }

      const json = await res.json()
      if (json.error) {
        setDisabledButton(false)
        setMessage(json.error)
        return
      }

      if (!json.add || !json.add.url) {
        setDisabledButton(false)
        setMessage("Error adding feed")
        console.log("No feed returned")
        return
      }

      if (json.results) {
        console.log(`Multiple feeds were discovered at ${url}
  Subscribed to ${json.add.url}
  Other results were:`)
        console.log(json.results)
      }

      const data = {
        title: json.add.title ?? "",
        description: json.add.description ?? "",
        html_url: json.add.html_url ?? "",
        language: json.add.language ?? "",
        image: json.add.image ?? "",
      }
      user
        .get("public")
        .next("feeds")
        .next(json.add.url)
        .put(data, err => {
          if (err) {
            setDisabledButton(false)
            setMessage("Error adding feed")
            console.error(err)
            return
          }

          setDisabledButton(false)
          setMessage("Feed added")
          setTimeout(() => setAddFeed(false), 1000)
          return
        })
    } catch (error) {
      setDisabledButton(false)
      setMessage("Error adding feed")
      console.error(error)
    }
  }

  return (
    <Container maxWidth="md">
      <Grid container>
        <Grid item xs={12}>
          <Card sx={{mt: 2}}>
            <CardContent>
              <Typography variant="h5">Add feed</Typography>
              <TextField
                id="addfeed-new-feed"
                label="Feed"
                variant="outlined"
                fullWidth={true}
                margin="normal"
                value={url}
                onChange={event => setUrl(event.target.value)}
              />
              <Button
                sx={{mt: 1}}
                variant="contained"
                disabled={url === "" || disabledButton}
                onClick={addFeed}
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
  )
}

export default AddFeed
