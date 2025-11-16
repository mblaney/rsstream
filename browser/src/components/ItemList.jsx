import {useCallback, useEffect, useReducer, useRef, useState} from "react"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import {init, reducer} from "../utils/reducer.js"
import Item from "./Item"

const ItemList = ({
  group,
  groups,
  setGroupStats,
  resetGroup,
  currentKeys,
  newKeys,
  itemFeeds,
  loadMoreItems,
  feeds,
  updateStart,
  setUpdateStart,
}) => {
  const sort = (a, b) => a.timestamp - b.timestamp
  const [items, updateItem] = useReducer(reducer(sort), init)
  const [groupKey, setGroupKey] = useState("")
  const [newFrom, setNewFrom] = useState(0)
  const [scrollToEnd, setScrollToEnd] = useState(false)
  const itemListRef = useRef()
  const itemRefs = useRef(new Map())
  const firstKeyIndex = useRef(0)
  const loadKeyIndex = useRef(10)
  const lastKey = useRef(Date.now())
  const loadMore = useRef(0)
  const watchStart = useRef()
  const watchEnd = useRef()

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

    if (itemListRef.current) {
      itemListRef.current.scrollIntoView({block: "end"})
    }
    document.body.onscroll = () => {
      setTimeout(() => {
        setScrollToEnd(false)
        document.body.onscroll = null
      }, 3000)
    }
  }, [scrollToEnd, items])

  useEffect(() => {
    if (!updateStart) return

    setUpdateStart(false)

    const update = async () => {
      // Stop watching the current target item.
      const target = itemRefs.current.get(loadMore.current)
      if (target && watchStart.current) watchStart.current.unobserve(target)

      while (firstKeyIndex.current < loadKeyIndex.current) {
        if (firstKeyIndex.current >= currentKeys.length) break

        const key = currentKeys[firstKeyIndex.current++]
        if (!key) continue

        const {url, day} = itemFeeds.get(key)
        if (!url || !day) continue

        const feed = feeds.get(url)
        if (!feed || !feed.items || !feed.items[day]) continue

        const item = feed.items[day][key]
        if (!item) continue

        updateItem({
          key,
          title: item.title,
          content: item.content,
          author: item.author,
          category: item.category ? Object.keys(item.category) : null,
          enclosure: mapEnclosure(item.enclosure),
          permalink: item.permalink,
          guid: item.guid,
          timestamp: item.timestamp,
          feedUrl: feed.url,
          feedTitle: feed.title ? feed.title : "",
          feedImage: feed.image ? feed.image : "",
          url: item.url,
        })
      }
      // Wait for the ref to be added for the new loadMore item.
      setTimeout(() => {
        watchStart.current = new IntersectionObserver(e => {
          if (e[0].isIntersecting) {
            // Load 10 items before current first key.
            loadKeyIndex.current = firstKeyIndex.current + 10
            // currentKeys is the available keys for the group and itemRefs is
            // the items that have already been rendered.
            if (currentKeys.length - itemRefs.current.size <= 10) {
              // loadMoreItems sets updateStart.
              loadMoreItems()
            } else {
              setUpdateStart(true)
            }
          }
        })
        // Find a new target to trigger loading more items. Aim for the third
        // item from the top, but may not be enough items.
        let aim = 0
        for (let i = firstKeyIndex.current; i >= 0; i--) {
          const target = itemRefs.current.get(currentKeys[i])
          if (target) {
            watchStart.current.observe(target)
            loadMore.current = currentKeys[i]
            if (aim++ === 3) break
          }
        }
      }, 1000)
    }
    update()
  }, [
    updateStart,
    setUpdateStart,
    loadMoreItems,
    currentKeys,
    itemFeeds,
    feeds,
    mapEnclosure,
  ])

  useEffect(() => {
    if (!group) {
      firstKeyIndex.current = 0
      loadKeyIndex.current = 10
      loadMore.current = 0
      updateItem({reset: true})
      setNewFrom(0)
      setGroupKey("")
      return
    }

    if (groupKey === group.key || currentKeys.length === 0) return

    setGroupKey(group.key)
    resetGroup(group.key)
    setScrollToEnd(true)
    setUpdateStart(true)
  }, [group, groupKey, currentKeys, resetGroup, setUpdateStart])

  useEffect(() => {
    if (!groups || newKeys.length === 0) return

    if (!watchEnd.current) {
      watchEnd.current = new IntersectionObserver(e => {
        if (e[0].isIntersecting) setTimeout(() => setNewFrom(0), 5000)
      })
    }

    ;(async () => {
      const groupStats = new Map()
      groups.all.forEach(g =>
        groupStats.set(g.key, {
          count: !group || g.key !== group.key ? g.count : 0,
          latest: 0,
          text: "",
          author: "",
          timestamp: 0,
        }),
      )
      let earliest = 0
      let latest = 0
      for (let i = 0; i < newKeys.length; i++) {
        const key = newKeys[i]
        if (!key) continue

        const {url, day} = itemFeeds.get(key)
        if (!url || !day) continue

        const feed = feeds.get(url)
        if (!feed || !feed.items || !feed.items[day]) continue

        const item = feed.items[day][key]
        if (!item) continue

        groups.all.forEach(g => {
          if (!g.feeds.includes(item.url)) return

          let stats = groupStats.get(g.key)
          if (item.timestamp > stats.latest) {
            stats.latest = item.timestamp
            stats.author = item.author
            stats.timestamp = item.timestamp
            const tag = /(<([^>]+)>)/g
            const text = item.title
              ? item.title.replace(tag, "")
              : item.content.replace(tag, "")
            stats.text = text.length > 200 ? text.substring(0, 200) : text
          }
          if (!group || g.key !== group.key) stats.count++
          groupStats.set(g.key, stats)
        })
        if (!group || !group.feeds.includes(item.url)) continue

        updateItem({
          key,
          title: item.title,
          content: item.content,
          author: item.author,
          category: item.category ? Object.keys(item.category) : null,
          enclosure: mapEnclosure(item.enclosure),
          permalink: item.permalink,
          guid: item.guid,
          timestamp: item.timestamp,
          feedUrl: feed.url,
          feedTitle: feed.title ? feed.title : "",
          feedImage: feed.image ? feed.image : "",
          url: item.url,
        })
        if (key < earliest || earliest === 0) earliest = key
        if (key > latest || latest === 0) latest = key
      }

      setTimeout(() => {
        if (earliest !== 0 && newFrom === 0) {
          // If there is no current newFrom marker then mark as new from
          // earliest, the marker will be removed when scrolled to the end.
          setNewFrom(earliest)
        }
        if (latest !== 0) {
          // Stop watching the current last key.
          const currentTarget = itemRefs.current.get(lastKey.current)
          if (currentTarget) watchEnd.current.unobserve(currentTarget)
          lastKey.current = latest
          const newTarget = itemRefs.current.get(latest)
          if (newTarget) watchEnd.current.observe(newTarget)
        }
        setGroupStats(groupStats)
      }, 5000)
    })()
  }, [
    group,
    groups,
    newKeys,
    itemFeeds,
    setGroupStats,
    newFrom,
    feeds,
    mapEnclosure,
  ])

  return (
    <Container maxWidth="md">
      <Grid container ref={itemListRef}>
        {group &&
          items &&
          items.all.map(i => (
            <Item key={i.key} item={i} itemRefs={itemRefs} newFrom={newFrom} />
          ))}
      </Grid>
    </Container>
  )
}

export default ItemList
