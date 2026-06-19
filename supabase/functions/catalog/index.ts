import {
  requireAuth,
  createAdminClient,
  handlePreflight,
  makeResponder,
} from "../_shared/auth.ts";
import {
  parseBody,
  catalogDiscoverySchema,
  catalogClinicSchema,
  catalogDoctorSchema,
  catalogSlotsSchema,
} from "../_shared/validation.ts";
import { computeAvailableSlots, toMinutes, toHHMM, overlaps, weekdayInTz, nowInTz } from "../_shared/slots.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Filters {
  specialty?: string;
  service?: string;
  maxDistanceKm?: number;
  minRating?: number;
  availableToday?: boolean;
  maxPrice?: number;
  clinicName?: string;
  doctorName?: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function addDaysIso(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface AvailRow { staffId: string; weekday: number; startTime: string; endTime: string; slotIntervalMin: number; }
interface BusyRow { staffId: string; date: string; startTime: string; endTime: string; }

/** In-memory next available slot finder across the next `horizon` days. */
function nextSlot(
  staffId: string,
  durationMin: number,
  timezone: string,
  avail: AvailRow[],
  busy: BusyRow[],
): { date: string; startTime: string } | null {
  const staffAvail = avail.filter((a) => a.staffId === staffId);
  if (staffAvail.length === 0) return null;
  const tzNow = nowInTz(timezone);
  const base = new Date(`${tzNow.date}T12:00:00Z`);
  for (let i = 0; i < 21; i++) {
    const date = addDaysIso(base, i);
    const weekday = weekdayInTz(date, timezone);
    const windows = staffAvail.filter((a) => a.weekday === weekday);
    if (windows.length === 0) continue;
    const isToday = date === tzNow.date;
    const minStart = isToday ? tzNow.minutes : -1;
    const dayBusy = busy
      .filter((b) => b.staffId === staffId && b.date === date)
      .map((b) => [toMinutes(b.startTime), toMinutes(b.endTime)] as [number, number]);
    const candidates: number[] = [];
    for (const w of windows) {
      const ws = toMinutes(w.startTime);
      const we = toMinutes(w.endTime);
      const step = w.slotIntervalMin > 0 ? w.slotIntervalMin : 15;
      for (let s = ws; s + durationMin <= we; s += step) {
        if (s <= minStart) continue;
        if (dayBusy.some(([bs, be]) => overlaps(s, s + durationMin, bs, be))) continue;
        candidates.push(s);
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a - b);
      return { date, startTime: toHHMM(candidates[0]) };
    }
  }
  return null;
}

function isOpenNow(staffId: string, timezone: string, avail: AvailRow[]): boolean {
  const tzNow = nowInTz(timezone);
  const weekday = weekdayInTz(tzNow.date, timezone);
  return avail.some(
    (a) =>
      a.staffId === staffId &&
      a.weekday === weekday &&
      toMinutes(a.startTime) <= tzNow.minutes &&
      tzNow.minutes < toMinutes(a.endTime),
  );
}

async function buildProviders(admin: SupabaseClient, lat: number | null, lng: number | null) {
  const { data: staff } = await admin
    .from("TeamMember")
    .select("id,businessId,fullName,role,specialty,bio,color,isBookable,isActive")
    .eq("isBookable", true)
    .eq("isActive", true)
    .is("deletedAt", null);
  const staffList = staff ?? [];
  const businessIds = [...new Set(staffList.map((s) => s.businessId))];

  const { data: businesses } = await admin
    .from("Business")
    .select("id,name,description,phone,address,city,locationLat,locationLng,logoUrl,primaryColor,currency,timezone,autoConfirmClientAppointments,isActive")
    .in("id", businessIds.length ? businessIds : ["__none__"])
    .eq("isActive", true)
    .is("deletedAt", null);
  const bizMap = new Map((businesses ?? []).map((b) => [b.id, b]));

  const staffIds = staffList.map((s) => s.id);
  const { data: serviceStaff } = await admin
    .from("ServiceStaff")
    .select("serviceId,staffId,isActive")
    .in("staffId", staffIds.length ? staffIds : ["__none__"])
    .eq("isActive", true)
    .is("deletedAt", null);
  const serviceIds = [...new Set((serviceStaff ?? []).map((ss) => ss.serviceId))];
  const { data: services } = await admin
    .from("Service")
    .select("id,businessId,name,description,category,durationMin,price,currency,color,isActive")
    .in("id", serviceIds.length ? serviceIds : ["__none__"])
    .eq("isActive", true)
    .is("deletedAt", null);
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const { data: reviews } = await admin
    .from("Review")
    .select("staffId,businessId,rating")
    .in("businessId", businessIds.length ? businessIds : ["__none__"])
    .is("deletedAt", null);

  const today = nowInTz("Europe/Istanbul").date;
  const { data: avail } = await admin
    .from("TeamMemberAvailability")
    .select("staffId,weekday,startTime,endTime,slotIntervalMin")
    .in("staffId", staffIds.length ? staffIds : ["__none__"])
    .eq("isActive", true)
    .is("deletedAt", null);
  const availRows = (avail ?? []) as AvailRow[];

  const { data: appts } = await admin
    .from("Appointment")
    .select("staffId,date,startTime,endTime,status")
    .in("staffId", staffIds.length ? staffIds : ["__none__"])
    .gte("date", today)
    .in("status", ["SCHEDULED", "CONFIRMED"])
    .is("deletedAt", null);
  const { data: blocks } = await admin
    .from("TeamMemberUnavailableBlock")
    .select("staffId,date,startTime,endTime")
    .in("staffId", staffIds.length ? staffIds : ["__none__"])
    .gte("date", today)
    .is("deletedAt", null);
  const busy: BusyRow[] = [
    ...((appts ?? []) as BusyRow[]),
    ...((blocks ?? []) as BusyRow[]),
  ];

  const providers = staffList.map((s) => {
    const biz = bizMap.get(s.businessId);
    if (!biz) return null;
    const myServices = (serviceStaff ?? [])
      .filter((ss) => ss.staffId === s.id)
      .map((ss) => serviceMap.get(ss.serviceId))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    const prices = myServices.map((sv) => Number(sv.price)).filter((p) => p > 0);
    const myReviews = (reviews ?? []).filter((r) => r.staffId === s.id);
    const ratingCount = myReviews.length;
    const ratingAvg = ratingCount > 0 ? myReviews.reduce((a, r) => a + r.rating, 0) / ratingCount : 0;
    const tz = biz.timezone ?? "Europe/Istanbul";
    let distanceKm: number | null = null;
    if (lat != null && lng != null && biz.locationLat != null && biz.locationLng != null) {
      distanceKm = haversineKm(lat, lng, Number(biz.locationLat), Number(biz.locationLng));
    }
    const minDuration = myServices.length ? Math.min(...myServices.map((sv) => sv.durationMin)) : 30;
    const next = nextSlot(s.id, minDuration, tz, availRows, busy);
    return {
      staffId: s.id,
      doctorName: s.fullName,
      specialty: s.specialty ?? null,
      bio: s.bio ?? null,
      color: s.color,
      businessId: biz.id,
      clinicName: biz.name,
      city: biz.city ?? null,
      address: biz.address ?? null,
      logoUrl: biz.logoUrl ?? null,
      primaryColor: biz.primaryColor,
      currency: biz.currency,
      autoConfirm: biz.autoConfirmClientAppointments,
      distanceKm,
      rating: Number(ratingAvg.toFixed(2)),
      reviewCount: ratingCount,
      serviceCount: myServices.length,
      services: myServices.map((sv) => ({
        id: sv.id,
        name: sv.name,
        category: sv.category ?? null,
        durationMin: sv.durationMin,
        price: Number(sv.price),
        currency: sv.currency,
        description: sv.description ?? null,
      })),
      priceMin: prices.length ? Math.min(...prices) : null,
      priceMax: prices.length ? Math.max(...prices) : null,
      isOpenNow: isOpenNow(s.id, tz, availRows),
      nextAvailable: next,
    };
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return providers;
}

type Provider = Awaited<ReturnType<typeof buildProviders>>[number];

function applyFilters(list: Provider[], query: string | undefined, f: Filters): Provider[] {
  let out = list;
  if (query && query.trim()) {
    const q = query.trim().toLocaleLowerCase("tr");
    out = out.filter(
      (p) =>
        p.doctorName.toLocaleLowerCase("tr").includes(q) ||
        p.clinicName.toLocaleLowerCase("tr").includes(q) ||
        (p.specialty ?? "").toLocaleLowerCase("tr").includes(q) ||
        p.services.some((s) => s.name.toLocaleLowerCase("tr").includes(q)),
    );
  }
  if (f.specialty) out = out.filter((p) => (p.specialty ?? "").toLocaleLowerCase("tr").includes(f.specialty!.toLocaleLowerCase("tr")));
  if (f.service) out = out.filter((p) => p.services.some((s) => s.name.toLocaleLowerCase("tr").includes(f.service!.toLocaleLowerCase("tr"))));
  if (f.clinicName) out = out.filter((p) => p.clinicName.toLocaleLowerCase("tr").includes(f.clinicName!.toLocaleLowerCase("tr")));
  if (f.doctorName) out = out.filter((p) => p.doctorName.toLocaleLowerCase("tr").includes(f.doctorName!.toLocaleLowerCase("tr")));
  if (f.minRating != null) out = out.filter((p) => p.rating >= f.minRating!);
  if (f.maxPrice != null) out = out.filter((p) => p.priceMin != null && p.priceMin <= f.maxPrice!);
  if (f.maxDistanceKm != null) out = out.filter((p) => p.distanceKm != null && p.distanceKm <= f.maxDistanceKm!);
  if (f.availableToday) {
    const today = nowInTz("Europe/Istanbul").date;
    out = out.filter((p) => p.nextAvailable != null && p.nextAvailable.date === today);
  }
  return out;
}

function sortProviders(list: Provider[], sort: string | undefined): Provider[] {
  const out = [...list];
  switch (sort) {
    case "rating":
      out.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case "reviews":
      out.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case "earliest":
      out.sort((a, b) => {
        const av = a.nextAvailable ? `${a.nextAvailable.date}${a.nextAvailable.startTime}` : "9999";
        const bv = b.nextAvailable ? `${b.nextAvailable.date}${b.nextAvailable.startTime}` : "9999";
        return av.localeCompare(bv);
      });
      break;
    case "nearest":
    default:
      out.sort((a, b) => {
        const ad = a.distanceKm ?? Number.MAX_SAFE_INTEGER;
        const bd = b.distanceKm ?? Number.MAX_SAFE_INTEGER;
        return ad - bd;
      });
  }
  return out;
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  const { json, error } = makeResponder(req);
  try {
    await requireAuth(req);
    const admin = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "discovery" || action === "search") {
      const parsed = parseBody(catalogDiscoverySchema, body, req);
      if (parsed instanceof Response) return parsed;
      const providers = await buildProviders(admin, parsed.lat ?? null, parsed.lng ?? null);
      const filtered = applyFilters(providers, parsed.query, (parsed.filters ?? {}) as Filters);
      const sorted = sortProviders(filtered, parsed.sort);

      if (action === "discovery") {
        const today = nowInTz("Europe/Istanbul").date;
        const availableToday = sorted.filter((p) => p.nextAvailable?.date === today);
        const topRated = [...providers].filter((p) => p.reviewCount > 0).sort((a, b) => b.rating - a.rating).slice(0, 10);
        const serviceCatalog = new Map<string, { name: string; count: number; category: string | null }>();
        for (const p of providers) {
          for (const s of p.services) {
            const key = s.name.toLocaleLowerCase("tr");
            const ex = serviceCatalog.get(key);
            if (ex) ex.count++;
            else serviceCatalog.set(key, { name: s.name, count: 1, category: s.category });
          }
        }
        const popularServices = [...serviceCatalog.values()].sort((a, b) => b.count - a.count).slice(0, 12);
        return json({
          nearby: sortProviders(providers, "nearest").slice(0, 20),
          availableToday: availableToday.slice(0, 20),
          topRated,
          popularServices,
        });
      }
      return json({ providers: sorted });
    }

    if (action === "clinic") {
      const parsed = parseBody(catalogClinicSchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { businessId, lat, lng } = parsed;
      const providers = await buildProviders(admin, lat ?? null, lng ?? null);
      const clinicProviders = providers.filter((p) => p.businessId === businessId);
      if (clinicProviders.length === 0) {
        const { data: biz } = await admin.from("Business").select("id,name,description,phone,address,city,locationLat,locationLng,logoUrl,primaryColor,currency").eq("id", businessId).maybeSingle();
        return json({ business: biz, doctors: [], reviews: [], rating: 0, reviewCount: 0 });
      }
      const first = clinicProviders[0];
      const { data: reviews } = await admin
        .from("Review")
        .select("id,rating,comment,serviceQuality,waitingTime,communication,createdAt,staffId")
        .eq("businessId", businessId)
        .is("deletedAt", null)
        .order("createdAt", { ascending: false })
        .limit(50);
      const reviewList = reviews ?? [];
      const rating = reviewList.length ? reviewList.reduce((a, r) => a + r.rating, 0) / reviewList.length : 0;
      return json({
        business: {
          id: first.businessId,
          name: first.clinicName,
          description: null,
          city: first.city,
          address: first.address,
          phone: null,
          logoUrl: first.logoUrl,
          primaryColor: first.primaryColor,
          currency: first.currency,
          distanceKm: first.distanceKm,
        },
        doctors: clinicProviders,
        reviews: reviewList,
        rating: Number(rating.toFixed(2)),
        reviewCount: reviewList.length,
      });
    }

    if (action === "doctor") {
      const parsed = parseBody(catalogDoctorSchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { staffId, lat, lng } = parsed;
      const providers = await buildProviders(admin, lat ?? null, lng ?? null);
      const doctor = providers.find((p) => p.staffId === staffId);
      const { data: reviews } = await admin
        .from("Review")
        .select("id,rating,comment,serviceQuality,waitingTime,communication,createdAt")
        .eq("staffId", staffId)
        .is("deletedAt", null)
        .order("createdAt", { ascending: false })
        .limit(50);
      return json({ doctor: doctor ?? null, reviews: reviews ?? [] });
    }

    if (action === "slots") {
      const parsed = parseBody(catalogSlotsSchema, body, req);
      if (parsed instanceof Response) return parsed;
      const { staffId, serviceId, date, excludeAppointmentId } = parsed;
      const { data: svc } = await admin.from("Service").select("durationMin,businessId").eq("id", serviceId).maybeSingle();
      if (!svc) return json({ slots: [] });
      const { data: biz } = await admin.from("Business").select("timezone").eq("id", svc.businessId).maybeSingle();
      const slots = await computeAvailableSlots(admin, {
        businessId: svc.businessId,
        staffId,
        durationMin: svc.durationMin,
        date,
        timezone: biz?.timezone ?? "Europe/Istanbul",
        excludeAppointmentId,
      });
      return json({ slots });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (err) {
    return error(err);
  }
});
