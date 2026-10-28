// Chat notification audio synthesizer & browser notification helper

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a modern, crisp 2-tone notification chime via Web Audio API.
 * Tone 1 (E5, 659.25Hz) -> Tone 2 (A5, 880Hz) with smooth decay.
 * Zero external MP3 downloads required.
 */
export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First tone (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second tone (A5) slightly higher & longer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.08);

    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.32);
  } catch (err) {
    console.warn("Failed to play notification chime:", err);
  }
}

/**
 * Requests desktop notification permission if supported.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const res = await Notification.requestPermission();
      return res === "granted";
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Shows desktop notification if permission granted.
 */
export function showDesktopNotification(
  title: string,
  body: string,
  onClick?: () => void
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  try {
    if (Notification.permission === "granted") {
      const notif = new Notification(title, {
        body: body.slice(0, 120),
        icon: "/favicon.ico",
        silent: true, // We already play our custom synthesized sound
      });

      if (onClick) {
        notif.onclick = () => {
          window.focus();
          onClick();
          notif.close();
        };
      }

      setTimeout(() => notif.close(), 5000);
    }
  } catch {
    // ignore
  }
}

export interface InAppNotification {
  id: string;
  type: "dm" | "group_tag" | "marketplace_new" | "gallery_new" | "message_room";
  senderName: string;
  senderAvatar?: string;
  roomName?: string;
  roomId?: number;
  senderId?: number;
  content: string;
  createdAt: number;
  /** Marketplace / gallery extras */
  imageUrl?: string;
  listingTitle?: string;
  listingPrice?: number;
  actionUrl?: string;
}

type NotificationListener = (notif: InAppNotification) => void;
const listeners: Set<NotificationListener> = new Set();

export function onInAppNotification(listener: NotificationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function triggerInAppNotification(notif: InAppNotification): void {
  listeners.forEach((listener) => {
    try {
      listener(notif);
    } catch (err) {
      console.warn("Error in notification listener:", err);
    }
  });
}
