import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { InputAdornment, TextField } from "@mui/material";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search dishes...",
}: SearchBarProps) {
  return (
    <TextField
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon color="action" />
          </InputAdornment>
        ),
      }}
    />
  );
}
