export type SellerCategory = "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED";

export type ViewMode = "list" | "map";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MapListing {
  type: "MEAL_BAG" | "SPECIFIC_PARCEL";
  pickupStart?: string;
  pickupEnd?: string;
  discountedPrice: number;
  originalPrice: number;
  itemsLeft: number;
}

export interface MapSeller {
  id: string;
  name: string;
  type: string;
  businessType: string;
  lat: number;
  lng: number;
  category: SellerCategory;
  listing: MapListing;
}
