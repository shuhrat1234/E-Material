// Lightweight toast notifications, replacing window.alert.
let listener = null;

export function registerToastHost(fn) {
  listener = fn;
}

export function notify(message, type = 'info') {
  if (!listener) {
    window.alert(message);
    return;
  }
  listener({ message, type, id: Date.now() + Math.random() });
}
