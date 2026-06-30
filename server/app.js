import crypto from "crypto"
import express from "express"
import fetch from "node-fetch"
import path from "path"
import {fileURLToPath} from "url"
import fs from "fs/promises"
import Holster from "@mblaney/holster/src/holster.js"
import routerAdmin from "@mblaney/holster-router"

const holster = Holster({
  secure: true,
  memoryLimit: 1536,
  port: 8765,
  userLimit: true,
})
const user = holster.user()
const dirname = path.dirname(fileURLToPath(import.meta.url))
const HASH_CACHE_FILE = path.join(dirname, ".hash_cache.json")
const USER_STORAGE_FILE = ".user_storage.json"
const HOST_STORAGE_LIMIT = parseInt(process.env.HOST_STORAGE_LIMIT, 10) || 1024
const addFeedUrl = process.env.ADD_FEED_URL
const addFeedID = process.env.ADD_FEED_ID
const addFeedApiKey = process.env.ADD_FEED_API_KEY

const username = process.env.HOLSTER_USER_NAME ?? "host"
const password = process.env.HOLSTER_USER_PASSWORD ?? "password"

const {router, admin} = routerAdmin(holster, {
  username,
  password,
  hostStorageLimit: HOST_STORAGE_LIMIT,
  appHost: process.env.APP_HOST,
  mailFrom: process.env.MAIL_FROM,
  mailBcc: process.env.MAIL_BCC,
  federatedHosts: process.env.FEDERATED_HOSTS,
  accountDefaults: {feeds: 10, subscribed: 0},
})

function basicAuth(req, res, next) {
  const auth = (req.headers.authorization || "").split(" ")[1] || ""
  const [u, p] = Buffer.from(auth, "base64").toString().split(":")
  if (u === username && p === password) {
    next()
  } else {
    res.status(401).end()
  }
}

// removeDays is a set of days where old data has already been removed so that
// holster doesn't need to be checked every time an item is added.
const removeDays = new Set()

// Cleanup queue to batch cleanup operations
const cleanupQueue = new Set()
const processingCleanup = new Set() // Track days currently being processed
let cleanupTimer = null

// Application-level caching and deduplication

// Request deduplication - prevent duplicate requests for same item
const pendingRequests = new Map()

// Content hash cache to avoid processing unchanged data (2-week TTL matching item age limit)
const contentHashCache = new Map()
const HASH_CACHE_TTL = 1209600000 // 2 weeks TTL for content hashes

// Load hash cache from disk on startup
async function loadHashCache() {
  try {
    const data = await fs.readFile(HASH_CACHE_FILE, "utf8")
    const cached = JSON.parse(data)
    const now = Date.now()

    for (const [key, value] of Object.entries(cached)) {
      // Only restore entries that haven't expired
      if (now - value.timestamp <= HASH_CACHE_TTL) {
        contentHashCache.set(key, value)
      }
    }

    console.log(`Loaded ${contentHashCache.size} entries from hash cache`)
  } catch (err) {
    // File doesn't exist on first run or is corrupted - that's fine
    if (err.code !== "ENOENT") {
      console.log("Error loading hash cache:", err.message)
    }
  }
}

// Save hash cache to disk periodically
async function saveHashCache() {
  try {
    const cached = {}
    for (const [key, value] of contentHashCache.entries()) {
      cached[key] = value
    }
    await fs.writeFile(HASH_CACHE_FILE, JSON.stringify(cached), "utf8")
  } catch (err) {
    console.log("Error saving hash cache:", err.message)
  }
}

// Processing statistics (queue removed - now processing directly)
let processingStats = {
  averageProcessingTime: 0,
  totalProcessed: 0,
  lastProcessedTime: 0,
  delayThreshold: 2000,
  currentDelay: 0,
  lastReset: Date.now(),
}

// Performance monitoring
let requestStats = {
  totalRequests: 0,
  averageTime: 0,
  lastReset: Date.now(),
}

// Database operation monitoring
let dbStats = {
  totalOps: 0,
  slowOps: 0,
  averageDbTime: 0,
  errorCount: 0,
  lastReset: Date.now(),
}

