import {useEffect, useState} from "react"
import parse from "html-react-parser"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import List from "@mui/material/List"
import Typography from "@mui/material/Typography"
import Group from "./Group"

const GroupList = ({groups, groupsLoaded, setGroup}) => {
  const [message, setMessage] = useState("")

  const hasGroups =
    groups &&
    groups.all.filter(g => g.feeds && g.feeds.length !== 0).length !== 0

  useEffect(() => {
    if (hasGroups) {
      setMessage("")
      return
    }
    if (!groupsLoaded) return
    const id = setTimeout(
      () =>
        setMessage(
          "Welcome to your group list page! Select <b>Add group</b>" +
            " from the account menu to create your first group.",
        ),
      500,
    )
    return () => clearTimeout(id)
  }, [groupsLoaded, hasGroups])

  return (
    <Container maxWidth="md">
      <Grid container>
        <Grid item xs={12}>
          <List>
            {groups &&
              groups.all.map(
                group =>
                  group.feeds &&
                  group.feeds.length !== 0 && (
                    <Group key={group.key} group={group} setGroup={setGroup} />
                  ),
              )}
          </List>
          {!groupsLoaded && (
            <Box sx={{display: "flex", justifyContent: "center", p: 2}}>
              <CircularProgress />
            </Box>
          )}
          {message && <Typography align="center">{parse(message)}</Typography>}
        </Grid>
      </Grid>
    </Container>
  )
}

export default GroupList
