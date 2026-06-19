export interface ClientUser {
  id: string;
  authUserId: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  locationLat: number | null;
  locationLng: number | null;
  address: string | null;
  city: string | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string | null;
  durationMin: number;
  price: number;
  currency: string;
  description: string | null;
}

export interface NextSlot {
  date: string;
  startTime: string;
}

export interface Provider {
  staffId: string;
  doctorName: string;
  specialty: string | null;
  bio: string | null;
  color: string;
  businessId: string;
  clinicName: string;
  city: string | null;
  address: string | null;
  logoUrl: string | null;
  primaryColor: string;
  currency: string;
  autoConfirm: boolean;
  distanceKm: number | null;
  rating: number;
  reviewCount: number;
  serviceCount: number;
  services: ServiceItem[];
  priceMin: number | null;
  priceMax: number | null;
  isOpenNow: boolean;
  nextAvailable: NextSlot | null;
}

export interface PopularService {
  name: string;
  count: number;
  category: string | null;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  serviceQuality: number | null;
  waitingTime: number | null;
  communication: number | null;
  createdAt: string;
  staffId: string | null;
}

export interface ClinicInfo {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  currency: string | null;
  distanceKm: number | null;
}

export interface SlotItem {
  startTime: string;
  endTime: string;
}

export interface NamedDuration {
  name: string;
  durationMin: number | null;
}

export interface DoctorBrief {
  fullName: string;
  specialty: string | null;
}

export interface BusinessBrief {
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
}

export interface AppointmentRow {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
  price: number | null;
  notes: string | null;
  createdAt: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  hasReview: boolean;
  Service: NamedDuration | null;
  TeamMember: DoctorBrief | null;
  Business: BusinessBrief | null;
}

export interface NotificationBusiness {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface ClientNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  appointmentId: string | null;
  businessId: string | null;
  Business: NotificationBusiness | null;
}

export interface FavoriteBusiness {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  city: string | null;
  address: string | null;
}

export interface FavoriteItem {
  businessId: string;
  createdAt: string;
  Business: FavoriteBusiness | null;
}

export interface DiscoveryResponse {
  nearby: Provider[];
  availableToday: Provider[];
  topRated: Provider[];
  popularServices: PopularService[];
}

export interface ClinicResponse {
  business: ClinicInfo | null;
  doctors: Provider[];
  reviews: ReviewItem[];
  rating: number;
  reviewCount: number;
}

export interface DoctorResponse {
  doctor: Provider | null;
  reviews: ReviewItem[];
}

export interface BookingResponse {
  ok: boolean;
  appointmentId: string;
  status: string;
  startTime: string;
  endTime: string;
  date: string;
}

export interface SearchFilters {
  specialty?: string;
  service?: string;
  maxDistanceKm?: number;
  minRating?: number;
  availableToday?: boolean;
  maxPrice?: number;
  clinicName?: string;
  doctorName?: string;
}

export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Onay bekliyor",
  CONFIRMED: "Onaylandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal edildi",
  NO_SHOW: "Gelinmedi",
};
