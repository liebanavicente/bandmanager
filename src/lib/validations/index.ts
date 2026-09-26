import { z } from "zod";
import {
  AttendanceStatus,
  EventStatus,
  EventType,
  FileCategory,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  SalesChannel,
  SetlistItemType,
  SongStatus,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@prisma/client";

// Un campo vacío ("") se guarda como null para poder borrar su contenido al
// editar; un campo ausente (undefined) no se toca.
const optionalUrl = z
  .string()
  .url("URL inválida.")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value === "" ? null : value));

const optionalString = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value === "" ? null : value));

const dateTimeInput = z.coerce.date({ message: "Fecha inválida." });

/** Id opcional de una relación: "" la desvincula (null). */
const optionalRelationId = z
  .string()
  .cuid()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value === "" ? null : value));

/** Fecha opcional: "" la borra (null). */
const optionalDateInput = z
  .literal("")
  .transform(() => null)
  .or(dateTimeInput.optional());

type StripDefaults<S extends z.ZodRawShape> = {
  [K in keyof S]: S[K] extends z.ZodDefault<infer Inner> ? Inner : S[K];
};

/**
 * `.partial()` de Zod 4 sigue aplicando los `.default()` de los campos
 * omitidos, así que una actualización parcial (p. ej. solo el nombre de un
 * repertorio) pisaría canciones, etiquetas o estados con su valor por
 * defecto. Este helper quita los defaults antes de hacer el esquema parcial.
 */
function partialWithoutDefaults<S extends z.ZodRawShape>(schema: z.ZodObject<S>) {
  const shape = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => [
      key,
      field instanceof z.ZodDefault ? field.unwrap() : field,
    ]),
  ) as StripDefaults<S>;
  return z.object(shape).partial();
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const eventFiltersSchema = z.object({
  search: optionalString,
  type: z.nativeEnum(EventType).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  from: dateTimeInput.optional(),
  to: dateTimeInput.optional(),
  ...paginationSchema.shape,
});

const eventBaseSchema = z.object({
  title: z.string().min(1, "El título es obligatorio.").max(200),
  type: z.nativeEnum(EventType),
  startAt: dateTimeInput,
  endAt: dateTimeInput,
  venue: optionalString,
  address: optionalString,
  mapsUrl: optionalUrl,
  description: optionalString,
  callTime: dateTimeInput.optional(),
  setupInfo: optionalString,
  soundcheckInfo: optionalString,
  expectedFeeCents: z.coerce.number().int().min(0).optional(),
  expectedCostCents: z.coerce.number().int().min(0).optional(),
  contactName: optionalString,
  contactPhone: optionalString,
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
});

export const createEventSchema = eventBaseSchema.refine(
  (data) => data.endAt >= data.startAt,
  {
    message: "La fecha de fin debe ser posterior a la de inicio.",
    path: ["endAt"],
  },
);

export const updateEventSchema = partialWithoutDefaults(eventBaseSchema)
  .extend({
    id: z.string().cuid(),
  })
  .refine(
    (data) =>
      !data.startAt || !data.endAt || data.endAt >= data.startAt,
    {
      message: "La fecha de fin debe ser posterior a la de inicio.",
      path: ["endAt"],
    },
  );

export const updateAttendanceSchema = z.object({
  eventId: z.string().cuid(),
  userId: z.string().cuid(),
  status: z.nativeEnum(AttendanceStatus),
  note: optionalString,
});

export const songFiltersSchema = z.object({
  search: optionalString,
  status: z.nativeEnum(SongStatus).optional(),
  artist: optionalString,
  tag: optionalString,
  ...paginationSchema.shape,
});

export const createSongSchema = z.object({
  title: z.string().min(1, "El título es obligatorio.").max(200),
  artist: optionalString,
  composer: optionalString,
  durationSeconds: z.coerce.number().int().min(0).optional(),
  keySignature: optionalString,
  tempo: z.coerce.number().int().min(1).max(400).optional(),
  timeSignature: optionalString,
  tuning: optionalString,
  leadVocal: optionalString,
  backingVocals: optionalString,
  instruments: optionalString,
  technicalNotes: optionalString,
  status: z.nativeEnum(SongStatus).default(SongStatus.PROPOSED),
  tags: z.array(z.string()).default([]),
  referenceUrl: optionalUrl,
  lyrics: optionalString,
  chords: optionalString,
});

export const updateSongSchema = partialWithoutDefaults(createSongSchema).extend({
  id: z.string().cuid(),
});

export const createRepertoireSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(200),
  description: optionalString,
  notes: optionalString,
  songIds: z.array(z.string().cuid()).default([]),
});

export const updateRepertoireSchema = partialWithoutDefaults(createRepertoireSchema).extend({
  id: z.string().cuid(),
});

export const reorderRepertoireSongsSchema = z.object({
  repertoireId: z.string().cuid(),
  songIds: z.array(z.string().cuid()).min(1),
});

export const duplicateRepertoireSchema = z.object({
  id: z.string().cuid(),
  name: optionalString,
});

export const setActiveRepertoireSchema = z.object({
  id: z.string().cuid(),
});

