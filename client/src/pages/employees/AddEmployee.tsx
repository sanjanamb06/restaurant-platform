import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { createEmployee, updateEmployee } from "../../api/employees.api";
import { Employee, EmployeeInput, Role } from "../../types";
import { getApiError } from "../../utils/apiError";

interface AddEmployeeProps {
  open: boolean;
  employee?: Employee | null;
  onClose: () => void;
  onSaved: (employee: Employee, isNew: boolean) => void;
  onCredential: (name: string, username: string, password: string) => void;
}

const emptyForm: EmployeeInput = {
  name: "",
  username: "",
  role: Role.MANAGER,
};

export default function AddEmployee({
  open,
  employee,
  onClose,
  onSaved,
  onCredential,
}: AddEmployeeProps) {
  const [form, setForm] = useState<EmployeeInput>(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(employee);

  useEffect(() => {
    if (!open) return;
    setForm(
      employee
        ? {
            name: employee.name,
            username: employee.username,
            role: employee.role as EmployeeInput["role"],
          }
        : emptyForm,
    );
    setError("");
  }, [employee, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Add your teammate's name.");
    if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username)) {
      return setError("Username needs at least 3 letters, numbers, or underscores.");
    }

    setIsSubmitting(true);
    try {
      if (employee) {
        const updated = await updateEmployee(employee.id, form);
        onSaved({ ...employee, ...updated }, false);
      } else {
        const result = await createEmployee(form);
        onSaved(result.employee, true);
        onCredential(result.employee.name, result.employee.username, result.tempPassword);
      }
      onClose();
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't save this teammate. Give it another try."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Edit teammate" : "Add someone to the crew"}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="employee-form" onSubmit={submit} spacing={2.25} sx={{ pt: 1 }}>
          <TextField
            required
            label="Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            autoFocus
          />
          <TextField
            required
            label="Username"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            helperText="Letters, numbers, and underscores only"
          />
          <FormControl>
            <InputLabel id="employee-role-label">Role</InputLabel>
            <Select
              labelId="employee-role-label"
              label="Role"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as EmployeeInput["role"],
                }))
              }
            >
              <MenuItem value={Role.MANAGER}>Manager</MenuItem>
              <MenuItem value={Role.CHEF}>Chef</MenuItem>
              <MenuItem value={Role.CASHIER}>Cashier</MenuItem>
            </Select>
          </FormControl>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button
          type="submit"
          form="employee-form"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={17} color="inherit" /> : <PersonAddAltRoundedIcon />}
        >
          {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Add teammate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
