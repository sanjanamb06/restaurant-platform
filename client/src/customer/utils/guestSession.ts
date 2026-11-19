export interface GuestSession {
  sessionToken?: string;
  customerName: string;
  tableNumber: number;
  activeOrderId?: string;
}

function getSessionKey(restaurantId: string) {
  return `guestSession:${restaurantId}`;
}

export function getGuestSession(restaurantId: string): GuestSession | null {
  const rawSession = window.localStorage.getItem(getSessionKey(restaurantId));
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as GuestSession;
    if (!session.customerName || !session.tableNumber) return null;
    return session;
  } catch {
    return null;
  }
}

export function setGuestSession(restaurantId: string, session: GuestSession): void {
  window.localStorage.setItem(getSessionKey(restaurantId), JSON.stringify(session));
}

export function clearGuestSession(restaurantId: string): void {
  window.localStorage.removeItem(getSessionKey(restaurantId));
}
