import { useEffect, useSyncExternalStore } from "react";

type Status = "off" | "active" | "paused" | "unavailable" | "unsupported";
let status: Status = "off";
const listeners = new Set<() => void>();
const publish = (next: Status) => {
  if (status === next) return;
  status = next;
  for (const fn of listeners) fn();
};

export function useScreenStatus() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
    () => status,
  );
}

/** One screen lock, released on sleep/unmount; late permission results cannot leave it held. */
export function useScreenWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!("wakeLock" in navigator)) {
      publish("unsupported");
      return;
    }
    if (!enabled) {
      publish("off");
      return;
    }
    let disposed = false;
    let pending = false;
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      if (disposed || pending || (lock && !lock.released)) return;
      if (document.visibilityState !== "visible") {
        publish("paused");
        return;
      }
      pending = true;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (disposed || document.visibilityState !== "visible") {
          await next.release().catch(() => {});
          return;
        }
        lock = next;
        publish("active");
        next.addEventListener("release", () => {
          if (lock === next) lock = null;
          if (!disposed) publish("paused");
        }, { once: true });
      } catch {
        if (!disposed) publish("unavailable");
      } finally {
        pending = false;
      }
    };
    const visibility = () => {
      if (document.visibilityState === "visible") void request();
      else publish("paused");
    };
    void request();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pageshow", visibility);
    window.addEventListener("pointerdown", request, { passive: true });
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pageshow", visibility);
      window.removeEventListener("pointerdown", request);
      void lock?.release().catch(() => {});
      publish("off");
    };
  }, [enabled]);
}
