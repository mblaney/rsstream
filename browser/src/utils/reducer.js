export const init = {all: [], keys: []}

// Returns a reducer with a custom sort function that is passed to useReducer.
export const reducer = sort => {
  return (current, add) => {
    if (add.reset) return init

    if (current.keys.includes(add.key)) {
      // Merge the new properties with existing ones instead of replacing
      return {
        all: current.all
          .map(value => (value.key === add.key ? {...value, ...add} : value))
          .sort(sort ? sort : (a, b) => a.key - b.key),
        keys: current.keys,
      }
    }

    return {
      all: [add, ...current.all].sort(sort ? sort : (a, b) => a.key - b.key),
      keys: [add.key, ...current.keys],
    }
  }
}
