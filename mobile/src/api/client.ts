import { supabase } from "../lib/supabase";
import { TIMEOUT, withTimeout } from "../utils/async";
import { isNetworkOnline } from "../lib/network";import {
  AppointmentRow,
  BookingResponse,
  ClientUser,
  ClinicResponse,
  DiscoveryResponse,
  DoctorResponse,
  ClientNotificationItem,
  FavoriteItem,
  Provider,
  SearchFilters,
  SlotItem,
} from "./types";

/** A user-facing error that carries the backend's Turkish message. */
export class ApiError extends Error {}

const INVOKE_TIMEOUT_MS = 15_000;

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!isNetworkOnline()) {
    throw new ApiError("İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.");
  }

  const result = await withTimeout(
    supabase.functions.invoke<T>(name, { body }),
    INVOKE_TIMEOUT_MS
  );

  if (result === TIMEOUT) {
    throw new ApiError("Bağlantı zaman aşımına uğradı. Tekrar deneyin.");
  }

  const { data, error } = result;

  if (error) {
    // Edge functions return JSON like { error, message } on failure.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const parsed = (await ctx.json()) as { message?: string };
        if (parsed?.message) throw new ApiError(parsed.message);
      } catch (e) {
        if (e instanceof ApiError) throw e;
      }
    }
    throw new ApiError("Bağlantı hatası. İnternet bağlantınızı kontrol edin.");
  }

  return data as T;
}

// ---- Auth / Profile (auth-client) ----

export async function register(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedHealthData: boolean;
}): Promise<void> {
  await invoke("auth-client", { action: "register", ...input });
}

export async function getProfile(metadata?: {
  fullName?: string;
  phone?: string;
}): Promise<ClientUser | null> {
  const res = await invoke<{ clientUser: ClientUser | null }>("auth-client", {
    action: "get",
    metadata: metadata ?? null,
  });
  return res.clientUser;
}

export async function updateProfile(patch: {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  locationLat?: number;
  locationLng?: number;
}): Promise<ClientUser | null> {
  const res = await invoke<{ clientUser: ClientUser | null }>("auth-client", {
    action: "update",
    ...patch,
  });
  return res.clientUser;
}

export interface DataExportBundle {
  exportedAt: string;
  format: string;
  profile: ClientUser | null;
  appointments: unknown[];
  notifications: unknown[];
  reviews: unknown[];
}

export async function exportMyData(): Promise<DataExportBundle> {
  return invoke<DataExportBundle>("auth-client", { action: "export_data" });
}

export async function deleteAccount(): Promise<void> {
  await invoke("auth-client", { action: "delete_account" });
}

// ---- Catalog ----

export async function discovery(
  lat: number | null,
  lng: number | null
): Promise<DiscoveryResponse> {
  return invoke<DiscoveryResponse>("catalog", { action: "discovery", lat, lng });
}

export async function search(input: {
  lat: number | null;
  lng: number | null;
  query: string | null;
  filters: SearchFilters;
  sort: string;
}): Promise<Provider[]> {
  const res = await invoke<{ providers: Provider[] }>("catalog", {
    action: "search",
    ...input,
  });
  return res.providers;
}

export async function clinic(
  businessId: string,
  lat: number | null,
  lng: number | null
): Promise<ClinicResponse> {
  return invoke<ClinicResponse>("catalog", { action: "clinic", businessId, lat, lng });
}

export async function doctor(
  staffId: string,
  lat: number | null,
  lng: number | null
): Promise<DoctorResponse> {
  return invoke<DoctorResponse>("catalog", { action: "doctor", staffId, lat, lng });
}

export async function slots(
  staffId: string,
  serviceId: string,
  date: string,
  excludeAppointmentId?: string
): Promise<SlotItem[]> {
  const res = await invoke<{ slots: SlotItem[] }>("catalog", {
    action: "slots",
    staffId,
    serviceId,
    date,
    ...(excludeAppointmentId ? { excludeAppointmentId } : {}),
  });
  return res.slots;
}

// ---- Booking ----

export async function book(input: {
  businessId: string;
  staffId: string;
  serviceId: string;
  date: string;
  startTime: string;
  note: string | null;
  contactPhone: string | null;
}): Promise<BookingResponse> {
  return invoke<BookingResponse>("booking", { action: "book", ...input });
}

export async function myAppointments(): Promise<AppointmentRow[]> {
  const res = await invoke<{ appointments: AppointmentRow[] }>("booking", {
    action: "list",
  });
  return res.appointments;
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  await invoke("booking", { action: "cancel", appointmentId });
}

export async function rescheduleAppointment(input: {
  appointmentId: string;
  date: string;
  startTime: string;
}): Promise<{ ok: true; appointmentId: string; date: string; startTime: string; endTime: string }> {
  return invoke("booking", { action: "reschedule", ...input });
}

// ---- Engagement ----

export async function notifications(): Promise<{
  notifications: ClientNotificationItem[];
  unread: number;
}> {
  return invoke("engagement", { action: "notifications" });
}

export async function markRead(id: string): Promise<void> {
  await invoke("engagement", { action: "mark_read", id });
}

export async function markAllRead(): Promise<void> {
  await invoke("engagement", { action: "mark_all_read" });
}

export async function submitReview(input: {
  appointmentId: string;
  rating: number;
  comment: string | null;
  serviceQuality: number | null;
  waitingTime: number | null;
  communication: number | null;
}): Promise<void> {
  await invoke("engagement", { action: "review", ...input });
}

export async function registerPushToken(
  token: string,
  platform: "ios" | "android" | "web"
): Promise<void> {
  await invoke("engagement", { action: "register_push", token, platform });
}

export async function listFavorites(): Promise<FavoriteItem[]> {
  const res = await invoke<{ favorites: FavoriteItem[] }>("engagement", {
    action: "favorites",
  });
  return res.favorites;
}

export async function toggleFavorite(businessId: string): Promise<{ favorited: boolean }> {
  return invoke("engagement", { action: "favorite_toggle", businessId });
}
