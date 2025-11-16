import {useEffect, useReducer, useState} from "react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import List from "@mui/material/List"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import {init, reducer} from "../utils/reducer.js"
import {
  nytFavicon,
  bbcFavicon,
  tcFavicon,
  wiredFavicon,
  espnFavicon,
  cbsFavicon,
} from "../images/favicons.js"
import Feed from "./Feed"

const EditGroup = ({user, code, groups, currentGroup, showGroupList}) => {
  const [group, setGroup] = useState(() => {
    groups.all.find(g => g.key === currentGroup)
  })
  const [groupName, setGroupName] = useState(currentGroup)
  const [selected, setSelected] = useState([])
  const [message, setMessage] = useState("")
  const [disabledButton, setDisabledButton] = useState(false)
  const [feeds, updateFeed] = useReducer(reducer(), init)

  useEffect(() => {
    if (!groups) return

    setGroup(groups.all.find(g => g.key === currentGroup))
  }, [groups, currentGroup])

  // This is copied from FeedList in case users have added default feeds to
  // a group which also need to be displayed here.
  useEffect(() => {
    updateFeed({
      key: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
      title: "NYT > Top Stories",
      html_url: "https://www.nytimes.com",
      language: "en-us",
      image: nytFavicon,
      defaultGroup: "News",
    })
    updateFeed({
      key: "https://feeds.bbci.co.uk/news/world/rss.xml",
      title: "BBC News",
      html_url: "https://www.bbc.co.uk/news/world",
      language: "en-gb",
      image: bbcFavicon,
      defaultGroup: "News",
    })
    updateFeed({
      key: "https://techcrunch.com/feed",
      title: "TechCrunch",
      html_url: "https://techcrunch.com",
      language: "en-US",
      image: tcFavicon,
      defaultGroup: "Tech",
    })
    updateFeed({
      key: "https://www.wired.com/feed",
      title: "Wired",
      html_url: "https://www.wired.com",
      language: "en-US",
      image: wiredFavicon,
      defaultGroup: "Tech",
    })
    updateFeed({
      key: "https://www.espn.com/espn/rss/news",
      title: "www.espn.com - TOP",
      html_url: "https://www.espn.com",
      language: "en",
      image: espnFavicon,
      defaultGroup: "Sport",
    })
    updateFeed({
      key: "https://www.cbssports.com/rss/headlines",
      title: "CBSSports.com Headlines",
      html_url: "https://www.cbssports.com",
      language: "en-us",
      image: cbsFavicon,
      defaultGroup: "Sport",
    })
  }, [])

  useEffect(() => {
    if (!user) return

    const update = allFeeds => {
      if (!allFeeds) return

      for (const [url, f] of Object.entries(allFeeds)) {
        if (!url) continue

        updateFeed({
          key: url,
          title: f ? f.title : "",
          description: f ? f.description : "",
          html_url: f ? f.html_url : "",
          language: f ? f.language : "",
          image: f ? f.image : "",
        })
      }
    }
    user.get("public").next("feeds").on(update, true)
  }, [user])

  const selectFeed = f => {
    if (selected.includes(f.key)) {
      setSelected(selected.filter(key => key !== f.key))
    } else {
      setSelected([...selected, f.key])
    }
  }

  const updateGroup = async () => {
    if (!group) {
      setMessage("Group not set")
      return
    }
    if (!groupName) {
      setMessage("Group name required")
      return
    }

    const allFeeds = [...group.feeds, ...selected]
    if (allFeeds.length === 0) {
      const check = "Removing all feeds will remove the group. Continue?"
      if (!window.confirm(check)) return
    }

    setDisabledButton(true)
    setMessage("Updating group...")

    // Convert feeds to an object to store in Holster.
    // See Display useEffect which converts back to an array.
    let f = {}
    for (let i = 0; i < allFeeds.length; i++) {
      const url = allFeeds[i]
      const feed = feeds.all.find(current => current.key === url)
      if (!feed) continue

      f[url] = true
      // Store each feed for the user to listen for updates in App.js.
      const err = await new Promise(res => {
        user.get("public").next("feeds").next(url).put(feed, res)
      })
      if (err) console.error(err)
    }
    const data = {
      feeds: f,
      count: 0,
      latest: 0,
      text: "",
      author: "",
      timestamp: Date.now(),
    }
    // Delete the old group if the name changes.
    if (group.key && group.key !== groupName) {
      const removed = {
        feeds: null,
        count: 0,
        latest: 0,
        text: "",
        author: "",
        timestamp: 0,
      }
      const err = await new Promise(res => {
        user.get("public").next("groups").next(group.key).put(removed, res)
      })
      if (err) console.error(err)
    }
    user
      .get("public")
      .next("groups")
      .next(groupName)
      .put(data, err => {
        if (err) {
          setDisabledButton(false)
          setMessage("Could not update group")
          console.error(err)
        } else {
          showGroupList(true)
        }
      })
  }

  return (
    <Container maxWidth="md">
      <Grid container>
        <Grid item xs={12}>
          <Card sx={{mt: 2}}>
            <CardContent>
              <Typography variant="h5">Edit group</Typography>
              <TextField
                id="editgroup-name"
                label="Group name"
                variant="outlined"
                fullWidth={true}
                margin="normal"
                value={groupName}
                onChange={event => setGroupName(event.target.value)}
              />
              <Button
                sx={{mt: 1}}
                variant="contained"
                disabled={groupName === "" || disabledButton}
                onClick={updateGroup}
              >
                Submit
              </Button>
              {selected.length > 0 && !message && (
                <Typography sx={{m: 1}} variant="string">
                  {`Adding ${selected.length} feed${selected.length > 1 ? "s" : ""}`}
                </Typography>
              )}
              {message && (
                <Typography sx={{m: 1}} variant="string">
                  {message}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Typography sx={{m: 1}}>Current feeds</Typography>
        <Grid item xs={12}>
          <List>
            {feeds &&
              feeds.all.map(
                f =>
                  f.title &&
                  group.feeds.includes(f.key) && (
                    <Feed
                      user={user}
                      code={code}
                      groups={groups}
                      currentGroup={currentGroup}
                      feed={f}
                      selected={false}
                      selectFeed={() => {}}
                    />
                  ),
              )}
          </List>
        </Grid>
        <Typography sx={{m: 1}}>Add feeds</Typography>
        <Grid item xs={12}>
          <List>
            {feeds &&
              feeds.all.map(
                f =>
                  f.title &&
                  !group.feeds.includes(f.key) && (
                    <Feed
                      user={user}
                      code={code}
                      groups={groups}
                      currentGroup={currentGroup}
                      feed={f}
                      selected={selected.includes(f.key)}
                      selectFeed={selectFeed}
                    />
                  ),
              )}
          </List>
          {feeds &&
            feeds.all.filter(f => f.title && !group.feeds.includes(f.key))
              .length === 0 && (
              <Typography sx={{m: 1}}>
                No more feeds available. Click add feed in the menu to add more.
              </Typography>
            )}
        </Grid>
      </Grid>
    </Container>
  )
}

export default EditGroup
