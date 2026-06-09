import {useEffect, useRef, useState} from "react"
import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import Delete from "@mui/icons-material/Delete"
import ExpandMore from "@mui/icons-material/ExpandMore"

const formatSize = bytes => {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const displayUrl = url => {
  try {
    const parsed = new URL(url)
    const file =
      parsed.pathname.split("/").filter(Boolean).pop() || parsed.pathname
    return `${parsed.hostname}: ${file}`
  } catch {
    return url
  }
}

const CacheSection = ({label, cacheName, data, removeItem, clearCache}) => {
  const [expanded, setExpanded] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)
  const [itemSizes, setItemSizes] = useState({})
  const loadedUrlsRef = useRef(new Set())

  const visible = data.items.slice(0, visibleCount)
  const hasMore = data.count > visibleCount

  useEffect(() => {
    if (!expanded || !("caches" in window)) return

    const toLoad = data.items
      .slice(0, visibleCount)
      .filter(item => item.size === 0 && !loadedUrlsRef.current.has(item.url))

    if (toLoad.length === 0) return

    toLoad.forEach(item => loadedUrlsRef.current.add(item.url))

    caches.open(cacheName).then(async cache => {
      const updates = {}
      for (const {url} of toLoad) {
        const response = await cache.match(url)
        if (response) {
          const blob = await response.blob()
          updates[url] = blob.size
        }
      }
      if (Object.keys(updates).length > 0) {
        setItemSizes(prev => ({...prev, ...updates}))
      }
    })
  }, [expanded, visibleCount, data.items, cacheName])

  const totalSize = data.items.reduce(
    (sum, item) => sum + (itemSizes[item.url] ?? item.size),
    0,
  )

  return (
    <Accordion
      disableGutters
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography>
          {label}{" "}
          <Typography component="span" variant="body2" color="text.secondary">
            ({data.count} file{data.count !== 1 ? "s" : ""}
            {totalSize > 0 ? `, ${formatSize(totalSize)}` : ""})
          </Typography>
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {data.count === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No {label.toLowerCase()} cached
          </Typography>
        ) : (
          <>
            {visible.map(item => {
              const size = itemSizes[item.url] ?? item.size
              return (
                <Box
                  key={item.url}
                  sx={{display: "flex", alignItems: "center", mb: 0.5}}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      flexGrow: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name || displayUrl(item.url)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{mx: 1, whiteSpace: "nowrap", flexShrink: 0}}
                  >
                    {formatSize(size)}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="remove"
                    onClick={() => removeItem(cacheName, item.url)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              )
            })}
            {hasMore && (
              <Box sx={{display: "flex", alignItems: "center", mt: 0.5}}>
                <Typography variant="body2" color="text.secondary">
                  Showing {visibleCount} of {data.count} files
                </Typography>
                <Button
                  size="small"
                  sx={{ml: 1}}
                  onClick={() => setVisibleCount(c => c + 10)}
                >
                  Show more
                </Button>
              </Box>
            )}
            <Button
              size="small"
              color="error"
              sx={{mt: 1}}
              onClick={() => clearCache(cacheName)}
            >
              Clear all {label.toLowerCase()}
            </Button>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

const EditCache = ({cacheData, removeItem, clearCache}) => {
  if (!cacheData) return null

  return (
    <Card sx={{mt: 2}}>
      <CardContent>
        <Typography variant="h6" sx={{mb: 1}}>
          Cache storage
        </Typography>
        <CacheSection
          label="Audio"
          cacheName="audio"
          data={cacheData.audio}
          removeItem={removeItem}
          clearCache={clearCache}
        />
        <CacheSection
          label="Video"
          cacheName="video"
          data={cacheData.video}
          removeItem={removeItem}
          clearCache={clearCache}
        />
      </CardContent>
    </Card>
  )
}

export default EditCache
