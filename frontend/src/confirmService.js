// Promise-based custom confirm dialog, replacing window.confirm.
// A single <ConfirmHost /> mounted at the app root subscribes to requests.
let listener = null;

export function registerConfirmHost(fn) {
  listener = fn;
}

export function confirm(message, options = {}) {
  return new Promise((resolve) => {
    if (!listener) {
      resolve(window.confirm(message));
      return;
    }
    listener({ message, ...options, resolve });
  });
}
