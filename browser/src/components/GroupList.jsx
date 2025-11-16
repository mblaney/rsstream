import {useEffect, useState} from "react"
import parse from "html-react-parser"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import List from "@mui/material/List"
import Typography from "@mui/material/Typography"
import Group from "./Group"

const GroupList = ({groups, setGroup}) => {
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (groups && groups.all.filter(g => g.feeds.length !== 0) !== 0) {
      setMessage("")
    }

    const timeout = setTimeout(() => {
      if (groups && groups.all.filter(g => g.feeds.length !== 0).length === 0) {
        setMessage(
          "Welcome to your group list page! Select <b>Add group</b>" +
            " from the account menu to create your first group.",
        )
      }
    }, 2000)
    return () => clearTimeout(timeout)
  }, [groups])

  return (
    <Container maxWidth="md">
      <Grid container>
        <Grid item xs={12}>
          <List>
            {groups &&
              groups.all.map(
                group =>
                  group.feeds.length !== 0 && (
                    <Group group={group} setGroup={setGroup} />
                  ),
              )}
          </List>
          <Typography>{message && parse(message)}</Typography>
        </Grid>
      </Grid>
    </Container>
  )
}

export default GroupList
