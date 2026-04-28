export const eventBus = new EventTarget()
export const eventHistory = []
const MAX_HISTORY = 200

export function logEvent(type, data) {
  const detail = {type, data, timestamp: Date.now()}
  eventHistory.unshift(detail)
  if (eventHistory.length > MAX_HISTORY) eventHistory.length = MAX_HISTORY
  eventBus.dispatchEvent(new CustomEvent("debug-event", {detail}))
}
