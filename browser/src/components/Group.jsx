import {red} from "@mui/material/colors"
import Avatar from "@mui/material/Avatar"
import Box from "@mui/material/Box"
import ListItem from "@mui/material/ListItem"
import ListItemAvatar from "@mui/material/ListItemAvatar"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Typography from "@mui/material/Typography"
import PersonIcon from "@mui/icons-material/Person"
import GroupIcon from "@mui/icons-material/Group"
import {formatDate} from "../utils/format.js"

const Group = ({group, setGroup}) => {
  return (
    <ListItem
      key={group.key}
      disablePadding
      alignItems="flex-start"
      onClick={() => setGroup(group)}
    >
      <ListItemButton>
        <ListItemAvatar>
          {group.image ? (
            <Avatar alt={`Avatar for ${group.name}`} src={group.image} />
          ) : (
            <Avatar>
              {group.feeds && group.feeds.length > 1 ? (
                <GroupIcon />
              ) : (
                <PersonIcon />
              )}
            </Avatar>
          )}
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{display: "flex"}}>
              <Typography variant="h6" sx={{flexGrow: 1}}>
                {group.key}
              </Typography>
              <Typography variant="body2" sx={{color: "text.secondary"}}>
                {formatDate(group.timestamp)}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{display: "flex"}}>
              <Typography sx={{flexGrow: 1}}>
                {`${group.author && `${group.author}: `}${group.text}`}
              </Typography>
              {group.count > 0 && (
                <Avatar
                  sx={theme => ({
                    width: 30,
                    height: 30,
                    m: 1,
                    fontSize: "1rem",
                    bgcolor: red[900],
                    ...theme.applyStyles("dark", {bgcolor: red[500]}),
                  })}
                >
                  {group.count}
                </Avatar>
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  )
}

export default Group
