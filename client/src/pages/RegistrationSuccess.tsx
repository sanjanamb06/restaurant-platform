import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import { Alert, Box, Button, Grid, Stack, Typography } from "@mui/material";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import TempCredentialCard from "../components/common/TempCredentialCard";
import AuthLayout from "../components/layout/AuthLayout";
import { useToast } from "../context/ToastContext";
import { RegistrationResult, Role } from "../types";

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const result = location.state as RegistrationResult | null;

  if (!result?.admin || !result.restaurant || !result.adminPassword) {
    return <Navigate to="/register" replace />;
  }

  const allCredentials = [
    {
      label: "Restaurant admin",
      username: result.admin.username,
      password: result.adminPassword,
      role: Role.ADMIN,
    },
    ...result.tempCredentials.map((credential) => ({
      label: credential.role.charAt(0) + credential.role.slice(1).toLowerCase(),
      username: credential.username,
      password: credential.tempPassword,
      role: credential.role,
    })),
  ];

  const copyAll = async () => {
    const text = [
      result.restaurant.name,
      "",
      ...allCredentials.map(
        (credential) =>
          `${credential.label}\nUsername: ${credential.username}\nPassword: ${credential.password}`,
      ),
    ].join("\n\n");
    await navigator.clipboard.writeText(text);
    showToast("All four logins copied — keep them somewhere safe");
  };

  return (
    <AuthLayout
      wide
      icon="🎉"
      title="Your restaurant is ready"
      subtitle={`Welcome to Gather, ${result.admin.name}. Share these logins with the right people when you're ready.`}
    >
      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Save these now.</strong> For security, the temporary passwords won&apos;t be shown
        again after you leave this page.
      </Alert>
      <Grid container spacing={2}>
        {allCredentials.map((credential) => (
          <Grid item xs={12} sm={6} key={credential.role}>
            <TempCredentialCard
              label={credential.label}
              username={credential.username}
              password={credential.password}
            />
          </Grid>
        ))}
      </Grid>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mt={3}>
        <Button fullWidth variant="outlined" startIcon={<ContentCopyRoundedIcon />} onClick={copyAll}>
          Copy all credentials
        </Button>
        <Button fullWidth variant="contained" endIcon={<LoginRoundedIcon />} onClick={() => navigate("/login", { replace: true })}>
          Take me to login
        </Button>
      </Stack>
    </AuthLayout>
  );
}
