import { z } from 'zod';

export const PromotionSchema = z.object({
    name: z.string().min(3, "El nombre de la promoción es muy corto"),
    product_1_id: z.string().uuid("Debes seleccionar un producto principal"),
    product_2_id: z.string().uuid().optional().nullable().or(z.literal('')),
    type: z.enum(['percent', 'fixed', '2x1']),
    value: z.number().min(0, "El valor no puede ser negativo"),
});

export type PromotionInput = z.infer<typeof PromotionSchema>;
