interface PropertyCard {
  image: string;
  name: string;
  price: string;
  rating: number;
  discount:string;
  
}

export default function PropertyCard({ image, name, price, rating,discount  }: PropertyCard) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <img src={image} alt={name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-gray-600">{price}</p>
        <p className="text-yellow-500 font-medium">⭐ {rating}</p>
       <p className="text-orange-500 font-medium">{discount}</p>
     
      </div>
    </div>
  );
}
