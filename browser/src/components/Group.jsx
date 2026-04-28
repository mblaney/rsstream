import {red} from "@mui/material/colors"
import Avatar from "@mui/material/Avatar"
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
            <Typography variant="h6" component="div" sx={{display: "flex"}}>
              <span style={{flexGrow: 1}}>{group.key}</span>
              <Typography
                variant="body2"
                sx={{color: "text.secondary"}}
                component="span"
              >
                {formatDate(group.timestamp)}
              </Typography>
            </Typography>
          }
          secondary={
            <Typography component="div" sx={{display: "flex"}}>
              <span style={{flexGrow: 1}}>
                {`${group.author && `${group.author}: `}${group.text}`}
              </span>
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
            </Typography>
          }
        />
      </ListItemButton>
    </ListItem>
  )
}

export default Group
