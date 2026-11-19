import {
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useState } from "react";

interface DetailsFormProps {
  tableNumbers?: number[];
  tablesFailed?: boolean;
  isSubmitting?: boolean;
  onSubmit: (details: { customerName: string; tableNumber: number }) => void;
}

export default function DetailsForm({
  isSubmitting = false,
  onSubmit,
}: DetailsFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState<number | "">("");
  const [tableError, setTableError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const num = Number(tableNumber);
    if (customerName.trim().length < 2) return;
    if (!tableNumber || num <= 0 || !Number.isInteger(num)) {
      setTableError("Please enter a valid table number.");
      return;
    }

    setTableError("");
    onSubmit({ customerName: customerName.trim(), tableNumber: num });
  };

  return (
    <Card>
      <CardContent>
        <Stack component="form" spacing={2.25} onSubmit={submit}>
          <Stack spacing={0.5}>
            <Typography variant="h4">Let's get you started</Typography>
            <Typography color="text.secondary">Just two quick details before the menu.</Typography>
          </Stack>

          <TextField
            label="What should we call you?"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            inputProps={{ maxLength: 50 }}
            autoFocus
            fullWidth
          />

          <TextField
            label="Which table are you at?"
            type="number"
            value={tableNumber}
            onChange={(event) => {
              setTableError("");
              setTableNumber(event.target.value === "" ? "" : Number(event.target.value));
            }}
            inputProps={{ min: 1, step: 1 }}
            helperText={tableError || "Enter the number shown on your table."}
            error={!!tableError}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || customerName.trim().length < 2 || !tableNumber}
          >
            {isSubmitting ? "Checking table..." : "Show me the menu"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
