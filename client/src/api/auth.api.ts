import api from "./axiosInstance";
import {
  ApiResponse,
  AuthSession,
  LoginInput,
  RegisterRestaurantInput,
  RegistrationResult,
  Restaurant,
  Role,
  User,
} from "../types";

interface RawTempCredential {
  role: Role;
  username: string;
  temporaryPassword?: string;
  tempPassword?: string;
}

interface RawRegistrationResult {
  admin: User;
  restaurant: Restaurant;
  temporaryCredentials?: RawTempCredential[];
  tempCredentials?: RawTempCredential[];
}

export async function registerRestaurant(
  input: RegisterRestaurantInput,
): Promise<RegistrationResult> {
  const response = await api.post<ApiResponse<RawRegistrationResult>>(
    "/auth/register-restaurant",
    input,
  );
  const data = response.data.data;
  const credentials = data.temporaryCredentials ?? data.tempCredentials ?? [];

  return {
    admin: data.admin,
    restaurant: data.restaurant,
    adminPassword: input.password,
    tempCredentials: credentials.map((credential) => ({
      role: credential.role,
      username: credential.username,
      tempPassword: credential.temporaryPassword ?? credential.tempPassword ?? "",
    })),
  };
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const response = await api.post<ApiResponse<AuthSession>>("/auth/login", input);
  return response.data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post("/auth/logout", { refreshToken });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post("/auth/change-password", { currentPassword, newPassword });
}

export async function getMe(): Promise<{ user: User; restaurant: Restaurant }> {
  const response = await api.get<ApiResponse<User & { restaurant: Restaurant }>>("/auth/me");
  const { restaurant, ...user } = response.data.data;
  return { user, restaurant };
}
