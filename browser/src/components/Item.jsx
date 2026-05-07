import {useState} from "react"
import parse from "html-react-parser"
import Avatar from "@mui/material/Avatar"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import BookmarkIcon from "@mui/icons-material/Bookmark"
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder"
import DeleteIcon from "@mui/icons-material/Delete"
import PersonIcon from "@mui/icons-material/Person"
import {urlAvatar} from "../utils/avatar.js"
import {formatDate} from "../utils/format.js"

const contentSx = theme => ({
  overflowWrap: "break-word",
  "& img, & video, & iframe": {maxWidth: "100%", height: "auto"},
  "& pre": {
    overflowX: "auto",
    backgroundColor: theme.palette.action.hover,
    borderRadius: 1,
    padding: theme.spacing(1),
    fontSize: "0.875em",
    fontFamily: "monospace",
  },
  "& code": {
    backgroundColor: theme.palette.action.hover,
    borderRadius: "3px",
    padding: "0.15em 0.3em",
    fontSize: "0.875em",
    fontFamily: "source-code-pro, Menlo, Monaco, Consolas, monospace",
  },
  "& pre code": {
    backgroundColor: "transparent",
    padding: 0,
    borderRadius: 0,
    fontSize: "inherit",
  },
})

const Item = ({
  item,
  itemRefs,
  newFrom,
  isBookmarked,
  isBookmarkGroup,
  bookmarkGroup,
  user,
}) => {
  const [showMore, setShowMore] = useState(false)
  const stripped = item.content && item.content.replace(/(<([^>]+)>)/g, "")

  const addBookmark = () => {
    if (isBookmarked) return

    const tag = /(<([^>]+)>)/g
    const text = item.title
      ? item.title.replace(tag, "")
      : item.content
        ? item.content.replace(tag, "")
        : ""
    const now = Date.now()
    const data = {
      key: item.guid,
      title: item.title,
      content: item.content,
      author: item.author,
      category: item.category || null,
      enclosure: item.enclosure || null,
      permalink: item.permalink,
      guid: item.guid,
      timestamp: item.timestamp,
      bookmarkedAt: now,
      feedUrl: item.feedUrl,
      feedTitle: item.feedTitle,
      feedImage: item.feedImage,
      url: item.url,
    }
    user
      .get("public")
      .next("bookmarks")
      .put({[item.guid]: JSON.stringify(data)})
    const groupStats = {
      bookmarks: true,
      latest: now,
      timestamp: now,
      text: text.length > 200 ? text.substring(0, 200) : text,
      author: item.author || "",
    }
    if (bookmarkGroup) {
      user.get("public").next("groups").next(bookmarkGroup.key).put(groupStats)
    } else {
      user
        .get("public")
        .next("groups")
        .put({name: "Bookmarks", ...groupStats}, true)
    }
  }

  const removeBookmark = () => {
    user
      .get("public")
      .next("bookmarks")
      .put({[item.guid]: null})
  }

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
              mr: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.author
              ? item.author.replace(/^https?:\/\//, "")
              : item.feedTitle}
          </Typography>
          {isBookmarkGroup ? (
            <IconButton
              size="small"
              onClick={removeBookmark}
              sx={{color: "action.active"}}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton
              size="small"
              onClick={addBookmark}
              sx={{color: isBookmarked ? "primary.main" : "action.active"}}
            >
              {isBookmarked ? (
                <BookmarkIcon fontSize="small" />
              ) : (
                <BookmarkBorderIcon fontSize="small" />
              )}
            </IconButton>
          )}
          <Box sx={{flexGrow: 1}} />
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
          <Typography component="div" sx={contentSx}>
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
          <Typography component="div" sx={contentSx}>
            {parse(item.content)}
          </Typography>
        )}
        {item.enclosure &&
          item.enclosure.photo &&
          item.enclosure.photo.map(p => (
            <img
              key={p.link}
              src={p.link}
              alt={p.alt}
              style={{maxWidth: "100%"}}
            />
          ))}
        {item.enclosure &&
          item.enclosure.audio &&
          item.enclosure.audio.map(a =>
            a.startsWith("https") ? (
              <audio key={a} controls src={a} style={{width: "100%"}}></audio>
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
              <video
                key={v}
                controls
                src={v}
                style={{maxWidth: "100%"}}
              ></video>
            ) : (
              <Link href={v} target="_blank">
                {v}
              </Link>
            ),
          )}
      </Box>
      {item.key === newFrom && <Divider textAlign="right">New</Divider>}
    </Grid>
  )
}

export default Item
