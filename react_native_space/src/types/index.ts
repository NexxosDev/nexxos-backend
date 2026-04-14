export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  documentId?: string;
  roles: string[];
  hasVendorProfile?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
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
  partCategory: string;
  partSubcategory: string | null;
  status: string;
  responseCount: number;
  state: string;
  municipality: string;
  createdAt: string;
}

export interface RequestDetail {
  id: string;
  vehicleBrand: { id: string; name: string };
  vehicleModel: { id: string; name: string };
  partCategory: { id: string; name: string };
  partSubcategory: { id: string; name: string } | null;
  state: { id: string; name: string };
  municipality: { id: string; name: string };
  searchRadiusKm: number;
  freeDescription: string;
  status: string;
  responseCount: number;
  createdAt: string;
  closedAt: string | null;
}

export interface RequestResponseItem {
  id: string;
  vendor: {
    id: string;
    businessName: string;
    logoUrl: string | null;
    avgRating: number | null;
  };
  initialMessage: string;
  chatId: string;
  createdAt: string;
}

export interface VendorRequestListItem {
  matchId: string;
  request: {
    id: string;
    vehicleBrand: string;
    vehicleModel: string;
    partCategory: string;
    partSubcategory: string | null;
    freeDescription: string;
    municipality: string;
    state: string;
    searchRadiusKm: number;
    createdAt: string;
    clientFirstName: string;
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
    partCategory: string;
    partSubcategory: string | null;
    freeDescription: string;
    municipality: string;
    state: string;
    searchRadiusKm: number;
    createdAt: string;
    clientFirstName: string;
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
      partCategory: string;
      partSubcategory: string | null;
      municipality: string;
      state: string;
      createdAt: string;
    };
    status: string;
  }[];
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  rif: string;
  logoUrl: string | null;
  state: { id: string; name: string };
  municipality: { id: string; name: string };
  searchRadiusKm: number;
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
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  messageText: string;
  createdAt: string;
}