export const setlistItemSchema = z.object({
  type: z.nativeEnum(SetlistItemType).default(SetlistItemType.SONG),
  songId: z.string().cuid().optional(),
  comment: optionalString,
});

export const createSetlistSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(200),
  eventId: optionalRelationId,
  repertoireId: optionalRelationId,
  notes: optionalString,
  items: z.array(setlistItemSchema).default([]),
});

export const updateSetlistSchema = partialWithoutDefaults(createSetlistSchema).extend({
  id: z.string().cuid(),
});

export const reorderSetlistItemsSchema = z.object({
  setlistId: z.string().cuid(),
  itemIds: z.array(z.string().cuid()).min(1),
});

export const duplicateSetlistSchema = z.object({
  id: z.string().cuid(),
  name: optionalString,
});

export const taskFiltersSchema = z.object({
  search: optionalString,
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().cuid().optional(),
  eventId: z.string().cuid().optional(),
  ...paginationSchema.shape,
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio.").max(200),
  description: optionalString,
  assigneeId: optionalRelationId,
  dueAt: optionalDateInput,
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.PENDING),
  category: optionalString,
  eventId: optionalRelationId,
});

export const updateTaskSchema = partialWithoutDefaults(createTaskSchema).extend({
  id: z.string().cuid(),
});

export const createTaskCommentSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().min(1, "El comentario no puede estar vacío.").max(2000),
});

export const memberFiltersSchema = z.object({
  search: optionalString,
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.coerce.boolean().optional(),
  ...paginationSchema.shape,
});

export const updateMemberSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "El nombre es obligatorio.").max(200).optional(),
  photoUrl: optionalUrl,
  phone: optionalString,
  instrument: optionalString,
  bio: optionalString,
  joinedAt: dateTimeInput.optional(),
  emergencyContact: optionalString,
  availability: optionalString,
  links: z.record(z.string(), z.string()).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const productVariantSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, "El nombre de la variante es obligatorio."),
  size: optionalString,
  color: optionalString,
  stock: z.coerce.number().int().min(0).default(0),
  sku: z.string().min(1, "El SKU es obligatorio."),
});

export const productFiltersSchema = z.object({
  search: optionalString,
  category: optionalString,
  status: z.nativeEnum(ProductStatus).optional(),
  lowStockOnly: z.coerce.boolean().optional(),
  ...paginationSchema.shape,
});

export const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(200),
  description: optionalString,
  category: z.string().min(1, "La categoría es obligatoria."),
  imagePaths: z.array(z.string()).default([]),
  priceCents: z.coerce.number().int().min(0),
  costCents: z.coerce.number().int().min(0),
  sku: z.string().min(1, "El SKU es obligatorio."),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
  minStock: z.coerce.number().int().min(0).default(5),
  supplier: optionalString,
  externalId: optionalString,
  variants: z.array(productVariantSchema).default([]),
});

export const updateProductSchema = partialWithoutDefaults(createProductSchema).extend({
  id: z.string().cuid(),
});

export const orderItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.coerce.number().int().min(1),
  unitPriceCents: z.coerce.number().int().min(0).optional(),
});

export const orderFiltersSchema = z.object({
  search: optionalString,
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  channel: z.nativeEnum(SalesChannel).optional(),
  ...paginationSchema.shape,
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "El nombre del cliente es obligatorio."),
  customerEmail: z.string().email("Email inválido.").optional().or(z.literal("")),
  shippingCents: z.coerce.number().int().min(0).default(0),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING),
  channel: z.nativeEnum(SalesChannel).default(SalesChannel.WEB),
  notes: optionalString,
  items: z.array(orderItemSchema).min(1, "Debe incluir al menos un producto."),
});

export const updateOrderSchema = z.object({
  id: z.string().cuid(),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  shippingCents: z.coerce.number().int().min(0).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  notes: optionalString,
});

export const quickConcertSaleSchema = z.object({
  customerName: z.string().min(1, "El nombre del cliente es obligatorio.").default("Cliente concierto"),
  items: z.array(orderItemSchema).min(1, "Debe incluir al menos un producto."),
  notes: optionalString,
});

export const fileFiltersSchema = z.object({
  search: optionalString,
  category: z.nativeEnum(FileCategory).optional(),
  eventId: z.string().cuid().optional(),
  taskId: z.string().cuid().optional(),
  ...paginationSchema.shape,
});

export const uploadFileMetadataSchema = z.object({
  name: optionalString,
  description: optionalString,
  category: z.nativeEnum(FileCategory).default(FileCategory.OTHER),
  tags: z.array(z.string()).default([]),
  eventId: z.string().cuid().optional(),
  taskId: z.string().cuid().optional(),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Email inválido."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export const syncRequestSchema = z.object({
  provider: z.enum(["WOOCOMMERCE", "GELATO", "ALL"]).default("ALL"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateSongInput = z.infer<typeof createSongSchema>;
export type UpdateSongInput = z.infer<typeof updateSongSchema>;
export type CreateRepertoireInput = z.infer<typeof createRepertoireSchema>;
export type CreateSetlistInput = z.infer<typeof createSetlistSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type QuickConcertSaleInput = z.infer<typeof quickConcertSaleSchema>;
export const updateFileMetadataSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  description: optionalString,
  category: z.nativeEnum(FileCategory),
});
