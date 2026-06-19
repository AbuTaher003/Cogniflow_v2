export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export const toast = {
  show(message: string, type: ToastType = "info") {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("cogniflow-toast", {
        detail: { id: Math.random().toString(36).substring(2), message, type }
      });
      window.dispatchEvent(event);
    }
  },
  success(message: string) {
    this.show(message, "success");
  },
  error(message: string) {
    this.show(message, "error");
  },
  info(message: string) {
    this.show(message, "info");
  },
  warning(message: string) {
    this.show(message, "warning");
  }
};
