import {useCallback, useEffect, useReducer, useRef, useState} from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import {init, reducer} from "../utils/reducer.js"
import {logEvent} from "../utils/debugEvents"
import AddFeed from "./AddFeed"
import EditGroup from "./EditGroup"
import FeedList from "./FeedList"
import GroupList from "./GroupList"
import ItemList from "./ItemList"
import SearchAppBar from "./SearchAppBar"

const Display = ({
  user,
  host,
  code,
  mode,
  setMode,
  feeds,
  debugMode,
  requestMoreHistory,
  historyDayLoaded,
  maxHistoryReached,
  requestDay,
}) => {
  const sortByLatest = (a, b) => b.latest - a.latest
  const [groups, updateGroup] = useReducer(reducer(sortByLatest), init)
  const [groupList, setGroupList] = useState(true)
  const [group, setGroup] = useState(null)
  const [currentGroup, setCurrentGroup] = useState("")
  const [message, setMessage] = useState("")
  const [feedList, setFeedList] = useState(false)
  const [addFeed, setAddFeed] = useState(false)
  const [newItems, setNewItems] = useState([])
  const [groupsLoaded, setGroupsLoaded] = useState(false)
  const statsRef = useRef(new Map())
  const feedsRef = useRef(feeds)
  feedsRef.current = feeds // Update synchronously so child effects always see current feeds
  const groupsRef = useRef(groups)

  const createGroup = () => {
    setGroupList(false)
    setCurrentGroup("")
    setFeedList(true)
    setAddFeed(false)
    setGroup(null)
    setMessage("")
    window.history.pushState(null, "")
  }

  const editGroup = groupName => {
    setGroupList(false)
    setCurrentGroup(groupName)
    setFeedList(false)
    setAddFeed(false)
    setGroup(null)
    setMessage("")
    window.history.pushState(null, "")
  }

  const createFeed = () => {
    setGroupList(false)
    setCurrentGroup("")
    setFeedList(true)
    setAddFeed(true)
    setGroup(null)
    setMessage("")
    window.history.pushState(null, "")
  }

  const showGroup = g => {
    setGroup(g)
    window.history.pushState(null, "")
  }

  const showGroupList = reset => {
    if (reset) {
      window.location = "/"
      return
    }

    setGroupList(true)
    setCurrentGroup("")
    setFeedList(false)
    setAddFeed(false)
    setMessage("")
    setGroup(null)
    window.scrollTo(0, 0)
  }

  // The above functions are all display modes of this component and avoid
  // rendering so that the item list doesn't need re-mapping which is slow.
  useEffect(() => {
    const handler = () => showGroupList(false)
    window.addEventListener("popstate", handler)
    return () => window.removeEventListener("popstate", handler)
  }, [])

  const resetGroup = useCallback(
    key => {
      if (!user || !key || !group || group.count === 0) return

      user
        .get("public")
        .next("groups")
        .next(key)
        .next("count")
        .put(0, err => {
          if (err) console.error(err)
        })
    },
    [user, group],
  )

  const setGroupStats = useCallback(
    async groupStats => {
      if (!user) return

      for (const [key, stats] of groupStats.entries()) {
        if (!key || !stats || stats.latest === 0) continue

        const err = await new Promise(res => {
          user.get("public").next("groups").next(key).put(stats, res)
        })
        if (err) console.error(err)
      }
    },
    [user],
  )

  // Detect new items and update group stats. Called when feeds update and on
  // a 10-second interval to catch items that arrive after the initial load.
  const checkForNewItems = useCallback(() => {
    const feeds = feedsRef.current
    const groups = groupsRef.current

    if (Object.keys(feeds).length === 0 || !groups || groups.all.length === 0)
      return

    const foundNewItems = []

    // Collect new stats across all loaded days for each group.
    groups.all.forEach(g => {
      if (!g.feeds) return
      // Use the per-group stored latest as the baseline so items already counted
      // before a reload aren't re-counted, while still detecting items that are
      // new for this group but not for others.
      const groupLastCheck = g.latest || 0
      g.feeds.forEach(url => {
        const f = feeds[url]
        if (!f || !f.items) return

        for (const [day, dayItems] of Object.entries(f.items)) {
          if (!dayItems) continue
          for (const [itemKey, item] of Object.entries(dayItems)) {
            if (!item || !item.timestamp) continue
            if (item.timestamp <= groupLastCheck) continue

            foundNewItems.push({key: itemKey, feedUrl: url, day: Number(day)})

            const tag = /(<([^>]+)>)/g
            const text = item.title
              ? item.title.replace(tag, "")
              : item.content
                ? item.content.replace(tag, "")
                : ""

            // Only overwrite stats for this group if this item is more recent.
            const current = statsRef.current.get(g.key)
            if (!current || item.timestamp >= current.latest) {
              statsRef.current.set(g.key, {
                count: current ? current.count + 1 : g.count + 1,
                latest: item.timestamp,
                author: item.author,
                timestamp: item.timestamp,
                text: text.length > 200 ? text.substring(0, 200) : text,
              })
            } else {
              statsRef.current.set(g.key, {
                ...current,
                count: current.count + 1,
              })
            }
          }
        }
      })
    })

    // Update new items for ItemList to display
    if (foundNewItems.length > 0) {
      setNewItems(prev => [...prev, ...foundNewItems])
    }

    // Immediately update local state so subsequent calls use the new latest,
    // then persist to Holster.
    if (statsRef.current.size > 0) {
      for (const [key, stats] of statsRef.current.entries()) {
        updateGroup({key, ...stats})
        logEvent("GROUP_STATS_UPDATED", {
          group: key,
          latest: stats.latest,
          day: (() => {
            const t = new Date(stats.latest)
            return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
          })(),
          text: stats.text ? stats.text.substring(0, 40) : "",
        })
      }
      setGroupStats(statsRef.current)
      statsRef.current = new Map()
    }
  }, [setGroupStats, updateGroup])

  // Re-run stats check whenever feeds or groups change so new items are
  // reflected immediately rather than waiting for the interval.
  useEffect(() => {
    groupsRef.current = groups
    checkForNewItems()
  }, [feeds, groups, checkForNewItems])

  // Reset group unread count when group is selected
  useEffect(() => {
    if (group) {
      resetGroup(group.key)
    }
  }, [group, resetGroup])

  // Also run stats check on a 10-second interval for items that arrive via
  // the persistent wire listener after the initial feed load.
  useEffect(() => {
    const intervalId = setInterval(checkForNewItems, 10000)
    return () => clearInterval(intervalId)
  }, [checkForNewItems])

  // Initial effect to set up the existing groups for the user.
  useEffect(() => {
    if (!user) return

    const update = (name, g) => {
      if (!name) return

      if (!g) {
        updateGroup({
          key: name,
          feeds: [],
          count: 0,
          latest: 0,
          text: "",
          author: "",
          timestamp: 0,
        })
        return
      }

      // Only include fields present in g so the reducer's merge preserves
      // existing values (e.g. feeds) when a partial update arrives.
      const groupUpdate = {key: name}
      let groupFeeds = null
      if (g.feeds) {
        groupFeeds = []
        for (const [url, add] of Object.entries(g.feeds)) {
          if (add) groupFeeds.push(url)
        }
        groupUpdate.feeds = groupFeeds
      }
      if (g.count !== undefined) groupUpdate.count = g.count
      if (g.latest !== undefined) groupUpdate.latest = g.latest
      if (g.text !== undefined) groupUpdate.text = g.text
      if (g.author !== undefined) groupUpdate.author = g.author
      if (g.timestamp !== undefined) groupUpdate.timestamp = g.timestamp
      updateGroup(groupUpdate)

      // Request the day containing the latest item so it's loaded before the
      // user opens the group. Holster delivers partial updates so feeds and
      // latest may arrive in separate callbacks — fall back to the current
      // known group state for whichever field is missing from this update.
      const knownGroup = groupsRef.current.all.find(gr => gr.key === name)
      const effectiveLatest =
        g.latest > 0 ? g.latest : (knownGroup?.latest ?? 0)
      const effectiveFeeds =
        groupFeeds && groupFeeds.length > 0
          ? groupFeeds
          : (knownGroup?.feeds ?? [])
      if (effectiveLatest > 0 && effectiveFeeds.length > 0) {
        const t = new Date(effectiveLatest)
        const latestDay = Date.UTC(
          t.getUTCFullYear(),
          t.getUTCMonth(),
          t.getUTCDate(),
        )
        requestDay(latestDay, effectiveFeeds)
      }
    }

    // Track per-group listeners for cleanup.
    const groupListeners = new Map()

    user.get("public").next("groups", data => {
      if (!data) {
        setGroupsLoaded(true)
        return
      }

      for (const name of Object.keys(data)) {
        if (name === "_" || groupListeners.has(name)) continue
        const handler = g => update(name, g)
        groupListeners.set(name, handler)
        user.get("public").next("groups").next(name).on(handler, true)
      }
      setGroupsLoaded(true)
    })

    return () => {
      for (const [name, handler] of groupListeners.entries()) {
        user.get("public").next("groups").next(name).off(handler)
      }
    }
  }, [user, requestDay])

  return (
    <>
      {user.is && (
        <SearchAppBar
          page="display"
          showGroupList={showGroupList}
          createGroup={createGroup}
          editGroup={editGroup}
          createFeed={createFeed}
          mode={mode}
          setMode={setMode}
          title={group ? group.key : ""}
        />
      )}
      {groupList && !group && (
        <GroupList
          groups={groups}
          groupsLoaded={groupsLoaded}
          setGroup={showGroup}
        />
      )}
      {currentGroup && (
        <EditGroup
          user={user}
          code={code}
          groups={groups}
          currentGroup={currentGroup}
          showGroupList={showGroupList}
          appFeeds={feeds}
        />
      )}
      {feedList && !addFeed && (
        <FeedList
          user={user}
          code={code}
          groups={groups}
          showGroupList={showGroupList}
          appFeeds={feeds}
        />
      )}
      {feedList && addFeed && (
        <AddFeed user={user} host={host} code={code} debugMode={debugMode} />
      )}
      <Box sx={{display: "flex", justifyContent: "center", p: 4}}>
        <Typography>{message}</Typography>
      </Box>
      <ItemList
        group={group}
        feeds={feeds}
        newItems={newItems}
        setMessage={setMessage}
        requestMoreHistory={requestMoreHistory}
        historyDayLoaded={historyDayLoaded}
        maxHistoryReached={maxHistoryReached}
      />
    </>
  )
}

export default Display
