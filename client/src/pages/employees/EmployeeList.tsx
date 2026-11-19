import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  getEmployees,
  resetEmployeePassword,
  toggleEmployeeStatus,
} from "../../api/employees.api";
import { useToast } from "../../context/ToastContext";
import { Employee, Role } from "../../types";
import { getApiError } from "../../utils/apiError";
import AddEmployee from "./AddEmployee";

const roleColors: Record<Role, { bg: string; color: string }> = {
  [Role.ADMIN]: { bg: "#F5D8CC", color: "#873D29" },
  [Role.MANAGER]: { bg: "#DCE9DC", color: "#3F6845" },
  [Role.CHEF]: { bg: "#F9E8BE", color: "#815B13" },
  [Role.CASHIER]: { bg: "#D9E7EE", color: "#365F73" },
};

interface CredentialNotice {
  name: string;
  username: string;
  password: string;
}

interface Confirmation {
  type: "toggle" | "reset";
  employee: Employee;
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [actionEmployeeId, setActionEmployeeId] = useState<string | null>(null);
  const [credential, setCredential] = useState<CredentialNotice | null>(null);
  const { showToast } = useToast();

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setEmployees(await getEmployees());
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't load the crew list."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const handleSaved = (employee: Employee, isNew: boolean) => {
    setEmployees((current) =>
      isNew
        ? [...current, employee]
        : current.map((item) => (item.id === employee.id ? employee : item)),
    );
    showToast(isNew ? `${employee.name} is on the crew` : `${employee.name}'s details are updated`);
  };

  const runConfirmedAction = async () => {
    if (!confirmation) return;
    const { employee, type } = confirmation;
    setActionEmployeeId(employee.id);
    try {
      if (type === "toggle") {
        const updated = await toggleEmployeeStatus(employee.id);
        setEmployees((current) =>
          current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
        );
        showToast(`${employee.name}'s account is now ${updated.isActive ? "active" : "paused"}`);
      } else {
        const result = await resetEmployeePassword(employee.id);
        setCredential({
          name: employee.name,
          username: employee.username,
          password: result.tempPassword,
        });
        showToast(`A fresh temporary password is ready for ${employee.name}`);
      }
      setConfirmation(null);
    } catch (requestError) {
      showToast(getApiError(requestError, "That action didn't work. Please try again."), "error");
    } finally {
      setActionEmployeeId(null);
    }
  };

  const copyCredential = async () => {
    if (!credential) return;
    await navigator.clipboard.writeText(
      `Username: ${credential.username}\nPassword: ${credential.password}`,
    );
    showToast(`${credential.name}'s login copied`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} mb={4}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.6rem" } }}>
            Your crew
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            The people who keep the restaurant humming.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setEditingEmployee(null);
            setFormOpen(true);
          }}
        >
          Add employee
        </Button>
      </Stack>

      {credential && (
        <Alert
          severity="warning"
          onClose={() => setCredential(null)}
          action={
            <Button color="inherit" size="small" startIcon={<ContentCopyRoundedIcon />} onClick={copyCredential}>
              Copy
            </Button>
          }
          sx={{ mb: 3 }}
        >
          <AlertTitle>Save this now — it won&apos;t be shown again</AlertTitle>
          {credential.name}&apos;s login is <strong>{credential.username}</strong> /{" "}
          <Box component="code" fontWeight={800}>{credential.password}</Box>
        </Alert>
      )}

      {error ? (
        <Alert
          severity="error"
          action={<Button color="inherit" startIcon={<ReplayRoundedIcon />} onClick={loadEmployees}>Try again</Button>}
        >
          <AlertTitle>The crew list stayed in the pantry</AlertTitle>
          {error}
        </Alert>
      ) : (
        <Card>
          <TableContainer>
            <Table sx={{ minWidth: 720 }} aria-label="Restaurant employees">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(198,93,59,.06)" }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 5 }).map((__, cell) => (
                          <TableCell key={cell}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : employees.map((employee) => {
                      const isAdmin = employee.role === Role.ADMIN;
                      const colors = roleColors[employee.role];
                      return (
                        <TableRow key={employee.id} hover>
                          <TableCell>
                            <Typography fontWeight={750}>{employee.name}</Typography>
                            {isAdmin && <Typography variant="caption" color="text.secondary">Restaurant owner</Typography>}
                          </TableCell>
                          <TableCell>{employee.username}</TableCell>
                          <TableCell>
                            <Chip size="small" label={employee.role.toLowerCase()} sx={{ bgcolor: colors.bg, color: colors.color, textTransform: "capitalize" }} />
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={employee.isActive ? "Active" : "Paused"} color={employee.isActive ? "success" : "default"} variant="outlined" />
                          </TableCell>
                          <TableCell align="right">
                            {isAdmin ? (
                              <Typography variant="caption" color="text.secondary">Owner account</Typography>
                            ) : (
                              <Stack direction="row" justifyContent="flex-end">
                                <Tooltip title="Edit">
                                  <IconButton onClick={() => { setEditingEmployee(employee); setFormOpen(true); }}>
                                    <EditRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reset password">
                                  <IconButton onClick={() => setConfirmation({ type: "reset", employee })}>
                                    <LockResetRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={employee.isActive ? "Disable account" : "Enable account"}>
                                  <IconButton color={employee.isActive ? "error" : "success"} onClick={() => setConfirmation({ type: "toggle", employee })}>
                                    <PersonOffRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </TableContainer>
          {!isLoading && employees.length === 0 && (
            <Box textAlign="center" py={8} px={3}>
              <Typography variant="h6">It&apos;s quiet in here</Typography>
              <Typography color="text.secondary" mt={1}>Add your first teammate to get the crew together.</Typography>
            </Box>
          )}
        </Card>
      )}

      <AddEmployee
        open={formOpen}
        employee={editingEmployee}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onCredential={(name, username, password) => setCredential({ name, username, password })}
      />

      <Dialog open={Boolean(confirmation)} onClose={() => !actionEmployeeId && setConfirmation(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {confirmation?.type === "reset" ? "Reset this password?" : `${confirmation?.employee.isActive ? "Disable" : "Enable"} this account?`}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {confirmation?.type === "reset"
              ? `${confirmation.employee.name} will be signed out and must change the new temporary password after logging in.`
              : confirmation?.employee.isActive
                ? `Disable ${confirmation.employee.name}'s account? They won't be able to log in until you re-enable it.`
                : `${confirmation?.employee.name} will be able to log in again right away.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setConfirmation(null)} disabled={Boolean(actionEmployeeId)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmation?.type === "toggle" && confirmation.employee.isActive ? "error" : "primary"}
            onClick={runConfirmedAction}
            disabled={Boolean(actionEmployeeId)}
            startIcon={actionEmployeeId ? <CircularProgress size={17} color="inherit" /> : undefined}
          >
            {actionEmployeeId ? "Working..." : "Yes, continue"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
