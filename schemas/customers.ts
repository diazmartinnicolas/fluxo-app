import { z } from 'zod';

export const CustomerSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    address: z.string().min(5, "La dirección es muy corta").optional().or(z.literal('')),
    phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/, "Formato de teléfono inválido").optional().or(z.literal('')),
    birth_date: z.string().optional().or(z.literal('')),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;