// Periodic cache cleanup and persistence
setInterval(async () => {
  const now = Date.now()
  // Clean up expired content hash cache entries
  const hashExpiredKeys = []
  for (const [key, value] of contentHashCache.entries()) {
    if (now - value.timestamp > HASH_CACHE_TTL) {
      hashExpiredKeys.push(key)
    }
  }
  hashExpiredKeys.forEach(key => contentHashCache.delete(key))

  // Clean up stale pending requests (over 10 minutes old)
  const staleKeys = []
  for (const [key, value] of pendingRequests.entries()) {
    if (now - value.startTime > 600000) {
      staleKeys.push(key)
    }
  }
  staleKeys.forEach(key => pendingRequests.delete(key))

  if (hashExpiredKeys.length + staleKeys.length > 0) {
    console.log(
      `Cleaned up ${hashExpiredKeys.length} content hash entries, ${staleKeys.length} stale requests`,
    )
  }

  // Save hash cache to disk
  await saveHashCache()
}, 60000) // Every minute

// Memory and performance monitoring
setInterval(async () => {
  const used = process.memoryUsage()
  const uptime = process.uptime()

  if (user.is) {
    try {
      const storageData = JSON.parse(
        await fs.readFile(USER_STORAGE_FILE, "utf8"),
      )
      const hostBytes = storageData[user.is.pub] ?? 0
      const hostMB = Math.round(hostBytes / 1048576)
      const pct = Math.round((hostMB / HOST_STORAGE_LIMIT) * 100)
      const warning =
        hostMB >= HOST_STORAGE_LIMIT * 0.9 ? " WARNING: near limit" : ""
      console.log(
        `[MONITOR] Host storage: ${hostMB}MB / ${HOST_STORAGE_LIMIT}MB (${pct}%)${warning}`,
      )
    } catch (err) {
      if (err.code !== "ENOENT")
        console.log("[MONITOR] Error reading host storage:", err.message)
    }
  }

  console.log(
    `[MONITOR] Memory: ${Math.round(used.rss / 1024 / 1024)}MB RSS, ${Math.round(used.heapUsed / 1024 / 1024)}MB Heap`,
  )
  console.log(
    `[MONITOR] Requests: ${requestStats.totalRequests} total, avg: ${Math.round(requestStats.averageTime)}ms`,
  )
  console.log(
    `[MONITOR] Database: ${dbStats.totalOps} ops, ${dbStats.slowOps} slow (>2s), avg: ${Math.round(dbStats.averageDbTime)}ms, errors: ${dbStats.errorCount}`,
  )
  console.log(
    `[MONITOR] Processing: processed=${processingStats.totalProcessed}, avg=${Math.round(processingStats.averageProcessingTime)}ms, delay=${processingStats.currentDelay}ms, pending=${pendingRequests.size}`,
  )
  console.log(
    `[MONITOR] Caches: removeDays=${removeDays.size}, cleanup=${cleanupQueue.size}, processing=${processingCleanup.size}, contentHash=${contentHashCache.size}`,
  )
  console.log(`[MONITOR] Uptime: ${Math.round(uptime)}s`)

  // Reset stats once per day
  if (Date.now() - requestStats.lastReset > 86400000) {
    requestStats = {totalRequests: 0, averageTime: 0, lastReset: Date.now()}
    dbStats = {
      totalOps: 0,
      slowOps: 0,
      averageDbTime: 0,
      errorCount: 0,
      lastReset: Date.now(),
    }
    processingStats = {
      averageProcessingTime: 0,
      totalProcessed: 0,
      lastProcessedTime: 0,
      delayThreshold: 2000,
      currentDelay: 0,
      lastReset: Date.now(),
    }
  }
}, 60000) // Every minute

// Load hash cache from disk to avoid reprocessing items on restart
await loadHashCache()
scheduleDailySentinelJob()

const app = express()
app.use(express.json())
app.use(express.static(path.join(dirname, "../browser/build")))
app.use(router)
app.use("/private", basicAuth)
app.use("/private", admin)
app.listen(3000)

app.get("/", (req, res) => {
  res.sendFile(path.join(dirname, "../browser/build", "index.html"))
})

