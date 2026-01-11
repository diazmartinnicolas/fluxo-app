import { z } from 'zod';

export const ReservationSchema = z.object({
    client_name: z.string().min(3, "El nombre del cliente es obligatorio"),
    phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/, "Formato de teléfono inválido").optional().or(z.literal('')),
    date: z.string().min(1, "La fecha es obligatoria"),
    time: z.string().min(1, "La hora es obligatoria"),
    pax: z.number().min(1, "Mínimo 1 persona"),
    notes: z.string().optional().or(z.literal('')),
});

export type ReservationInput = z.infer<typeof ReservationSchema>;
