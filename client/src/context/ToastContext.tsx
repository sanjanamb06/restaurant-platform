import { Alert, Snackbar } from "@mui/material";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";

type ToastSeverity = "success" | "error" | "info" | "warning";

interface ToastState {
  message: string;
  severity: ToastSeverity;
}

interface ToastContextValue {
  showToast: (message: string, severity?: ToastSeverity) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = useCallback(
    (message: string, severity: ToastSeverity = "success") => setToast({ message, severity }),
    [],
  );
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast?.severity ?? "success"}
          variant="filled"
          onClose={() => setToast(null)}
          sx={{ borderRadius: 3, boxShadow: 4 }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
