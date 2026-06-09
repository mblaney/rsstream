export const toColor = (id, theme) => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }

  const dark = theme?.palette.mode === "dark"
  let color = "#"
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xff
    if (dark) {
      value = (value & 0x7f) + 128
    } else {
      if (value > 80) value -= 80
    }
    color += `00${value.toString(16)}`.slice(-2)
  }
  return color
}

export const urlAvatar = url => {
  return {
    sx: theme => ({
      bgcolor: toColor(url, theme),
    }),
    children: url.match(/https?:\/\/(?:www\.|(?:.*?))(.)/)[1].toUpperCase(),
  }
}
