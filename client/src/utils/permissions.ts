import { Role } from "../types";

export function canManageMenu(role?: Role): boolean {
  return role === Role.ADMIN || role === Role.MANAGER;
}
