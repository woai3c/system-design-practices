import { Role } from '@prisma/client'

// Re-export Role enum from Prisma
export { Role }

// You can also create type guards or utility functions for working with the enums
export const isValidRole = (role: string): role is Role => {
  return Object.values(Role).includes(role as Role)
}

// Create constants for common role checks - update these based on what's defined in your schema
export const USER_ROLES = {
  USER: Role.USER,
  ADMIN: Role.ADMIN,
  // Only include the roles that are defined in your schema
}

// Example helper function to check if a role has admin privileges
export const isAdminRole = (role: Role): boolean => {
  return role === Role.ADMIN
}
