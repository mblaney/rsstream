import {useState} from "react"
import parse from "html-react-parser"
import Avatar from "@mui/material/Avatar"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import PersonIcon from "@mui/icons-material/Person"
import {urlAvatar} from "../utils/avatar.js"
import {formatDate} from "../utils/format.js"

const Item = ({item, itemRefs, newFrom}) => {
  const [showMore, setShowMore] = useState(false)
  const stripped = item.content && item.content.replace(/(<([^>]+)>)/g, "")

  return (
    <Grid
      item
      xs={12}
      ref={node => {
        if (node) {
          itemRefs.current.set(item.key, node)
        } else {
          itemRefs.current.delete(item.key)
        }
      }}
    >
      {item.key === newFrom && <Divider textAlign="right">New</Divider>}
      <Box sx={{pt: 2}}>
        <Box sx={{display: "flex"}}>
          {item.feedImage ? (
            <Avatar alt={`Avatar for ${item.feedTitle}`} src={item.feedImage} />
          ) : item.feedUrl ? (
            <Avatar {...urlAvatar(item.feedUrl)} />
          ) : (
            <Avatar>
              <PersonIcon />
            </Avatar>
          )}
          <Typography
            variant="h6"
            sx={{
              ml: 2,
              flexGrow: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.author ? item.author : item.feedTitle}
          </Typography>
          <Link
            href={item.permalink}
            target="_blank"
            variant="body2"
            sx={{mt: 1, whiteSpace: "nowrap"}}
          >
            {formatDate(item.timestamp)}
          </Link>
        </Box>
        {item.title && (
          <Typography>
            <b>{parse(item.title)}</b>
          </Typography>
        )}
        {item.content && stripped.length > 1200 && showMore && (
          <Typography component="div">
            {parse(item.content)}{" "}
            <Link
              component="button"
              onClick={() => {
                setShowMore(false)
              }}
            >
              show less
            </Link>
          </Typography>
        )}
        {item.content && stripped.length > 1200 && !showMore && (
          <Typography>
            {stripped.substring(0, 800)}...{" "}
            <Link
              component="button"
              onClick={() => {
                setShowMore(true)
              }}
            >
              show more
            </Link>
          </Typography>
        )}
        {item.content && stripped.length <= 1200 && (
          <Typography component="div">{parse(item.content)}</Typography>
        )}
        {item.enclosure &&
          item.enclosure.photo &&
          item.enclosure.photo.map(p => (
            <img key={p.link} src={p.link} alt={p.alt} />
          ))}
        {item.enclosure &&
          item.enclosure.audio &&
          item.enclosure.audio.map(a =>
            a.startsWith("https") ? (
              <audio key={a} controls src={a}></audio>
            ) : (
              <Link href={a} target="_blank">
                {a}
              </Link>
            ),
          )}
        {item.enclosure &&
          item.enclosure.video &&
          item.enclosure.video.map(v =>
            v.startsWith("https") ? (
              <video key={v} controls src={v}></video>
            ) : (
              <Link href={v} target="_blank">
                {v}
              </Link>
            ),
          )}
      </Box>
    </Grid>
  )
}

export default Item
