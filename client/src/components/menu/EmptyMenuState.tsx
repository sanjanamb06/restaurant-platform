import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Box, Button, Stack, Typography } from "@mui/material";

interface EmptyMenuStateProps {
  variant: "empty" | "no-results";
  canManage: boolean;
  onAdd?: () => void;
}

export default function EmptyMenuState({ variant, canManage, onAdd }: EmptyMenuStateProps) {
  const isEmpty = variant === "empty";

  return (
    <Box
      textAlign="center"
      py={{ xs: 6, md: 10 }}
      px={3}
      sx={{
        borderRadius: 4,
        bgcolor: "rgba(255,255,255,.72)",
        boxShadow: "0 18px 55px rgba(72, 47, 35, 0.08)",
      }}
    >
      <Typography variant="h5" fontWeight={800}>
        {isEmpty
          ? "Your menu's looking a little empty — let's add your first dish! 🍽️"
          : "No dishes match your search"}
      </Typography>
      <Typography color="text.secondary" mt={1.5} maxWidth={480} mx="auto">
        {isEmpty
          ? "Start with a category and a few favourites — your team can browse them right away."
          : "Try a different search term or clear the category filter to see more dishes."}
      </Typography>
      {isEmpty && canManage && onAdd && (
        <Stack direction="row" justifyContent="center" mt={3}>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onAdd}>
            Add your first dish
          </Button>
        </Stack>
      )}
    </Box>
  );
}
