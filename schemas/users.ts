import { z } from 'zod';

export const UserSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    typeOrRole: z.string().min(1, "Debes seleccionar un rol o rubro"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const UserEditSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    typeOrRole: z.string().min(1, "Debes seleccionar un rol o rubro"),
    status: z.string().optional(),
    newEmail: z.string().email("Email inválido").optional().or(z.literal('')),
});

export type UserInput = z.infer<typeof UserSchema>;
export type UserEditInput = z.infer<typeof UserEditSchema>;
