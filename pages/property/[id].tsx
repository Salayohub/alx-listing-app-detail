import { useRouter } from "next/router";
import { PROPERTYLISTINGSAMPLE } from "@/constants";
import PropertyDetail from "@/components/property/PropertyDetail";
import BookingSection from "@/components/property/BookingSection";
import ReviewSection from "@/components/property/ReviewSection";

export default function PropertyPage() {
  const router = useRouter();
  const { id } = router.query;

  // Find the property based on the ID from the route
  const property = PROPERTYLISTINGSAMPLE.find((item) => item.id === id);

  if (!property) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">Property not found</h2>
        <p className="text-gray-500 mt-2">Please check the listing and try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Property Detail Section */}
      <PropertyDetail property={property} />

      {/* Responsive layout using grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        {/* Left Section: Reviews */}
        <div className="lg:col-span-2">
          <ReviewSection reviews={property.reviews || []} />
        </div>

        {/* Right Section: Booking */}
        <div className="lg:col-span-1">
           <BookingSection
          price={property.price}
          rating={property.rating}
          name={property.name}
        />
        </div>
      </div>
    </div>
  );
}
