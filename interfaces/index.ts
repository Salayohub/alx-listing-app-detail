export interface PropertyProps {
  id:string;
  name: string;
  description:string;
  address: {
    state: string;
    city: string;
    country: string;
  };
  rating: number;
  category: string[];
  price: number;
  offers: {
    bed: string;
    shower: string;
    occupants: string;
  };
  image: string;
  discount: string;
}

export interface Review {
  id: number;
  user: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  rating: number;
  price: number;
  images: string[];
  description: string;
  amenities: string[];
  reviews: Review[];
}
