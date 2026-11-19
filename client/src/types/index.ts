export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  CHEF = "CHEF",
  CASHIER = "CASHIER",
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  isActive?: boolean;
  mustChangePassword: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Restaurant {
  id: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: User;
  restaurant: Restaurant;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface RegisterRestaurantInput {
  restaurantName: string;
  ownerName: string;
  username: string;
  password: string;
  contactEmail: string;
  phone: string;
  address: string;
}

export interface TempCredential {
  role: Role;
  username: string;
  tempPassword: string;
  label?: string;
}

export interface RegistrationResult {
  admin: User;
  restaurant: Restaurant;
  tempCredentials: TempCredential[];
  adminPassword: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface Employee extends User {
  isActive: boolean;
}

export interface EmployeeInput {
  name: string;
  username: string;
  role: Role.MANAGER | Role.CHEF | Role.CASHIER;
}

export type EmployeeUpdateInput = Partial<EmployeeInput>;