// These redirects are required because the browser does local first routing,
// which is fine except for an initial request or hard refresh, in which case
// the server needs to respond to the request.
app.get("/invite", (req, res) => {
  res.redirect("/?redirect=invite")
})

app.get("/register", (req, res) => {
  res.redirect("/?redirect=register")
})

app.get("/login", (req, res) => {
  res.redirect("/?redirect=login")
})

app.get("/settings", (req, res) => {
  res.redirect("/?redirect=settings")
})

app.get("/help", (req, res) => {
  res.redirect("/?redirect=help")
})

app.get("/validate-email", (req, res) => {
  res.redirect(
    `/?redirect=validate-email&code=${req.query.code}&validate=${req.query.validate}`,
  )
})

app.get("/reset-password", (req, res) => {
  res.redirect("/?redirect=reset-password")
})

app.get("/update-password", (req, res) => {
  res.redirect(
    `/?redirect=update-password&username=${req.query.username}&code=${req.query.code}&reset=${req.query.reset}`,
  )
})

app.post("/add-feed", async (req, res) => {
  const code = req.body.code
  if (!code) {
    res.status(400).send({error: "code required"})
    return
  }
  if (!req.body.url) {
    res.status(400).send({error: "url required"})
    return
  }
  if (!user.is) {
    res.status(500).send("Host error")
    return
  }

  const account = await new Promise(resolve => {
    user.get("accounts").next(code, resolve)
  })
  if (!account) {
    res.status(404).send({error: "Account not found"})
    return
  }

  const url = await holster.SEA.verify(req.body.url, account)
  if (!url) {
    res.status(400).send({error: "Could not verify signed url"})
    return
  }

  if (account.subscribed === account.feeds) {
    res
      .status(400)
      .send(`Account currently has a limit of ${account.feeds} feeds`)
    return
  }

  if (req.body.fake) {
    const data = {
      title: url,
      description: "",
      html_url: url,
      language: "",
      image: "",
      subscriber_count: 1,
    }
    user
      .get("feeds")
      .next(url)
      .put(data, err => {
        if (err) {
          console.log(err)
          res.status(500).send("Error saving feed")
          return
        }

        user
          .get("accounts")
          .next(code)
          .put({subscribed: account.subscribed + 1}, err => {
            if (err) {
              console.log(err)
              res.status(500).send("Error adding to account subscribed")
              return
            }

            res.send({add: {url, title: url}})
          })
      })
    return
  }

  if (!addFeedUrl || !addFeedID || !addFeedApiKey) {
    res.status(500).send({error: "Could not add feed, env not set"})
    return
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    let add
    try {
      add = await fetch(addFeedUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `id=${addFeedID}&key=${addFeedApiKey}&action=add-feed&xmlUrl=${encodeURIComponent(url)}`,
        signal: controller.signal,
      })
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === "AbortError") {
        console.log("Timeout adding feed", url)
        res
          .status(503)
          .send({error: "Feed request timed out, please try again"})
        return
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }
    if (!add.ok) {
      console.log("Error from", addFeedUrl, url, add.statusText)
      res.status(500).send({error: "Error adding feed"})
      return
    }

    const feed = await add.json()
    if (feed.error) {
      console.log("Error from", addFeedUrl, url)
      console.log(feed.error)
      res.status(400).send({error: feed.error})
      return
    }

    if (!feed.add || !feed.add.url || !feed.add.title) {
      console.log("No feed data from", addFeedUrl, url)
      console.log(feed)
      res.status(400).send({error: "A feed wasn't found at this address"})
      return
    }

    const data = {
      title: feed.add.title,
      description: feed.add.description ?? "",
      html_url: feed.add.html_url ?? "",
      language: feed.add.language ?? "",
      image: feed.add.image ?? "",
      subscriber_count: 1,
    }
    user
      .get("feeds")
      .next(feed.add.url)
      .put(data, err => {
        if (err) {
          console.log(err)
          res.status(500).send("Error saving feed")
          return
        }

        user
          .get("accounts")
          .next(code)
          .put({subscribed: account.subscribed + 1}, err => {
            if (err) {
              console.log(err)
              res.status(500).send("Error adding to account subscribed")
              return
            }

            res.send(feed)
          })
      })
  } catch (error) {
    console.log(error)
    res.status(500).send({error: "Error adding feed"})
  }
})

