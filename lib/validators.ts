import { z } from "zod";
import { LOT_STATUSES, PUBLIC_USER_ROLES, USER_STATUSES } from "../types/domain";
import { splitCommaSeparated } from "./utils";

const listField = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return splitCommaSeparated(value);
  }

  return [];
}, z.array(z.string().trim().min(1)).min(1));

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalPositiveNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.number().positive().optional());

const registrationBaseSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(2, "Enter a full name."),
  phone: z.string().trim().min(7, "Enter a phone number."),
});

export const supplierRegistrationSchema = registrationBaseSchema.extend({
  role: z.literal(PUBLIC_USER_ROLES[0]),
  companyName: z.string().trim().min(2, "Enter the supplier company name."),
  taxId: z.string().trim().min(2, "Enter the tax or registration ID."),
  address: z.string().trim().min(10, "Enter the full address."),
  warehouseAddress: optionalString,
  goodsTypes: listField,
});

export const buyerRegistrationSchema = registrationBaseSchema.extend({
  role: z.literal(PUBLIC_USER_ROLES[1]),
  businessName: z.string().trim().min(2, "Enter the buyer business name."),
  address: z.string().trim().min(10, "Enter the full address."),
  categoriesInterested: listField,
});

export const agentRegistrationSchema = registrationBaseSchema.extend({
  role: z.literal(PUBLIC_USER_ROLES[2]),
  fullName: z.string().trim().min(2, "Enter the agent full name."),
  businessName: optionalString,
  address: z.string().trim().min(10, "Enter the full address."),
  serviceDescription: optionalString,
  preferredCategories: listField,
});

export const publicRegistrationSchema = z.discriminatedUnion("role", [
  supplierRegistrationSchema,
  buyerRegistrationSchema,
  agentRegistrationSchema,
]);

export const profileUpdateSchema = z.discriminatedUnion("role", [
  supplierRegistrationSchema.omit({ email: true, password: true }),
  buyerRegistrationSchema.omit({ email: true, password: true }),
  agentRegistrationSchema.omit({ email: true, password: true }),
]);

export const lotEditorSchema = z.object({
  title: z.string().trim().min(3, "Enter a lot title."),
  description: z.string().trim().min(10, "Add more detail to the description."),
  category: z.string().trim().min(2, "Enter a category."),
  quantity: z.coerce.number().positive("Quantity must be greater than zero."),
  unit: z.string().trim().min(1, "Enter a unit."),
  location: z.string().trim().min(10, "Enter the lot location."),
  expectedPrice: optionalPositiveNumber,
  expiresAt: z.string().min(1, "Pick an expiry date."),
  imageStorageIds: z.array(z.string()).default([]),
});

export const assignmentInputSchema = z.object({
  lotId: z.string().min(1),
  assignedToIds: z.array(z.string()).min(1, "Choose at least one assignee."),
  notes: optionalString,
});

export const userStatusSchema = z.enum(USER_STATUSES);
export const lotStatusSchema = z.enum(LOT_STATUSES);

export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LotEditorInput = z.infer<typeof lotEditorSchema>;
export type AssignmentInput = z.infer<typeof assignmentInputSchema>;
