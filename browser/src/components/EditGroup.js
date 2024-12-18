import {useEffect, useReducer, useState} from "react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import List from "@mui/material/List"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import {enc, dec} from "../utils/text.js"
import {init, reducer} from "../utils/reducer.js"
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

  useEffect(() => {
    if (!user) return

    user
      .get("public")
      .get("feeds")
      .map()
      .on((feed, url) => {
        if (!url) return

        updateFeed({
          key: dec(url),
          title: feed ? dec(feed.title) : "",
          description: feed ? dec(feed.description) : "",
          html_url: feed ? dec(feed.html_url) : "",
          language: feed ? dec(feed.language) : "",
          image: feed ? dec(feed.image) : "",
        })
      })
  }, [user])

  const selectFeed = feed => {
    if (selected.includes(feed.key)) {
      setSelected(selected.filter(key => key !== feed.key))
    } else {
      setSelected([...selected, feed.key])
    }
  }

  const updateGroup = () => {
    if (!group) {
      setMessage("Group not set")
      return
    }
    if (!groupName) {
      setMessage("Group name required")
      return
    }

    const feeds = [...group.feeds, ...selected]
    if (feeds.length === 0) {
      const message = "Removing all feeds will remove the group. Continue?"
      if (!window.confirm(message)) return
    }

    setDisabledButton(true)
    setMessage("Updating group...")

    const data = {
      feeds: feeds.reduce((acc, f) => {
        // This function converts selected feeds to an object to store in gun.
        // see Display useEffect which converts back to an array.
        return f ? {...acc, [enc(f)]: true} : {...acc}
      }, {}),
      count: group.count,
      latest: group.latest,
      text: enc(group.text),
      author: enc(group.author),
    }
    let retry = 0
    const interval = setInterval(() => {
      // Delete the old group if the name changes.
      if (group.key && group.key !== groupName) {
        user
          .get("public")
          .get("groups")
          .get(enc(group.key))
          .put(
            {
              feeds: {},
              count: 0,
              latest: 0,
              text: "",
              author: "",
            },
            ack => {
              if (ack.err) console.error(ack.err)
            },
          )
      }
      user
        .get("public")
        .get("groups")
        .get(enc(groupName))
        .put(data, ack => {
          if (ack.err) {
            setDisabledButton(false)
            setMessage("Could not update group")
            console.error(ack.err)
            clearInterval(interval)
            return
          }

          clearInterval(interval)
          showGroupList()
        })
      if (retry > 5) {
        setDisabledButton(false)
        setMessage("Could not update group")
        clearInterval(interval)
      }
      retry++
    }, 1000)
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
        </Grid>
      </Grid>
    </Container>
  )
}

export default EditGroup
