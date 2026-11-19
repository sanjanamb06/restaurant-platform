import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MenuItem } from "../../types/menu";
import { formatPrice } from "../../utils/format";

interface FoodCardProps {
  item: MenuItem;
  canManage: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onRecipe: (item: MenuItem) => void;
}

export function FoodCardSkeleton() {
  return (
    <Card sx={{ height: "100%" }}>
      <Skeleton variant="rectangular" height={160} />
      <CardContent>
        <Skeleton width="70%" />
        <Skeleton width="40%" />
        <Skeleton width="55%" sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
}

export default function FoodCard({
  item,
  canManage,
  onEdit,
  onDelete,
  onRecipe,
}: FoodCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 160,
          bgcolor: item.imageUrl ? "grey.200" : "rgba(198,93,59,.10)",
          backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "grid",
          placeItems: "center",
          color: "primary.main",
        }}
      >
        {!item.imageUrl && <RestaurantRoundedIcon sx={{ fontSize: 52, opacity: 0.55 }} />}
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box minWidth={0}>
            <Typography variant="h6" fontWeight={800} noWrap>
              {item.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {item.category.name}
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={800} color="primary.dark" whiteSpace="nowrap">
            {formatPrice(item.price)}
          </Typography>
        </Stack>

        {item.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.description}
          </Typography>
        )}

        <Chip
          size="small"
          label={item.isAvailable ? "Available" : "Unavailable"}
          color={item.isAvailable ? "success" : "default"}
          variant={item.isAvailable ? "filled" : "outlined"}
          sx={{ mt: 2 }}
        />
      </CardContent>

      {canManage && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: "flex-end" }}>
          <Stack direction="row">
            <Tooltip title="Recipe">
              <IconButton size="small" onClick={() => onRecipe(item)}>
                <MenuBookRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit dish">
              <IconButton size="small" onClick={() => onEdit(item)}>
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove dish">
              <IconButton size="small" color="error" onClick={() => onDelete(item)}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardActions>
      )}
    </Card>
  );
}
