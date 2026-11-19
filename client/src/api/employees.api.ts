import api from "./axiosInstance";
import {
  ApiResponse,
  Employee,
  EmployeeInput,
  EmployeeUpdateInput,
} from "../types";

export async function getEmployees(): Promise<Employee[]> {
  const response = await api.get<ApiResponse<{ employees: Employee[] }>>("/employees");
  return response.data.data.employees;
}

export async function createEmployee(
  input: EmployeeInput,
): Promise<{ employee: Employee; tempPassword: string }> {
  const response = await api.post<
    ApiResponse<{ employee: Employee; temporaryPassword?: string; tempPassword?: string }>
  >("/employees", input);
  const data = response.data.data;
  return {
    employee: data.employee,
    tempPassword: data.temporaryPassword ?? data.tempPassword ?? "",
  };
}

export async function updateEmployee(
  id: string,
  input: EmployeeUpdateInput,
): Promise<Employee> {
  const response = await api.patch<ApiResponse<{ employee: Employee }>>(`/employees/${id}`, input);
  return response.data.data.employee;
}

export async function toggleEmployeeStatus(id: string): Promise<Employee> {
  const response = await api.patch<ApiResponse<{ employee: Employee }>>(
    `/employees/${id}/toggle-status`,
  );
  return response.data.data.employee;
}

export async function resetEmployeePassword(
  id: string,
): Promise<{ employee: Employee; tempPassword: string }> {
  const response = await api.post<
    ApiResponse<{ employee: Employee; temporaryPassword?: string; tempPassword?: string }>
  >(`/employees/${id}/reset-password`);
  const data = response.data.data;
  return {
    employee: data.employee,
    tempPassword: data.temporaryPassword ?? data.tempPassword ?? "",
  };
}
