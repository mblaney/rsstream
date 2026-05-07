import {useCallback, useEffect, useReducer, useRef, useState} from "react"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import {init, reducer} from "../utils/reducer.js"
import {getGroupItems} from "../utils/getGroupItems.js"
import {logEvent} from "../utils/debugEvents"
import Item from "./Item"

const ItemList = ({
  user,
  group,
  feeds,
  setMessage,
  requestMoreHistory,
  historyDayLoaded,
  maxHistoryReached,
  bookmarkItems,
  bookmarkGroup,
}) => {
  const sort = (a, b) => a.timestamp - b.timestamp
  const [items, updateItem] = useReducer(reducer(sort), init)
  const feedsRef = useRef(feeds)
  feedsRef.current = feeds
  const bookmarkItemsRef = useRef(bookmarkItems)
  bookmarkItemsRef.current = bookmarkItems
  const groupKeyRef = useRef("")
  const [newFrom, setNewFrom] = useState(0)
  const [scrollToEnd, setScrollToEnd] = useState(false)
  const [loading, setLoading] = useState(false)
  const itemRefs = useRef(new Map())
  const itemsRef = useRef(items)
  const oldestTimestampRef = useRef(Date.now())
  const watchStart = useRef()
  const needsMoreItemsRef = useRef(false)
  const isMountedRef = useRef(true)
  const maxHistoryReachedRef = useRef(maxHistoryReached)

  // Cleanup mounted flag on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Keep itemsRef in sync so setupLoadMoreObserver always has the latest items
  // without items.all being a dependency that causes re-renders.
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    maxHistoryReachedRef.current = maxHistoryReached
  }, [maxHistoryReached])

  const mapEnclosure = useCallback(e => {
    if (!e) return null

    let found = false
    let enclosure = {}
    if (e.photo) {
      found = true
      enclosure.photo = []
      for (const [link, alt] of Object.entries(e.photo)) {
        enclosure.photo.push({link: link, alt: alt})
      }
    }
    if (e.audio) {
      found = true
      enclosure.audio = Object.keys(e.audio)
    }
    if (e.video) {
      found = true
      enclosure.video = Object.keys(e.video)
    }
    return found ? enclosure : null
  }, [])

  // Scroll to end so that the intersection observer is not triggered.
  useEffect(() => {
    if (!scrollToEnd || items.all.length === 0) return

    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, 100)
    document.body.onscroll = () => {
      setTimeout(() => {
        setScrollToEnd(false)
        document.body.onscroll = null
      }, 3000)
    }
  }, [scrollToEnd, items])

  const renderItems = useCallback(
    items => {
      const feeds = feedsRef.current
      for (const item of items) {
        const feed = feeds[item.feedUrl]
        if (!feed || !feed.items || !feed.items[item.day]) continue

        const feedItem = feed.items[item.day][item.key]
        if (!feedItem || typeof feedItem !== "object") continue

        updateItem({
          key: item.key,
          title: feedItem.title,
          content: feedItem.content,
          author: feedItem.author,
          category: feedItem.category ? Object.keys(feedItem.category) : null,
          enclosure: mapEnclosure(feedItem.enclosure),
          permalink: feedItem.permalink,
          guid: feedItem.guid,
          timestamp: feedItem.timestamp,
          feedUrl: feed.url,
          feedTitle: feed.title ? feed.title : "",
          feedImage: feed.image ? feed.image : "",
          url: feedItem.url,
        })
      }
    },
    [mapEnclosure],
  )

  // Set up intersection observer for loading more items when scrolling back
  const setupLoadMoreObserver = useCallback(() => {
    // Clear old observer
    if (watchStart.current) {
      watchStart.current.disconnect()
    }

    watchStart.current = new IntersectionObserver(e => {
      logEvent("OBSERVER_FIRED", {
        isIntersecting: e[0].isIntersecting,
        oldestTimestamp: oldestTimestampRef.current,
      })
      if (e[0].isIntersecting) {
        // Preemptively request the next historical day whenever scrolling back
        requestMoreHistory()

        // Get next batch of older items
        const olderItems = getGroupItems(
          group,
          feedsRef.current,
          oldestTimestampRef.current,
          10,
        )
        logEvent("LOAD_MORE", {
          found: olderItems.length,
          oldestTimestamp: oldestTimestampRef.current,
        })

        if (olderItems.length > 0) {
          renderItems(olderItems)
          oldestTimestampRef.current =
            olderItems[olderItems.length - 1].timestamp
          // Setup observer for next scroll back
          const timeoutId = setTimeout(() => {
            if (isMountedRef.current) {
              setupLoadMoreObserver()
            }
          }, 500)
          return () => clearTimeout(timeoutId)
        } else if (isMountedRef.current) {
          if (maxHistoryReachedRef.current) {
            setLoading(false)
            setMessage("No more items available for this group.")
          } else {
            setLoading(true)
            needsMoreItemsRef.current = true
          }
        }
      }
    })

    // Observe the first few oldest items (at the top) so scrolling up triggers loading more.
    let aim = 0
    const observed = []
    for (let i = 0; i < itemsRef.current.all.length; i++) {
      const target = itemRefs.current.get(itemsRef.current.all[i].key)
      if (target) {
        watchStart.current.observe(target)
        observed.push(itemsRef.current.all[i].key)
        if (aim++ === 3) break
      }
    }
    logEvent("OBSERVER_SETUP", {observing: observed.length, keys: observed})
  }, [group, renderItems, setMessage, isMountedRef, requestMoreHistory])

  // When a historical day finishes loading, check for new items. If the
  // observer was stuck waiting (needsMoreItemsRef), render and reset it, or
  // cascade to the next day if this day had nothing for the current group.
  useEffect(() => {
    if (!historyDayLoaded || !group || !needsMoreItemsRef.current) return

    const olderItems = getGroupItems(
      group,
      feedsRef.current,
      oldestTimestampRef.current,
      10,
    )

    logEvent("HISTORY_DAY_CHECK", {
      group: group.key,
      historyDayLoaded,
      from: oldestTimestampRef.current,
      found: olderItems.length,
      maxHistoryReached,
    })

    if (olderItems.length > 0) {
      needsMoreItemsRef.current = false
      setLoading(false)
      renderItems(olderItems)
      oldestTimestampRef.current = olderItems[olderItems.length - 1].timestamp
      setTimeout(() => {
        if (isMountedRef.current) setupLoadMoreObserver()
      }, 500)
    } else if (maxHistoryReached) {
      needsMoreItemsRef.current = false
      setLoading(false)
      setMessage("No more items available for this group.")
    } else {
      requestMoreHistory()
    }
  }, [
    historyDayLoaded,
    group,
    renderItems,
    setupLoadMoreObserver,
    requestMoreHistory,
    maxHistoryReached,
    setMessage,
  ])

  // When group changes, reset and load initial items
  useEffect(() => {
    if (!group) {
      updateItem({reset: true})
      if (isMountedRef.current) {
        setNewFrom(0)
        setLoading(false)
        setMessage("")
      }
      groupKeyRef.current = ""
      oldestTimestampRef.current = Date.now()
      needsMoreItemsRef.current = false
      return
    }

    if (groupKeyRef.current === group.key) return
    groupKeyRef.current = group.key

    if (isMountedRef.current) {
      setScrollToEnd(true)
      setLoading(false)
      setMessage("")
      setNewFrom(0)
    }

    if (group.bookmarks) return

    if (isMountedRef.current) setLoading(true)

    const from = Date.now()
    const initialItems = getGroupItems(group, feedsRef.current, from, 10)

    // Log what days are loaded for this group's feeds and what was found
    const loadedDays = {}
    for (const feedUrl of group.feeds || []) {
      const feed = feedsRef.current[feedUrl]
      loadedDays[feedUrl] = feed && feed.items ? Object.keys(feed.items) : []
    }
    logEvent("GROUP_OPEN", {
      group: group.key,
      latest: group.latest,
      latestDay: (() => {
        const t = new Date(group.latest || 0)
        return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
      })(),
      from,
      found: initialItems.length,
      loadedDays,
    })

    // Reset state
    updateItem({reset: true})
    oldestTimestampRef.current = from

    // Load initial items
    if (initialItems.length > 0) {
      renderItems(initialItems)
      oldestTimestampRef.current =
        initialItems[initialItems.length - 1].timestamp
      setNewFrom(initialItems[0].key)
      setLoading(false)
      // Set up observer after items are rendered
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          setupLoadMoreObserver()
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    }

    if (maxHistoryReached) {
      setLoading(false)
      setMessage("No more items available for this group.")
    } else {
      requestMoreHistory()
      needsMoreItemsRef.current = true
    }
  }, [
    group,
    renderItems,
    setupLoadMoreObserver,
    setMessage,
    maxHistoryReached,
    requestMoreHistory,
  ])

  // When feeds change and a group is open, render any items that have arrived
  // in feedsRef but haven't been rendered yet. This catches two cases:
  //   1. requestDay items whose timestamps are <= g.latest, so checkForNewItems
  //      skips them even though they haven't been rendered yet.
  //   2. Items that arrive from itemHandler before the background loader has
  //      started (feedsLoaded not yet true) which historyDayLoaded can't catch.
  useEffect(() => {
    if (!group) return

    const latestItems = getGroupItems(group, feedsRef.current, Date.now(), 50)
    const unrendered = latestItems.filter(
      item => !itemsRef.current.keys.includes(item.key),
    )
    if (unrendered.length === 0) return

    renderItems(unrendered)
    needsMoreItemsRef.current = false
    setLoading(false)
    setMessage("")
    const oldestInBatch = unrendered[unrendered.length - 1].timestamp
    if (oldestInBatch < oldestTimestampRef.current) {
      oldestTimestampRef.current = oldestInBatch
    }

    setTimeout(() => {
      if (isMountedRef.current) setupLoadMoreObserver()
    }, 100)
  }, [feeds, group, renderItems, setupLoadMoreObserver, setMessage])

  // Re-render bookmark list when bookmarkItems changes (add or remove)
  useEffect(() => {
    if (!group?.bookmarks) return

    updateItem({reset: true})
    const sorted = Object.values(bookmarkItems || {})
      .filter(item => item && item.guid)
      .sort((a, b) => b.timestamp - a.timestamp)
    for (const item of sorted) {
      updateItem(item)
    }
  }, [bookmarkItems, group])

  return (
    <Container maxWidth="md">
      {loading && (
        <Box sx={{display: "flex", justifyContent: "center", p: 4}}>
          <CircularProgress />
        </Box>
      )}
      <Grid container>
        {group &&
          items &&
          items.all.map(i => (
            <Item
              key={i.key}
              item={i}
              itemRefs={itemRefs}
              newFrom={
                newFrom !== 0 &&
                items.all.findIndex(i => i.key === newFrom) <
                  items.all.length - 1
                  ? newFrom
                  : 0
              }
              isBookmarked={bookmarkItems ? i.guid in bookmarkItems : false}
              isBookmarkGroup={!!group?.bookmarks}
              bookmarkGroup={bookmarkGroup}
              user={user}
            />
          ))}
      </Grid>
    </Container>
  )
}

export default ItemList
