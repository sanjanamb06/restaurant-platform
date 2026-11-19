import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import { Alert, Box, Button, CircularProgress, Stack, TextField } from "@mui/material";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../api/auth.api";
import AuthLayout from "../components/layout/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getApiError } from "../utils/apiError";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { markPasswordChanged } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!currentPassword) return setError("Enter the temporary password you used to log in.");
    if (newPassword.length < 8) return setError("Your new password needs at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("Those new passwords don't match just yet.");
    if (newPassword === currentPassword) return setError("Pick a new password that’s different from the temporary one.");

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      markPasswordChanged();
      showToast("You're all set! Welcome aboard.");
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't update your password. Check the current password and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      icon="🔐"
      title="Make it yours"
      subtitle="Your temporary password did its job. Choose a private one before we show you around."
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.25}>
          <TextField required type="password" label="Current temporary password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" autoFocus />
          <TextField required type="password" label="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} helperText="At least 8 characters" autoComplete="new-password" />
          <TextField required type="password" label="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2.5 }}>{error}</Alert>}
        <Button
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <LockResetRoundedIcon />}
          sx={{ mt: 3 }}
        >
          {isSubmitting ? "Saving your new key..." : "Save my new password"}
        </Button>
      </Box>
    </AuthLayout>
  );
}
