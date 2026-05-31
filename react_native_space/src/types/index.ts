export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  documentId?: string;
  emailVerified?: boolean;
  profileImageUrl?: string | null;
  roles: string[];
  hasVendorProfile?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface QuickReply {
  id: string;
  messageText: string;
  order: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  stateId?: string;
  brandId?: string;
  categoryId?: string;
}

export interface RequestListItem {
  id: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number | null;
  partCategory: string;
  partSubcategory: string | null;
  status: string;
  responseCount: number;
  hasRating?: boolean | null;
  state: string;
  municipality: string;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface RequestDetail {
  id: string;
  vehicleBrand: { id: string; name: string };
  vehicleModel: { id: string; name: string };
  vehicleYear: number | null;
  partCategory: { id: string; name: string };
  partSubcategory: { id: string; name: string } | null;
  state: { id: string; name: string } | null;
  municipality: { id: string; name: string } | null;
  parish: { id: string; name: string } | null;
  searchRadiusKm: number | null;
  originalRadiusKm: number | null;
  freeDescription: string;
  status: string;
  responseCount: number;
  createdAt: string;
  closedAt: string | null;
}

export type ResponseTagValue = 'FAVORITO' | 'MEJOR_PRECIO' | 'EN_NEGOCIACION' | 'TIENE_REPUESTO' | 'DESCARTADO';

export interface RequestResponseItem {
  id: string;
  vendor: {
    id: string;
    businessName: string;
    logoUrl: string | null;
    facadeImageUrl?: string | null;
    avgRating: number | null;
    latitude: number | null;
    longitude: number | null;
  };
  initialMessage: string;
  chatId: string;
  distanceKm: number | null;
  tags: ResponseTagValue[];
  createdAt: string;
}

export interface VendorRequestListItem {
  matchId: string;
  request: {
    id: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: number | null;
    partCategory: string;
    partSubcategory: string | null;
    freeDescription: string;
    municipality: string;
    state: string;
    searchRadiusKm: number;
    lastMessageAt: string | null;
    createdAt: string;
    clientFirstName: string;
    clientLastName?: string;
    clientLevel?: ClientLevel;
  };
  status: string;
  respondedAt: string | null;
  declinedAt: string | null;
}

export interface VendorRequestDetailType {
  matchId: string;
  request: {
    id: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: number | null;
    partCategory: string;
    partSubcategory: string | null;
    freeDescription: string;
    municipality: string;
    state: string;
    parish: string | null;
    searchRadiusKm: number | null;
    originalRadiusKm: number | null;
    createdAt: string;
    clientFirstName: string;
    clientLastName?: string;
    status: string;
  };
  status: string;
  chatId: string | null;
}

export interface VendorDashboard {
  businessName: string;
  isAvailable: boolean;
  metrics: {
    totalRequestsReceived: number;
    totalRequestsAnswered: number;
    avgRating: number | null;
    totalRatings: number;
  };
  recentRequests: {
    matchId: string;
    request: {
      id: string;
      vehicleBrand: string;
      vehicleModel: string;
      vehicleYear: number | null;
      partCategory: string;
      partSubcategory: string | null;
      municipality: string;
      state: string;
      createdAt: string;
      clientFirstName: string;
      clientLastName?: string;
      clientLevel?: ClientLevel;
    };
    status: string;
    deliveredAt: string | null;
    respondedAt: string | null;
    declinedAt: string | null;
    responded: boolean;
    declined: boolean;
  }[];
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  rif: string;
  logoUrl: string | null;
  facadeImageUrl?: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  municipality: string | null;
  parish: string | null;
  street: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  referencePoint: string | null;
  fullAddress: string | null;
  isAvailable: boolean;
  vehicleModels: { id: string; name: string; brand: { id: string; name: string } }[];
  partSubcategories: { id: string; name: string; category: { id: string; name: string } }[];
  metrics: {
    totalRequestsReceived: number;
    totalRequestsAnswered: number;
    avgRating: number | null;
    totalRatings: number;
  };
}

export interface ChatInfo {
  id: string;
  requestId: string;
  vendorId: string;
  vendorUserId: string;
  clientId: string;
  requestSummary: string;
  otherUserName: string;
  unreadCount?: number;
  createdAt: string;
}

export interface VendorResponseMetrics {
  totalResponded: number;
  totalReceived: number;
  responseRate: number;
  avgResponseTimeMs: number | null;
  medianResponseTimeMs: number | null;
  fastestResponseTimeMs: number | null;
  slowestResponseTimeMs: number | null;
}

// ── Vendor Plan types ──
export interface VendorPlanInfo {
  plan: {
    id: string;
    name: string;
    slug: string;
    description: string;
    solicitudesMensuales: number;
    prioridad: number;
    precioMensual: number;
    precioAnual: number;
    comisionPorcentaje: number;
  } | null;
  subscription: {
    id: string;
    estado: string;
    fechaAsignacion: string;
    fechaExpiracion: string | null;
    fechaGracia: string | null;
    daysRemaining: number | null;
    totalDays: number | null;
    showRenewalWarning?: boolean;
  } | null;
  monthlyRequests: {
    count: number;
    limit: number; // -1 = unlimited
  };
}

// Client Points System
export interface ClientPointsSummary {
  totalPoints: number;
  currentLevel: {
    level: string;
    emoji: string;
    label: string;
  };
  nextLevel: {
    level: string;
    emoji: string;
    label: string;
    pointsRequired: number;
    pointsRemaining: number;
  } | null;
  stats: {
    totalRatings: number;
    totalRequests: number;
  };
  recentActivity: {
    id: string;
    action: string;
    points: number;
    requestId: string | null;
    createdAt: string;
  }[];
}

export interface PendingRatingItem {
  requestId: string;
  description: string;
  closedAt: string | null;
  vehicle: string;
  category: string;
  vendors: {
    id: string;
    businessName: string;
    logoUrl: string | null;
    avgRating: number | null;
  }[];
}

export interface ClientLevel {
  level: string;
  emoji: string;
  label: string;
}

export interface ChatMessageReplyTo {
  id: string;
  messageText: string;
  senderName: string;
}

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  messageText: string;
  messageType?: string;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  addressText?: string | null;
  audioUrl?: string | null;
  audioDuration?: number | null;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isEdited?: boolean;
  deletedForAll?: boolean;
  replyTo?: ChatMessageReplyTo | null;
  createdAt: string;
}
