import React, { useState } from "react";
import { PropertyProps } from "@/interfaces";
import BookingSection from "./BookingSection";
import ReviewSection from "./ReviewSection";
import {
  Wifi,
  BedDouble,
  Car,
  Tv,
  Coffee,
  Utensils,
  Droplets,
  Wind,
  Star,
} from "lucide-react";

const PropertyDetail: React.FC<{ property: PropertyProps }> = ({ property }) => {
  const [activeTab, setActiveTab] = useState("offer");

  // Amenity icon mapping
  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-5 h-5 text-blue-500" />,
    bed: <BedDouble className="w-5 h-5 text-green-500" />,
    parking: <Car className="w-5 h-5 text-gray-600" />,
    tv: <Tv className="w-5 h-5 text-purple-500" />,
    kitchen: <Utensils className="w-5 h-5 text-orange-500" />,
    coffee: <Coffee className="w-5 h-5 text-yellow-500" />,
    water: <Droplets className="w-5 h-5 text-sky-500" />,
    ac: <Wind className="w-5 h-5 text-cyan-500" />,
  };

  // Include wifi in amenities if not already there
  const updatedAmenities = property.amenities?.includes("wifi")
    ? property.amenities
    : [...(property.amenities || []), "wifi"];

  return (
    <div className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ===== Left Content (Property Info) ===== */}
      <div className="lg:col-span-2">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
          <div className="flex items-center gap-3 text-gray-600 mt-2">
            <span className="flex items-center gap-1 text-yellow-500 font-medium">
              <Star className="w-4 h-4" /> {property.rating}
            </span>
            <span>
              {property.address.city}, {property.address.country}
            </span>
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {property.images?.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${property.name} image ${index + 1}`}
              className={`object-cover w-full h-64 rounded-lg ${
                index === 0 ? "lg:col-span-2 lg:row-span-2 h-full" : ""
              }`}
            />
          ))}
        </div>

        {/* Tabs Section */}
        <div className="mt-6 border-b border-gray-300">
          <div className="flex gap-6">
            {["offer", "reviews", "host"].map((tab) => (
              <button
                key={tab}
                className={`pb-2 capitalize ${
                  activeTab === tab
                    ? "border-b-2 border-gray-800 text-gray-900 font-semibold"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "offer"
                  ? "What We Offer"
                  : tab === "reviews"
                  ? "Reviews"
                  : "About Host"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "offer" && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 leading-relaxed">{property.description}</p>

              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">
                  What this place offers
                </h3>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {updatedAmenities.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 text-gray-800"
                    >
                      {amenityIcons[item.toLowerCase()] || (
                        <span className="w-5 h-5 text-gray-400">•</span>
                      )}
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-xl font-semibold">Guest Reviews</h3>
              </div>
              <ReviewSection />
            </div>
          )}

          {activeTab === "host" && property.host &&(
            <div>
              <h3 className="text-xl font-semibold mb-2">About the Host</h3>
              <div className="flex items-center gap-4">
                {property.host.image&&(
                <img
                  src={property.host.image}
                  alt={property.host.name ?? "Host"}
                  className="w-16 h-16 rounded-full object-cover"
                />
                 )}

                <div>
                  {property.host.name &&(
                  <h4 className="font-semibold text-gray-800">
                    {property.host.name}
                  </h4>  
                  )}

                  {property.host.description &&(
                  <p className="text-gray-600">{property.host.description}</p> 
                  )}
                </div>
                  
                
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Right Content (Booking Section) ===== */}
      <div className="lg:col-span-1">
        <BookingSection
          price={property.price}
          rating={property.rating}
          name={property.name}
        />
      </div>
    </div>
  );
};

export default PropertyDetail;
