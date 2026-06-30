export function info(...params) {
  if (process.env.NODE_ENV !== "test") {
    console.log(...params);
  }
}

export function error(...params) {
  if (process.env.NODE_ENV !== "test") {
    console.error(...params);
  }
}
