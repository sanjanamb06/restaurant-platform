import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { Box, Card, CardContent, IconButton, Stack, Typography } from "@mui/material";
import { useToast } from "../../context/ToastContext";

interface TempCredentialCardProps {
  label: string;
  username: string;
  password: string;
}

export default function TempCredentialCard({
  label,
  username,
  password,
}: TempCredentialCardProps) {
  const { showToast } = useToast();
  const copy = async () => {
    await navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
    showToast(`${label} credentials copied`);
  };

  return (
    <Card variant="outlined" sx={{ boxShadow: "none", borderColor: "rgba(198,93,59,.18)" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="overline" color="primary.main" fontWeight={800}>
              {label}
            </Typography>
            <Typography sx={{ mt: 0.5 }}>
              <Typography component="span" color="text.secondary">
                Username:{" "}
              </Typography>
              <strong>{username}</strong>
            </Typography>
            <Typography>
              <Typography component="span" color="text.secondary">
                Password:{" "}
              </Typography>
              <Box component="code" sx={{ fontSize: "1rem", fontWeight: 800 }}>
                {password}
              </Box>
            </Typography>
          </Box>
          <IconButton onClick={copy} aria-label={`Copy ${label} credentials`} color="primary">
            <ContentCopyRoundedIcon />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
