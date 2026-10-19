export function notificationsSupported(): boolean {
  return typeof Notification !== 'undefined'
}

/** Demande la permission si nécessaire ; renvoie true si les notifications sont autorisées. */
export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

export function showNotification(title: string, body: string, tag: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag })
  } catch {
    // Certains navigateurs mobiles exigent un service worker : on ignore.
  }
}