app.post("/add-subscriber", async (req, res) => {
  const code = req.body.code
  if (!code) {
    res.status(400).send({error: "code required"})
    return
  }
  if (!req.body.url) {
    res.status(400).send({error: "url required"})
    return
  }
  if (!user.is) {
    res.status(500).send("Host error")
    return
  }

  const account = await new Promise(resolve => {
    user.get("accounts").next(code, resolve)
  })
  if (!account) {
    res.status(404).send({error: "Account not found"})
    return
  }

  const url = await holster.SEA.verify(req.body.url, account)
  if (!url) {
    res.status(400).send({error: "Could not verify signed url"})
    return
  }

  if (account.subscribed === account.feeds) {
    res
      .status(400)
      .send(`Account currently has a limit of ${account.feeds} feeds`)
    return
  }

  const feed = await new Promise(resolve => {
    user.get("feeds").next(url, {".": "subscriber_count"}, resolve)
  })
  if (!feed) {
    console.log("Feed not found for add-subscriber", url)
    res.end()
    return
  }

  user
    .get("feeds")
    .next(url)
    .put({subscriber_count: feed.subscriber_count + 1}, err => {
      if (err) {
        console.log(err)
        res.status(500).send("Error adding to feed subscriber_count")
        return
      }

      user
        .get("accounts")
        .next(code)
        .put({subscribed: account.subscribed + 1}, err => {
          if (err) {
            console.log(err)
            res.status(500).send("Error adding to account subscribed")
            return
          }

          res.end()
        })
    })
})

app.post("/remove-subscriber", async (req, res) => {
  const code = req.body.code
  if (!code) {
    res.status(400).send({error: "code required"})
    return
  }
  if (!req.body.url) {
    res.status(400).send({error: "url required"})
    return
  }
  if (!user.is) {
    res.status(500).send("Host error")
    return
  }

  const account = await new Promise(resolve => {
    user.get("accounts").next(code, resolve)
  })
  if (!account) {
    res.status(404).send({error: "Account not found"})
    return
  }

  const url = await holster.SEA.verify(req.body.url, account)
  if (!url) {
    res.status(400).send({error: "Could not verify signed url"})
    return
  }

  const feed = await new Promise(resolve => {
    user.get("feeds").next(url, {".": "subscriber_count"}, resolve)
  })
  if (!feed) {
    console.log("Feed not found for remove-subscriber", url)
    res.end()
    return
  }

  if (feed.subscriber_count === 0) {
    console.log("remove-subscriber called but subscriber_count is 0", url)
    res.end()
    return
  }

  if (feed.subscriber_count === 1) {
    if (!addFeedUrl || !addFeedID || !addFeedApiKey) {
      console.log("Could not remove feed, env not set")
      return
    }

    try {
      const remove = await fetch(addFeedUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `id=${addFeedID}&key=${addFeedApiKey}&action=remove-feed&xmlUrl=${encodeURIComponent(url)}`,
      })
      if (!remove.ok) {
        console.log("Error from", addFeedUrl, url, remove.statusText)
      }
    } catch (error) {
      console.log(error)
    }
  }

  user
    .get("feeds")
    .next(url)
    .put({subscriber_count: feed.subscriber_count - 1}, err => {
      if (err) {
        console.log(err)
        res.status(500).send("Error removing from subscriber_count")
        return
      }

      user
        .get("accounts")
        .next(code)
        .put({subscribed: account.subscribed - 1}, err => {
          if (err) {
            console.log(err)
            res.status(500).send("Error removing from account subscribed")
            return
          }

          res.end()
        })
    })
})

app.post("/private/remove-feed", (req, res) => {
  if (!req.body.url) {
    res.status(400).send("url required")
    return
  }
  if (!user.is) {
    res.status(500).send("Host error")
    return
  }

  // Don't modify subscriber_count so users can still call remove-subscriber.
  const data = {
    title: "",
    description: "",
    html_url: "",
    language: "",
    image: "",
  }
  user
    .get("feeds")
    .next(req.body.url)
    .put(data, err => {
      if (err) {
        console.log(err)
        res.status(500).send("Error removing feed")
        return
      }

      res.end()
    })
})

