import Image from "next/image";
import Pill from "@/components/ui/Pill";
import PropertyCard from "@/components/common/Card";
import { PROPERTYLISTINGSAMPLE } from "@/constants";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center text-center text-white">
        <Image
          src={"/assets/image1.png"}
          alt="Hero Background"
          fill
          priority
          className="object-cover -z-10"
        />
        <div className="max-w-2xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Find your favorite place here!
          </h1>
          <p className="mt-4 text-lg">
            The best prices for over 2 million properties worldwide.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-3 justify-center">
          {PROPERTYLISTINGSAMPLE.map((filter, index) => (
            <Pill key={index} label={filter.name} />
          ))}
        </div>
      </section>

      {/* Listing Section */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {PROPERTYLISTINGSAMPLE.map((property) => (
          <PropertyCard
            key={property.id}
            image={property.image}
            name={property.name}
            price={property.price}
            rating={property.rating}
            
          />
        ))}
      </section>
    </div>
  );
}
