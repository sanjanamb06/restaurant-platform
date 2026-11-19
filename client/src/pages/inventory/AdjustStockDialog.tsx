import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { adjustStock } from "../../api/inventory.api";
import type { StockItem } from "../../types/inventory";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdjustStockDialogProps {
  ingredient: StockItem | null;
  onClose: () => void;
  onSuccess: (updated: StockItem) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdjustStockDialog({
  ingredient,
  onClose,
  onSuccess,
}: AdjustStockDialogProps) {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(ingredient);

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount("");
      setNote("");
      setError(null);
      setMode("add");
      onClose();
    }
  };

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const previewStock = ingredient
    ? mode === "add"
      ? ingredient.currentStock + (isValidAmount ? parsedAmount : 0)
      : Math.max(0, ingredient.currentStock - (isValidAmount ? parsedAmount : 0))
    : 0;

  const handleSubmit = async () => {
    if (!ingredient || !isValidAmount) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const changeAmount = mode === "add" ? parsedAmount : -parsedAmount;
      const updated = await adjustStock(ingredient.id, { changeAmount, note: note || undefined });
      onSuccess(updated);
      handleClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Adjustment failed. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
    >
      <Box sx={{ height: 5, bgcolor: mode === "add" ? "secondary.main" : "warning.main" }} />
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pt: 2.5, pb: 1, px: 3 }}>
        <TuneRoundedIcon color={mode === "add" ? "secondary" : "warning"} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
            Adjust Stock
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ingredient?.name} · {ingredient?.unit}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        {/* Current stock display */}
        <Box
          sx={{ p: 2, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 2, mb: 2.5, textAlign: "center" }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
            Current Stock
          </Typography>
          <Typography variant="h4" fontWeight={800} color={ingredient?.isLowStock ? "warning.main" : "text.primary"}>
            {ingredient?.currentStock.toFixed(2)}
            <Typography component="span" variant="body1" color="text.secondary" ml={0.75}>
              {ingredient?.unit}
            </Typography>
          </Typography>
        </Box>

        {/* Mode toggle */}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_e, val) => { if (val) setMode(val as "add" | "remove"); }}
          fullWidth
          sx={{ mb: 2.5 }}
        >
          <ToggleButton
            value="add"
            sx={{
              py: 1.25, fontWeight: 700, gap: 0.5,
              "&.Mui-selected": { bgcolor: "rgba(86,122,90,.15)", color: "secondary.dark" },
            }}
          >
            <AddRoundedIcon fontSize="small" /> Top-up
          </ToggleButton>
          <ToggleButton
            value="remove"
            sx={{
              py: 1.25, fontWeight: 700, gap: 0.5,
              "&.Mui-selected": { bgcolor: "rgba(216,148,38,.15)", color: "warning.dark" },
            }}
          >
            <RemoveRoundedIcon fontSize="small" /> Deduct
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Amount input */}
        <TextField
          label={`Amount to ${mode === "add" ? "add" : "deduct"}`}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          inputProps={{ min: 0, step: "any" }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{ingredient?.unit}</InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Note */}
        <TextField
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          fullWidth
          placeholder="e.g. Received new stock from supplier"
          sx={{ mb: 2.5 }}
        />

        {/* Preview */}
        {isValidAmount && (
          <Box sx={{ p: 1.5, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 2, mb: 2.5 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">New stock after adjustment</Typography>
              <Typography variant="body2" fontWeight={800}
                color={previewStock === 0 ? "error.main" : previewStock < (ingredient?.lowStockThreshold ?? Infinity) ? "warning.main" : "success.main"}
              >
                {previewStock.toFixed(2)} {ingredient?.unit}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Box sx={{ p: 1.5, bgcolor: "error.lighter", borderRadius: 2, mb: 2, border: "1px solid", borderColor: "error.light" }}>
            <Typography variant="body2" color="error.dark">{error}</Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2.5 }} />

        {/* Actions */}
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={handleClose} disabled={isSubmitting} sx={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={mode === "add" ? "secondary" : "warning"}
            onClick={handleSubmit}
            disabled={isSubmitting || !isValidAmount}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ flex: 2 }}
          >
            {isSubmitting ? "Saving..." : `Confirm ${mode === "add" ? "Top-up" : "Deduction"}`}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
