import {useCallback, useEffect, useState} from "react"
import {Settings, LoginCodes, EditCache} from "@mblaney/holster-browser"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import {buildDate} from "../utils/buildDate.js"

const AppSettings = ({user, host, code, mode, setMode, appBar}) => {
  const [account, setAccount] = useState(null)
  const [cacheData, setCacheData] = useState(null)

  useEffect(() => {
    if (!user || !host || !code) return

    const updateAccount = acc => {
      if (acc) setAccount(acc)
    }

    user.get([host, "accounts"]).next(code).on(updateAccount, true)

    return () => {
      user.get([host, "accounts"]).next(code).off(updateAccount)
    }
  }, [user, host, code])

  const loadCacheData = useCallback(async () => {
    if (!("caches" in window)) return

    const loadCache = async name => {
      if (!(await caches.has(name))) return {count: 0, size: 0, items: []}
      const cache = await caches.open(name)
      const keys = await cache.keys()
      let totalSize = 0
      const items = []
      for (const request of keys) {
        const response = await cache.match(request)
        const cl = response?.headers.get("content-length")
        const size = cl ? parseInt(cl, 10) : 0
        const name = response?.headers.get("x-cache-name") || null
        totalSize += size
        items.push({url: request.url, size, name})
      }
      items.sort((a, b) => b.size - a.size)
      return {count: keys.length, size: totalSize, items}
    }

    const [audio, video] = await Promise.all([
      loadCache("audio"),
      loadCache("video"),
    ])
    setCacheData({audio, video})
  }, [])

  useEffect(() => {
    loadCacheData()
  }, [loadCacheData])

  const removeItem = async (cacheName, url) => {
    const cache = await caches.open(cacheName)
    await cache.delete(url)
    loadCacheData()
  }

  const clearCache = async cacheName => {
    await caches.delete(cacheName)
    loadCacheData()
  }

  return (
    <Settings
      user={user}
      mode={mode}
      setMode={setMode}
      appBar={{
        ...appBar,
        menuItems: [
          {label: "Groups", onClick: () => (window.location = "/")},
          {label: "Help", onClick: () => (window.location = "/help")},
        ],
      }}
      buildDate={buildDate}
    >
      <LoginCodes user={user} host={host} code={code} />
      {account && account.feeds && (
        <Typography sx={{m: 1}}>
          {(account.subscribed ?? 0) >= account.feeds ? (
            "No more feeds can be subscribed to"
          ) : (
            <>
              <strong>
                {account.feeds - (account.subscribed ?? 0)}/{account.feeds}
              </strong>{" "}
              feeds can be subscribed to
            </>
          )}
        </Typography>
      )}
      <Typography sx={{m: 1}}>
        <Link href="https://github.com/sponsors/mblaney">
          Sponsor the project
        </Link>{" "}
        to add login codes and feeds
      </Typography>
      <EditCache
        cacheData={cacheData}
        removeItem={removeItem}
        clearCache={clearCache}
      />
    </Settings>
  )
}

export default AppSettings
