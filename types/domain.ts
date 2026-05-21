export const USER_ROLES = ["supplier", "buyer", "agent", "admin"] as const;
export const PUBLIC_USER_ROLES = ["supplier", "buyer", "agent"] as const;
export const USER_STATUSES = ["pending", "approved", "rejected"] as const;
export const ASSIGNMENT_STATUSES = ["pending", "interested", "not_interested"] as const;
export const LOT_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "assigned",
  "sold",
  "expired",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type PublicUserRole = (typeof PUBLIC_USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
export type LotStatus = (typeof LOT_STATUSES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  supplier: "Supplier",
  buyer: "Buyer / Shop",
  agent: "Agent",
  admin: "Admin",
};

export const STATUS_LABELS: Record<UserStatus | AssignmentStatus | LotStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Draft",
  pending_review: "Pending Review",
  assigned: "Assigned",
  sold: "Sold",
  expired: "Expired",
  interested: "Interested",
  not_interested: "Not Interested",
};
