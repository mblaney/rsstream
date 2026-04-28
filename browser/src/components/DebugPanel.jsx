import {useEffect, useState} from "react"
import {eventBus, eventHistory} from "../utils/debugEvents"

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    fractionalSecondDigits: 3,
  })
}

function Row({label, value, ok, mono}) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}:</span>{" "}
      <span
        style={{
          ...(ok !== undefined ? {color: ok ? "#4f4" : "#f44"} : {}),
          ...(mono ? {wordBreak: "break-all"} : {}),
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ConnectionTab({user, host}) {
  return (
    <div>
      <Row
        label="Authenticated"
        value={user.is ? "✓ Yes" : "✗ No"}
        ok={!!user.is}
      />
      <Row label="User pub key" value={user.is?.pub || "N/A"} mono />
      <Row label="Host pub key" value={host || "N/A"} mono />
    </div>
  )
}

function ListenersTab({accountsReady, feedsLoaded, hostFeedsProcessed}) {
  const listeners = [
    {
      name: "accounts",
      active: true,
      ready: accountsReady,
      path: "[host, 'accounts']",
    },
    {
      name: "feeds",
      active: accountsReady,
      ready: feedsLoaded,
      path: "public.feeds + [host, 'feeds'] + [host, 'feedItems']",
    },
    {
      name: "allFeeds",
      active: accountsReady,
      ready: hostFeedsProcessed,
      path: "[host, 'feeds']",
    },
  ]
  return (
    <table style={s.table}>
      <thead>
        <tr>
          {["Name", "Active", "Ready", "Path"].map(h => (
            <th key={h} style={s.th}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {listeners.map(l => (
          <tr key={l.name}>
            <td style={s.td}>{l.name}</td>
            <td style={{...s.td, color: l.active ? "#4f4" : "#888"}}>
              {l.active ? "active" : "waiting"}
            </td>
            <td style={{...s.td, color: l.ready ? "#4f4" : "#fa0"}}>
              {l.ready ? "ready" : "pending"}
            </td>
            <td style={{...s.td, color: "#888"}}>{l.path}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DataTab({feeds, backgroundIndex, currentDayOffset}) {
  const feedEntries = Object.entries(feeds)
  const totalFeeds = feedEntries.length
  return (
    <div>
      <div style={s.row}>
        <span style={s.label}>Feeds:</span> {totalFeeds}
      </div>
      <div style={s.row}>
        <span style={s.label}>Background loading:</span>{" "}
        {currentDayOffset > 14
          ? "complete"
          : `feed ${Math.min(backgroundIndex + 1, totalFeeds || 0)}/${totalFeeds || 0}, day offset ${currentDayOffset}/14`}
      </div>
      <div style={{marginTop: 8}}>
        {feedEntries.map(([url, feed]) => (
          <details key={url} style={{marginBottom: 4}}>
            <summary style={{cursor: "pointer", padding: "2px 0"}}>
              {feed.title || url}
            </summary>
            <pre style={s.pre}>
              {[
                `url:      ${url}`,
                `title:    ${feed.title || ""}`,
                `image:    ${feed.image || ""}`,
                `updated:  ${feed.updated ? new Date(feed.updated).toLocaleString() : "never"}`,
                `days:     ${Object.keys(feed.items || {}).length}`,
              ].join("\n")}
            </pre>
          </details>
        ))}
        {feedEntries.length === 0 && (
          <div style={{color: "#666"}}>No feeds loaded yet</div>
        )}
      </div>
    </div>
  )
}

function EventsTab() {
  const [events, setEvents] = useState(() => [...eventHistory])

  useEffect(() => {
    const handler = e => setEvents(prev => [e.detail, ...prev].slice(0, 200))
    eventBus.addEventListener("debug-event", handler)
    return () => eventBus.removeEventListener("debug-event", handler)
  }, [])

  return (
    <div>
      <button style={s.btn} onClick={() => setEvents([])}>
        Clear
      </button>
      {events.length === 0 && <div style={{color: "#666"}}>No events yet</div>}
      {events.map((event, i) => (
        <div key={i} style={s.event}>
          <span style={s.ts}>[{formatTime(event.timestamp)}]</span>{" "}
          <span style={s.eventType}>{event.type}</span>
          {event.data !== undefined && (
            <pre style={s.pre}>{JSON.stringify(event.data, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  )
}

const TABS = ["Connection", "Listeners", "Data", "Events"]

const s = {
  panel: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    background: "#1e1e1e",
    color: "#ccc",
    fontFamily: "monospace",
    fontSize: "12px",
    borderTop: "2px solid #444",
    display: "flex",
    flexDirection: "column",
    zIndex: 9999,
  },
  tabBar: {
    display: "flex",
    background: "#111",
    borderBottom: "1px solid #333",
    flexShrink: 0,
  },
  tab: {
    padding: "6px 14px",
    cursor: "pointer",
    borderRight: "1px solid #333",
    userSelect: "none",
  },
  content: {
    overflow: "auto",
    padding: 8,
    flex: 1,
  },
  row: {padding: "2px 0"},
  label: {color: "#888"},
  table: {width: "100%", borderCollapse: "collapse"},
  th: {
    textAlign: "left",
    padding: "4px 8px",
    color: "#888",
    borderBottom: "1px solid #333",
  },
  td: {padding: "4px 8px"},
  pre: {margin: "4px 0 4px 8px", whiteSpace: "pre-wrap", color: "#aaa"},
  event: {borderBottom: "1px solid #2a2a2a", padding: "4px 0"},
  ts: {color: "#666"},
  eventType: {color: "#7af"},
  btn: {
    background: "#333",
    color: "#ccc",
    border: "1px solid #555",
    padding: "2px 8px",
    cursor: "pointer",
    marginBottom: 8,
    fontFamily: "monospace",
    fontSize: "12px",
  },
}

export default function DebugPanel({
  user,
  host,
  feeds,
  accountsReady,
  feedsLoaded,
  hostFeedsProcessed,
  backgroundIndex,
  currentDayOffset,
}) {
  const [activeTab, setActiveTab] = useState("Connection")

  return (
    <div style={s.panel}>
      <div style={s.tabBar}>
        {TABS.map(tab => (
          <div
            key={tab}
            style={{
              ...s.tab,
              background: activeTab === tab ? "#1e1e1e" : "transparent",
              color: activeTab === tab ? "#fff" : "#888",
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
        <div style={{flex: 1}} />
        <div style={{...s.tab, cursor: "default", color: "#555"}}>
          Ctrl+Shift+D to close
        </div>
      </div>
      <div style={s.content}>
        {activeTab === "Connection" && (
          <ConnectionTab user={user} host={host} />
        )}
        {activeTab === "Listeners" && (
          <ListenersTab
            accountsReady={accountsReady}
            feedsLoaded={feedsLoaded}
            hostFeedsProcessed={hostFeedsProcessed}
          />
        )}
        {activeTab === "Data" && (
          <DataTab
            feeds={feeds}
            backgroundIndex={backgroundIndex}
            currentDayOffset={currentDayOffset}
          />
        )}
        {activeTab === "Events" && <EventsTab />}
      </div>
    </div>
  )
}
