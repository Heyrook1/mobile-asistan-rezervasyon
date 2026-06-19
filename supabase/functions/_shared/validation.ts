import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { jsonResponse } from "./auth.ts";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih formatı.");

export const registerBodySchema = z.object({
  action: z.literal("register"),
  fullName: z.string().trim().min(1, "Ad zorunludur.").max(120),
  email: z.string().trim().email("Geçerli bir e-posta girin.").max(254),
  phone: z.string().trim().max(30).optional().default(""),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır.").max(128),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "Kullanım koşullarını kabul etmelisiniz." }),
  }),
  acceptedPrivacy: z.literal(true, {
    errorMap: () => ({ message: "Gizlilik politikasını kabul etmelisiniz." }),
  }),
  acceptedHealthData: z.literal(true, {
    errorMap: () => ({ message: "Sağlık verisi işleme rızası zorunludur." }),
  }),
});

export const updateProfileBodySchema = z.object({
  action: z.literal("update"),
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  locationLat: z.number().finite().optional(),
  locationLng: z.number().finite().optional(),
});

export const bookBodySchema = z.object({
  action: z.literal("book"),
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  date: isoDate,
  startTime: z.string().min(4).max(8),
  note: z.string().max(500).nullable().optional(),
  contactPhone: z.string().max(30).nullable().optional(),
});

export const cancelBodySchema = z.object({
  action: z.literal("cancel"),
  appointmentId: z.string().min(1),
});

export const rescheduleBodySchema = z.object({
  action: z.literal("reschedule"),
  appointmentId: z.string().min(1),
  date: isoDate,
  startTime: z.string().min(4).max(8),
});

export const reviewBodySchema = z.object({
  action: z.literal("review"),
  appointmentId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).nullable().optional(),
  serviceQuality: z.coerce.number().int().min(1).max(5).nullable().optional(),
  waitingTime: z.coerce.number().int().min(1).max(5).nullable().optional(),
  communication: z.coerce.number().int().min(1).max(5).nullable().optional(),
});

export const markReadBodySchema = z.object({
  action: z.literal("mark_read"),
  id: z.string().min(1),
});

export const trackEventBodySchema = z.object({
  action: z.literal("track"),
  event: z.enum([
    "search",
    "provider_view",
    "booking_start",
    "booking_confirmed",
    "booking_cancelled",
    "booking_rescheduled",
  ]),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export const reportErrorBodySchema = z.object({
  action: z.literal("report_error"),
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).nullable().optional(),
  context: z.record(z.unknown()).optional(),
  platform: z.string().max(40).optional(),
});

export const registerPushBodySchema = z.object({
  action: z.literal("register_push"),
  token: z.string().min(10).max(200),
  platform: z.enum(["ios", "android", "web"]),
});

export const favoriteToggleBodySchema = z.object({
  action: z.literal("favorite_toggle"),
  businessId: z.string().min(1),
});

const filtersSchema = z.object({
  specialty: z.string().max(80).optional(),
  service: z.string().max(80).optional(),
  maxDistanceKm: z.number().finite().positive().optional(),
  minRating: z.number().finite().min(0).max(5).optional(),
  availableToday: z.boolean().optional(),
  maxPrice: z.number().finite().positive().optional(),
  clinicName: z.string().max(120).optional(),
  doctorName: z.string().max(120).optional(),
}).optional();

export const catalogDiscoverySchema = z.object({
  action: z.enum(["discovery", "search"]),
  query: z.string().max(120).optional(),
  sort: z.enum(["nearest", "rating", "reviews", "earliest"]).optional(),
  lat: z.number().finite().nullable().optional(),
  lng: z.number().finite().nullable().optional(),
  filters: filtersSchema,
});

export const catalogClinicSchema = z.object({
  action: z.literal("clinic"),
  businessId: z.string().min(1),
  lat: z.number().finite().nullable().optional(),
  lng: z.number().finite().nullable().optional(),
});

export const catalogDoctorSchema = z.object({
  action: z.literal("doctor"),
  staffId: z.string().min(1),
  lat: z.number().finite().nullable().optional(),
  lng: z.number().finite().nullable().optional(),
});

export const catalogSlotsSchema = z.object({
  action: z.literal("slots"),
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  date: isoDate,
  excludeAppointmentId: z.string().min(1).optional(),
});

export function validationErrorResponse(
  result: z.SafeParseError<unknown>,
  req?: Request,
): Response {
  const first = result.error.issues[0];
  const message = first?.message ?? "Geçersiz istek.";
  return jsonResponse({ error: "validation", message, field: first?.path.join(".") }, 400, req);
}

export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
  req?: Request,
): z.infer<T> | Response {
  const result = schema.safeParse(body);
  if (!result.success) return validationErrorResponse(result, req);
  return result.data;
}
