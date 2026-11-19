import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { FormEvent, useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";
import { useAuth } from "../context/AuthContext";

function friendlyLoginError(error: unknown): string {
  if (!axios.isAxiosError(error) || !error.response) {
    return "We couldn't reach the kitchen. Check your connection and try again.";
  }
  if (error.response.status === 403) return "This account is paused. Ask your restaurant admin to enable it.";
  if (error.response.status === 401) return "Hmm, that didn't work — check your username and password.";
  return "Something went sideways. Give it another try in a moment.";
}

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={user?.mustChangePassword ? "/change-password" : "/dashboard"} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Pop in your username and password so we know it's you.");
      return;
    }

    setIsSubmitting(true);
    try {
      const signedInUser = await login({ username, password });
      navigate(signedInUser.mustChangePassword ? "/change-password" : "/dashboard", { replace: true });
    } catch (requestError) {
      setError(friendlyLoginError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Your team and restaurant are right where you left them.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.25}>
          <TextField required label="Username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoFocus />
          <TextField required type="password" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2.5 }}>{error}</Alert>}
        <Button
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <LoginRoundedIcon />}
          sx={{ mt: 3 }}
        >
          {isSubmitting ? "Checking the guest list..." : "Let's go"}
        </Button>
        <Stack direction="row" justifyContent="center" spacing={0.75} mt={3}>
          <Typography color="text.secondary">New around here?</Typography>
          <Link component={RouterLink} to="/register" fontWeight={750}>Create a restaurant</Link>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
