import {useState} from "react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import Gun from "gun"
require("gun/lib/radix.js")
require("gun/lib/radisk.js")
require("gun/lib/store.js")
require("gun/lib/rindexed.js")
require("gun/sea")

const AddFeed = ({host, user, code, setAddFeed}) => {
  const [url, setUrl] = useState("")
  const [message, setMessage] = useState("")
  const [disabledButton, setDisabledButton] = useState(false)

  const addFeed = () => {
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

    host
      .get("accounts")
      .get(code)
      .once(account => {
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
        host
          .get("feeds")
          .get(url)
          .once(async feed => {
            if (feed && feed.title) {
              user
                .get("public")
                .get("feeds")
                .get(url)
                .once(userFeed => {
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
                    .get("feeds")
                    .get(url)
                    .put(data, async ack => {
                      setDisabledButton(false)
                      if (ack.err) {
                        console.error(ack.err)
                        setMessage("Error adding feed")
                        return
                      }

                      setMessage("Feed added")
                      setTimeout(() => setAddFeed(false), 1000)
                      try {
                        const signedUrl = await Gun.SEA.sign(url, user._.sea)
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
              const signedUrl = await Gun.SEA.sign(url, user._.sea)
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
                title: json.add.title,
                description: json.add.description,
                html_url: json.add.html_url,
                language: json.add.language,
                image: json.add.image,
              }
              user
                .get("public")
                .get("feeds")
                .get(json.add.url)
                .put(data, ack => {
                  if (ack.err) {
                    setDisabledButton(false)
                    setMessage("Error adding feed")
                    console.error(ack.err)
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
          })
      })
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