app.post("/private/add-item", async (req, res) => {
  const startTime = Date.now()

  if (!req.body.url) {
    res.status(400).send("url required")
    return
  }
  // Also drop items without a guid to avoid duplicates.
  // (SimplePie generates guids if not found in a feed.)
  if (!req.body.guid) {
    res.status(400).send("guid required")
    return
  }

  const now = Date.now()

  // Request deduplication - if same request is already processing
  const itemKey = `${req.body.url}_${req.body.guid}`
  if (pendingRequests.has(itemKey)) {
    res.status(202).json({status: "processing", duplicate: true})
    return
  }

  // Mark as processing
  pendingRequests.set(itemKey, {startTime: now, res})
  if (!user.is) {
    pendingRequests.delete(itemKey)
    res.status(500).send("Host error")
    return
  }

  const twoWeeksAgo = Date.now() - 1209600000
  if (req.body.timestamp < twoWeeksAgo) {
    // Ignore items that are older than 2 weeks.
    pendingRequests.delete(itemKey)
    res.end()
    return
  }

  const data = {
    title: req.body.title ?? "",
    content: req.body.content ?? "",
    author: req.body.author ?? "",
    permalink: req.body.permalink ?? "",
    guid: req.body.guid,
    timestamp: req.body.timestamp,
    url: req.body.url,
  }
  const enclosure = mapEnclosure(req.body.enclosure)
  const category = mapCategory(req.body.category)
  if (enclosure) data.enclosure = enclosure
  if (category) data.category = category
  const dayKey = day(req.body.timestamp)

  // Content hash cache check - avoid processing if data hasn't changed
  const contentHash = createContentHash(data)
  const hashCacheKey = `${req.body.url}_${req.body.guid}`
  const cachedHash = contentHashCache.get(hashCacheKey)

  if (
    cachedHash &&
    cachedHash.hash === contentHash &&
    now - cachedHash.timestamp < HASH_CACHE_TTL
  ) {
    // Content hasn't changed, skip processing
    pendingRequests.delete(itemKey)
    res.status(200).json({status: "unchanged", cached: true})
    return
  }

  // Aggressive throttling to reduce system load
  const pendingDelay = pendingRequests.size * 200
  const systemDelay =
    processingStats.currentDelay > 0
      ? Math.min(processingStats.currentDelay, 10000)
      : 0
  const totalThrottle = Math.min(pendingDelay + systemDelay, 60000)

  if (totalThrottle > 0) {
    await new Promise(resolve => setTimeout(resolve, totalThrottle))
  }

  // Log when content hash has changed and requires queue processing
  if (cachedHash) {
    console.log(
      `[CONTENT-CHANGE] ${req.body.url} guid:${req.body.guid} - hash changed, queuing for processing`,
    )
  } else {
    console.log(
      `[CONTENT-NEW] ${req.body.url} guid:${req.body.guid} - new item, queuing for processing`,
    )
  }

  // Update content hash cache for future change detection
  contentHashCache.set(hashCacheKey, {
    hash: contentHash,
    timestamp: now,
  })

  // Process item directly (no queue)
  await processItem(data, dayKey, itemKey, res)

  const processingTime = Date.now() - startTime - totalThrottle

  // Update performance statistics
  requestStats.totalRequests++
  requestStats.averageTime =
    (requestStats.averageTime * (requestStats.totalRequests - 1) +
      processingTime) /
    requestStats.totalRequests
})

app.post("/private/update-feed-limit", async (req, res) => {
  const code = req.body.code
  if (!code) {
    res.status(400).send("code required")
    return
  }
  const limit = req.body.limit
  if (!limit) {
    res.status(400).send("limit required")
    return
  }
  if (!user.is) {
    res.status(500).send("Host error")
    return
  }

  const account = await new Promise(resolve => {
    user.get("accounts").next(code, resolve)
  })
  if (!account) {
    res.status(404).send("Account not found")
    return
  }
  if (account.validate) {
    res.status(400).send("Email not validated")
    return
  }

  user
    .get("accounts")
    .next(code)
    .put({feeds: limit}, err => {
      if (err) {
        console.log(err)
        res.status(500).send("Error updating feed limit")
        return
      }

      res.end()
    })
})

