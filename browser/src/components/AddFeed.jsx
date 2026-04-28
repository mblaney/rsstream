import {useState} from "react"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Checkbox from "@mui/material/Checkbox"
import Container from "@mui/material/Container"
import FormControlLabel from "@mui/material/FormControlLabel"
import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

// name can be a plain string or an indexed object eg. {"0": "Feed Title"}
const resolveName = feed => {
  const {name, url} = feed
  if (!name) return url
  if (typeof name === "string") return name || url
  return Object.values(name)[0] || url
}

const AddFeed = ({user, host, code, debugMode}) => {
  const [url, setUrl] = useState("")
  const [message, setMessage] = useState("")
  const [disabledButton, setDisabledButton] = useState(false)
  const [fake, setFake] = useState(false)
  const [otherFeeds, setOtherFeeds] = useState([])
  const [addedFeedInfo, setAddedFeedInfo] = useState(null)
  const [feedAdded, setFeedAdded] = useState(false)

  const toggleOtherFeed = feedUrl => {
    setOtherFeeds(prev =>
      prev.map(f => (f.url === feedUrl ? {...f, selected: !f.selected} : f)),
    )
  }

  // feedUrl is provided when called from addSelectedFeeds
  const addFeed = async (feedUrl = null) => {
    const targetUrl = (feedUrl || url).trim()
    const calledFromList = feedUrl !== null

    if (!targetUrl) {
      setMessage("Feed required")
      return false
    }
    if (!host) {
      setMessage("Host not available")
      return false
    }
    if (!code) {
      setMessage("Code not found. Please try logging in again")
      return false
    }

    if (!calledFromList) {
      setOtherFeeds([])
      setAddedFeedInfo(null)
      setFeedAdded(false)
      setDisabledButton(true)
    }
    setMessage("Adding feed...")

    const account = await new Promise(res => {
      user.get([host, "accounts"]).next(code, res)
    })
    if (!account) {
      if (!calledFromList) setDisabledButton(false)
      setMessage("Account not found. Please try logging in again")
      return false
    }
    if (account.subscribed === account.feeds) {
      if (!calledFromList) setDisabledButton(false)
      setMessage(`Account currently has a limit of ${account.feeds} feeds`)
      return false
    }

    const feed = await new Promise(res => {
      user.get([host, "feeds"]).next(targetUrl, res)
    })

    if (feed && feed.title) {
      const userFeed = await new Promise(res => {
        user.get("public").next("feeds").next(targetUrl, res)
      })
      if (userFeed && userFeed.title) {
        if (!calledFromList) {
          setDisabledButton(false)
          setMessage("Already added feed")
        }
        return false
      }

      const data = {
        title: feed.title,
        description: feed.description,
        html_url: feed.html_url,
        language: feed.language,
        image: feed.image,
      }
      const err = await new Promise(res => {
        user.get("public").next("feeds").next(targetUrl).put(data, res)
      })
      if (err) {
        if (!calledFromList) setDisabledButton(false)
        console.error(err)
        setMessage("Error adding feed")
        return false
      }

      if (!calledFromList) {
        setMessage("Feed added")
        setFeedAdded(true)
      }

      try {
        const signedUrl = await user.SEA.sign(targetUrl, user.is)
        const res = await fetch(`${window.location.origin}/add-subscriber`, {
          method: "POST",
          headers: {"Content-Type": "application/json;charset=utf-8"},
          body: JSON.stringify({code, url: signedUrl}),
        })
        if (!res.ok) console.error(res)
      } catch (error) {
        console.error(error)
      }

      if (!calledFromList) setDisabledButton(false)
      return true
    }

    try {
      const signedUrl = await user.SEA.sign(targetUrl, user.is)
      const body = {code, url: signedUrl}
      if (!calledFromList) body.fake = fake
      const res = await fetch(`${window.location.origin}/add-feed`, {
        method: "POST",
        headers: {"Content-Type": "application/json;charset=utf-8"},
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        if (!calledFromList) setDisabledButton(false)
        setMessage("Error adding feed")
        console.error(res)
        return false
      }

      const json = await res.json()
      if (json.error) {
        if (!calledFromList) setDisabledButton(false)
        setMessage(json.error)
        return false
      }

      if (!json.add || !json.add.url) {
        if (!calledFromList) setDisabledButton(false)
        setMessage("Error adding feed")
        console.log("No feed returned")
        return false
      }

      const data = {
        title: json.add.title ?? "",
        description: json.add.description ?? "",
        html_url: json.add.html_url ?? "",
        language: json.add.language ?? "",
        image: json.add.image ?? "",
      }
      const err = await new Promise(res => {
        user.get("public").next("feeds").next(json.add.url).put(data, res)
      })
      if (err) {
        if (!calledFromList) setDisabledButton(false)
        setMessage("Error adding feed")
        console.error(err)
        return false
      }

      if (!calledFromList) {
        setFeedAdded(true)
        const otherResults = json.results
          ? json.results.filter(f => f.url !== json.add.url)
          : []
        if (otherResults.length > 0) {
          setMessage("")
          setAddedFeedInfo({
            url: json.add.url,
            title: json.add.title || json.add.url,
          })
          setOtherFeeds(
            otherResults.map(f => ({
              url: f.url,
              name: resolveName(f),
              selected: false,
              added: false,
            })),
          )
        } else {
          setMessage("Feed added")
        }
        setDisabledButton(false)
      }

      return true
    } catch (error) {
      if (!calledFromList) setDisabledButton(false)
      setMessage("Error adding feed")
      console.error(error)
      return false
    }
  }

  const addSelectedFeeds = async () => {
    const selected = otherFeeds.filter(f => f.selected && !f.added)
    if (selected.length === 0) return

    setDisabledButton(true)
    for (const feed of selected) {
      setUrl(feed.name || feed.url)
      const ok = await addFeed(feed.url)
      if (ok) {
        setOtherFeeds(prev =>
          prev.map(f => (f.url === feed.url ? {...f, added: true} : f)),
        )
      }
    }
    setFeedAdded(true)
    setDisabledButton(false)
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
                onFocus={() => {
                  if (!feedAdded) return
                  setUrl("")
                  setMessage("")
                  setOtherFeeds([])
                  setAddedFeedInfo(null)
                  setFeedAdded(false)
                }}
              />
              {debugMode && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fake}
                      onChange={e => setFake(e.target.checked)}
                    />
                  }
                  label="Fake feed (dev mode)"
                />
              )}
              <Box sx={{mt: 1, display: "flex", alignItems: "center", gap: 1}}>
                <Button
                  variant="contained"
                  disabled={url === "" || disabledButton}
                  onClick={() => addFeed()}
                >
                  Submit
                </Button>
                {message && (
                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                    variant="string"
                  >
                    {message}
                    {message === "Feed added" && (
                      <CheckCircleIcon fontSize="small" color="success" />
                    )}
                  </Typography>
                )}
              </Box>
              {otherFeeds.length > 0 && addedFeedInfo && (
                <Box sx={{mt: 2}}>
                  <Typography variant="body2">
                    {"Feed "}
                    <Link
                      href={addedFeedInfo.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {addedFeedInfo.title}
                    </Link>
                    {" added, other feeds found:"}
                  </Typography>
                  {otherFeeds.map(f => (
                    <Box key={f.url} sx={{display: "block"}}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={f.selected || f.added}
                            disabled={f.added}
                            onChange={() => toggleOtherFeed(f.url)}
                          />
                        }
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Typography variant="body2">{f.name}</Typography>
                            {f.added && (
                              <CheckCircleIcon
                                fontSize="small"
                                color="success"
                              />
                            )}
                          </Box>
                        }
                      />
                    </Box>
                  ))}
                  {otherFeeds.some(f => f.selected && !f.added) && (
                    <Button
                      variant="outlined"
                      disabled={disabledButton}
                      onClick={addSelectedFeeds}
                      sx={{mt: 1}}
                    >
                      Add selected
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AddFeed
