"use client";

import { useEffect, useState } from "react";
import { TOAST_EVENT, type ToastDetail } from "@/lib/toast";

type Item = ToastDetail & { id: number };

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let nextId = 1;

    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail) return;
      const id = nextId++;
      setItems((list) => [...list.slice(-2), { ...detail, id }]);
      window.setTimeout(() => {
        setItems((list) => list.filter((item) => item.id !== id));
      }, 4600);
    }

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="toastStack" role="status" aria-live="polite">
      {items.map((item) => (
        <div className="toast" key={item.id}>
          <p className="toast__title">{item.title}</p>
          {item.body ? <p className="toast__body">{item.body}</p> : null}
        </div>
      ))}
    </div>
  );
}