// Optimized cleanup scheduler to batch operations and limit memory growth
function scheduleCleanup(twoWeeksAgo) {
  const removeKey = day(twoWeeksAgo)

  // Skip if already processed or queued
  if (removeDays.has(removeKey) || cleanupQueue.has(removeKey)) {
    return
  }

  cleanupQueue.add(removeKey)

  // Debounce cleanup operations to batch them
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
  }

  cleanupTimer = setTimeout(async () => {
    const keysToProcess = Array.from(cleanupQueue)
    cleanupQueue.clear()

    console.log(`Processing cleanup for ${keysToProcess.length} day(s)`)

    for (const key of keysToProcess) {
      if (removeDays.has(key) || processingCleanup.has(key)) continue

      processingCleanup.add(key) // Mark as currently processing
      try {
        await processCleanupForDay(key)
        removeDays.add(key)
      } catch (error) {
        console.error(`Cleanup failed for day ${key}:`, error)
        // Re-queue for retry with exponential backoff
        setTimeout(() => {
          if (!removeDays.has(key)) {
            cleanupQueue.add(key)
            scheduleCleanup(Date.now() - 1209600000)
          }
        }, 5000)
      } finally {
        processingCleanup.delete(key) // Remove from processing set
      }
    }

    // Limit removeDays memory growth - keep only last 30 days of tracking
    if (removeDays.size > 30) {
      const sortedDays = Array.from(removeDays).sort()
      const oldestDays = sortedDays.slice(0, sortedDays.length - 30)
      oldestDays.forEach(d => removeDays.delete(d))
    }
  }, 1000) // 1 second debounce
}

async function processCleanupForDay(removeKey) {
  return new Promise(resolve => {
    user.get("remove").next(removeKey, async remove => {
      if (!remove) {
        resolve()
        return
      }

      const items = Object.values(remove).filter(item => item)
      console.log(`Cleaning up ${items.length} items for day ${removeKey}`)

      // Process cleanup in batches to avoid overwhelming the system
      const BATCH_SIZE = 50
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE)

        await Promise.allSettled(
          batch.map(
            item =>
              new Promise(res => {
                user
                  .get("feedItems")
                  .next(item.url)
                  .next(removeKey)
                  .next(item.guid)
                  .put(null, res)
              }),
          ),
        )

        // Small delay between batches to prevent overwhelming the system
        if (i + BATCH_SIZE < items.length) {
          await new Promise(r => setTimeout(r, 10))
        }
      }

      // Remove the cleanup tracking data (only if it existed)
      user
        .get("remove")
        .next(removeKey)
        .put(null, err => {
          if (err && err !== "error " + removeKey + " not found") {
            console.log(`Error removing cleanup key ${removeKey}:`, err)
          }
          resolve()
        })
    })
  })
}

// Direct processing function (no queue)
async function processItem(data, dayKey, itemKey, res) {
  const startTime = Date.now()

  try {
    // Use Promise.all for parallel operations with timing
    const [saveErr, removeErr] = await Promise.allSettled([
      timeDbOperation(cb => {
        user
          .get("feedItems")
          .next(data.url)
          .next(dayKey)
          .next(data.guid)
          .put(JSON.stringify(data), cb)
      }, `save-item-${data.url}`),
      timeDbOperation(cb => {
        const remove = {
          guid: data.guid,
          url: data.url,
        }
        user.get("remove").next(dayKey).put(remove, true, cb)
      }, `track-cleanup-${dayKey}`),
    ])

    const processingTime = Date.now() - startTime
    // Update processing statistics
    processingStats.totalProcessed++
    processingStats.averageProcessingTime =
      (processingStats.averageProcessingTime *
        (processingStats.totalProcessed - 1) +
        processingTime) /
      processingStats.totalProcessed
    processingStats.lastProcessedTime = processingTime

    // Calculate delay based on processing time
    if (processingTime > processingStats.delayThreshold) {
      processingStats.currentDelay = Math.max(
        processingStats.currentDelay,
        processingTime - processingStats.delayThreshold,
      )
    } else {
      // Reduce delay when processing is fast
      processingStats.currentDelay = Math.max(
        0,
        processingStats.currentDelay - 100,
      )
    }

    if (saveErr.status === "rejected" || saveErr.value) {
      console.log(
        "Error saving item:",
        saveErr.status === "rejected" ? saveErr.reason : saveErr.value,
      )
      res.status(500).send("Error saving item")
    } else {
      res.end()

      // Schedule cleanup for later to avoid blocking the response
      setImmediate(() => scheduleCleanup(Date.now() - 1209600000))
    }
  } catch (error) {
    console.log("Error processing item:", error)
    res.status(500).send("Error processing item")
  } finally {
    // Clean up pending request
    pendingRequests.delete(itemKey)
  }
}

