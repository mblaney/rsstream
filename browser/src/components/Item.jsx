import {useEffect, useState} from "react"
import parse from "html-react-parser"
import {red} from "@mui/material/colors"
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
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline"
import OfflinePinIcon from "@mui/icons-material/OfflinePin"
import PersonIcon from "@mui/icons-material/Person"
import {urlAvatar} from "../utils/avatar.js"
import {formatDate, decodeEntities} from "../utils/format.js"
import {buildHighlighter, highlightText} from "../utils/highlight.jsx"

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
  searchQuery,
}) => {
  const [showMore, setShowMore] = useState(false)
  const [savedAudio, setSavedAudio] = useState(new Set())
  const [savingAudio, setSavingAudio] = useState(new Set())
  const stripped =
    item.content && decodeEntities(item.content.replace(/(<([^>]+)>)/g, ""))
  useEffect(() => {
    if (!("caches" in window) || !item.enclosure?.audio) return
    ;(async () => {
      const cached = new Set()
      for (const a of item.enclosure.audio) {
        if (a.startsWith("https") && (await caches.match(a))) cached.add(a)
      }
      setSavedAudio(cached)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveForOffline = async (url, name) => {
    setSavingAudio(s => new Set(s).add(url))
    try {
      const cache = await caches.open("audio")
      const response = await fetch(url)
      if (response.ok) {
        const headers = new Headers(response.headers)
        headers.set("x-cache-name", name)
        const named = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
        await cache.put(url, named)
        setSavedAudio(s => new Set(s).add(url))
      }
    } catch (e) {
      console.error("Failed to cache audio", e)
    } finally {
      setSavingAudio(s => {
        const next = new Set(s)
        next.delete(url)
        return next
      })
    }
  }

  const highlight = buildHighlighter(searchQuery)
  const parseOptions = highlight ? {replace: highlight} : {}

  const addBookmark = () => {
    if (isBookmarked) return

    const tag = /(<([^>]+)>)/g
    const text = decodeEntities(
      item.title
        ? item.title.replace(tag, "")
        : item.content
          ? item.content.replace(tag, "")
          : "",
    )
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
              ml: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.author
              ? highlightText(
                  item.author.replace(/^https?:\/\//, ""),
                  searchQuery,
                )
              : highlightText(item.feedTitle, searchQuery)}
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
            <b>{parse(item.title, parseOptions)}</b>
          </Typography>
        )}
        {item.content && stripped.length > 1200 && showMore && (
          <Typography component="div" sx={contentSx}>
            {parse(item.content, parseOptions)}{" "}
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
            {highlightText(stripped.substring(0, 800), searchQuery)}...{" "}
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
            {parse(item.content, parseOptions)}
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
              <Box key={a} sx={{display: "flex", alignItems: "center", gap: 1}}>
                <audio
                  controls
                  crossOrigin="anonymous"
                  src={a}
                  style={{flexGrow: 1}}
                ></audio>
                {"caches" in window && (
                  <IconButton
                    size="small"
                    disabled={savingAudio.has(a)}
                    onClick={() => saveForOffline(a, item.title || item.url)}
                    title={
                      savedAudio.has(a)
                        ? "Saved for offline"
                        : "Save for offline"
                    }
                    sx={
                      savedAudio.has(a)
                        ? {color: "success.main"}
                        : savingAudio.has(a)
                          ? {"&.Mui-disabled": {color: "warning.main"}}
                          : {}
                    }
                  >
                    {savedAudio.has(a) ? (
                      <OfflinePinIcon fontSize="small" />
                    ) : (
                      <DownloadForOfflineIcon fontSize="small" />
                    )}
                  </IconButton>
                )}
              </Box>
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
      {item.key === newFrom && (
        <Divider
          textAlign="right"
          sx={theme => ({
            borderColor: red[900],
            color: red[900],
            ...theme.applyStyles("dark", {
              borderColor: red[500],
              color: red[500],
            }),
          })}
        >
          New
        </Divider>
      )}
    </Grid>
  )
}

export default Item
