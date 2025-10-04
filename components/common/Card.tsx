interface PropertyCard {
  image: string;
  name: string;
  price: string;
  rating: number;
}

export default function PropertyCard({ image, name, price, rating }: PropertyCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <img src={image} alt={name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-gray-600">{price}</p>
        <p className="text-yellow-500 font-medium">⭐ {rating}</p>
      </div>
    </div>
  );
}
