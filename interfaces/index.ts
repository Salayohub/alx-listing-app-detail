// Review interface — used by ReviewSection
export interface ReviewProps {
  reviews?: Review[];        // date posted
}
type  Review = {
  
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
};



// Property interface — used across PropertyDetail and listings
export interface PropertyProps {
  id: string;
  name: string;
  description: string;
  address: {
    state: string;
    city: string;
    country: string;
  };
  rating: number;
  category: string[]; // categories/tags (e.g. "apartment", "villa")
  price: number;
  offers: {
    bed: string;
    shower: string;
    occupants: string;
  };
  image: string;       // main image
  discount: string;    // e.g. "20" for 20% off

  // 🆕 list of amenities (e.g. ["wifi", "tv", "parking"])
  amenities?:string []

 // optional array of reviews
  images?: string[];       // optional gallery

  host?: {                 // optional host details for host tab
    name ?: string;
    image ?: string;
    description ?: string;
  };
  reviews?: Review[];
}

// Optional — for future booking calculations
export interface BookingProps {
  price: number;
  checkInDate: string;
  checkOutDate: string;
  totalCost: number;
}
