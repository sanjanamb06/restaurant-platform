import { Box, Chip, Stack } from "@mui/material";
import { Category } from "../../types/menu";

interface CategoryFilterChipsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export default function CategoryFilterChips({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryFilterChipsProps) {
  return (
    <Box
      sx={{
        overflowX: "auto",
        pb: 0.5,
        "&::-webkit-scrollbar": { height: 6 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(52,43,39,.15)", borderRadius: 999 },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ minWidth: "min-content", py: 0.5 }}>
        <Chip
          label="All"
          clickable
          color={selectedCategoryId === null ? "primary" : "default"}
          variant={selectedCategoryId === null ? "filled" : "outlined"}
          onClick={() => onSelect(null)}
        />
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            clickable
            color={selectedCategoryId === category.id ? "primary" : "default"}
            variant={selectedCategoryId === category.id ? "filled" : "outlined"}
            onClick={() => onSelect(category.id)}
          />
        ))}
      </Stack>
    </Box>
  );
}
