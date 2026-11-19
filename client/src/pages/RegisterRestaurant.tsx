import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ChangeEvent, FormEvent, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { registerRestaurant } from "../api/auth.api";
import AuthLayout from "../components/layout/AuthLayout";
import { RegisterRestaurantInput } from "../types";
import { getApiError } from "../utils/apiError";

const initialForm: RegisterRestaurantInput = {
  restaurantName: "",
  ownerName: "",
  username: "",
  password: "",
  contactEmail: "",
  phone: "",
  address: "",
};

type FormErrors = Partial<Record<keyof RegisterRestaurantInput, string>>;

export default function RegisterRestaurant() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const updateField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (form.restaurantName.trim().length < 2) nextErrors.restaurantName = "Tell us your restaurant name";
    if (form.ownerName.trim().length < 2) nextErrors.ownerName = "Tell us your name";
    if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username)) {
      nextErrors.username = "Use at least 3 letters, numbers, or underscores";
    }
    if (form.password.length < 8) nextErrors.password = "Use at least 8 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.contactEmail)) nextErrors.contactEmail = "Enter a valid email";
    if (form.phone.trim().length < 5) nextErrors.phone = "Enter a valid phone number";
    if (form.address.trim().length < 3) nextErrors.address = "Add your restaurant address";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await registerRestaurant(form);
      navigate("/registration-success", { replace: true, state: result });
    } catch (error) {
      setSubmitError(getApiError(error, "We couldn't create your restaurant just yet. Try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      wide
      icon="🍽️"
      title="Set your table"
      subtitle="A few details and your restaurant workspace will be ready for the whole crew."
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2.25}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Restaurant name" name="restaurantName" value={form.restaurantName} onChange={updateField} error={Boolean(errors.restaurantName)} helperText={errors.restaurantName} autoFocus />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Your name" name="ownerName" value={form.ownerName} onChange={updateField} error={Boolean(errors.ownerName)} helperText={errors.ownerName} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Admin username" name="username" value={form.username} onChange={updateField} error={Boolean(errors.username)} helperText={errors.username || "Letters, numbers, and underscores only"} autoComplete="username" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required type="password" label="Password" name="password" value={form.password} onChange={updateField} error={Boolean(errors.password)} helperText={errors.password || "At least 8 characters"} autoComplete="new-password" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required type="email" label="Contact email" name="contactEmail" value={form.contactEmail} onChange={updateField} error={Boolean(errors.contactEmail)} helperText={errors.contactEmail || "For billing and receipts later"} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth required label="Phone" name="phone" value={form.phone} onChange={updateField} error={Boolean(errors.phone)} helperText={errors.phone} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth required multiline minRows={2} label="Restaurant address" name="address" value={form.address} onChange={updateField} error={Boolean(errors.address)} helperText={errors.address} />
          </Grid>
        </Grid>
        {submitError && <Alert severity="error" sx={{ mt: 2.5 }}>{submitError}</Alert>}
        <Button
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardRoundedIcon />}
          sx={{ mt: 3 }}
        >
          {isSubmitting ? "Setting the tables..." : "Create my restaurant"}
        </Button>
        <Stack direction="row" justifyContent="center" spacing={0.75} mt={3}>
          <Typography color="text.secondary">Already have a workspace?</Typography>
          <Link component={RouterLink} to="/login" fontWeight={750}>Log in</Link>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