// Helper function to time database operations
function timeDbOperation(operation, operationName = "db-op") {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    operation((err, result) => {
      const endTime = Date.now()
      const duration = endTime - startTime

      // Update DB stats
      dbStats.totalOps++
      dbStats.averageDbTime =
        (dbStats.averageDbTime * (dbStats.totalOps - 1) + duration) /
        dbStats.totalOps

      if (err) {
        dbStats.errorCount++
        console.log(`[DB-ERROR] ${operationName}: ${err} (${duration}ms)`)
        reject(err)
      } else {
        if (duration > 2000) {
          // Log slow DB operations over 2 seconds
          dbStats.slowOps++
          console.log(`[DB-SLOW] ${operationName}: ${duration}ms`)
        }
        resolve(result)
      }
    })
  })
}

function mapEnclosure(e) {
  if (!e) return null

  let found = false
  let enclosure = {}

  // Optimize by checking existence first before allocation
  if (e.photo?.length > 0) {
    enclosure.photo = {}
    for (const p of e.photo) {
      if (p?.link) {
        found = true
        enclosure.photo[p.link] = p.alt || ""
      }
    }
  }
  if (e.audio?.length > 0) {
    enclosure.audio = {}
    for (const a of e.audio) {
      if (a) {
        found = true
        enclosure.audio[a] = true
      }
    }
  }
  if (e.video?.length > 0) {
    enclosure.video = {}
    for (const v of e.video) {
      if (v) {
        found = true
        enclosure.video[v] = true
      }
    }
  }
  return found ? enclosure : null
}

function mapCategory(c) {
  if (!c?.length) return null

  let found = false
  let category = {}
  for (const value of c) {
    if (value) {
      found = true
      category[value] = true
    }
  }
  return found ? category : null
}

function createContentHash(data) {
  const hashInput = `${data.title}|${data.content}|${data.author}|${data.permalink}`
  return crypto.createHash("md5").update(hashInput).digest("hex")
}

// day is a helper function that returns the zero timestamp on the day of the
// given timestamp. This is used because items are grouped by day to make it
// easier for the browser to find recent items.
function day(key) {
  const t = new Date(+key)
  return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
}

// Write a sentinel value for each feed that has no items on a given day.
// Clients receiving the sentinel can return immediately from local store on
// future requests for that day, avoiding a network round-trip for empty days.
// If real items later arrive for the day, they are stored alongside the
// sentinel via HAM and clients will see them on their next session.
async function writeSentinelsForDay(dayKey) {
  const feedsNode = await new Promise(resolve => user.get("feeds", resolve))
  if (!feedsNode) return
  const feedUrls = Object.keys(feedsNode).filter(k => k !== "_")
  for (const url of feedUrls) {
    const existing = await new Promise(resolve =>
      user.get("feedItems").next(url).next(dayKey, resolve),
    )
    if (!existing) {
      await new Promise(resolve =>
        user
          .get("feedItems")
          .next(url)
          .next(dayKey)
          .put({_empty: true}, resolve),
      )
    }
  }
}

// Runs at midnight UTC each day for the day that just completed, naturally
// covering the 14-day history window over time.
function scheduleDailySentinelJob() {
  const now = Date.now()
  const nextMidnight = day(now) + 86400000
  setTimeout(async () => {
    await writeSentinelsForDay(day(Date.now()) - 86400000)
    scheduleDailySentinelJob()
  }, nextMidnight - now)
}
