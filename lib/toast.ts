export type ToastDetail = {
  title: string;
  body?: string;
};

export const TOAST_EVENT = "unwrapped:toast";

export function toast(title: string, body?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { title, body } }));
}
