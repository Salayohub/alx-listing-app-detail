"use client";
import React, { useState, useEffect } from "react";

interface BookingSectionProps {
  price: number;
  name: string;
  rating: number;
}

const BookingSection: React.FC<BookingSectionProps> = ({ price, name, rating }) => {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalCost, setTotalCost] = useState<number>(0);

  // 🧮 Calculate total nights and cost dynamically
  useEffect(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setTotalCost(diffDays * price);
    } else {
      setTotalCost(0);
    }
  }, [checkIn, checkOut, price]);

  return (
    <div className="sticky top-20 bg-white p-6 shadow-lg rounded-2xl border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-2xl font-semibold text-gray-800">${price}
          <span className="text-base font-normal text-gray-500"> /night</span>
        </h3>
        <span className="text-yellow-500 text-sm font-medium">★ {rating}</span>
      </div>

      <p className="text-gray-500 text-sm mb-4">Stay at {name}</p>

      {/* Check-in */}
      <div className="mt-3">
        <label className="block text-gray-600 text-sm mb-1">Check-in</label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Check-out */}
      <div className="mt-4">
        <label className="block text-gray-600 text-sm mb-1">Check-out</label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Total payment */}
      <div className="mt-5 bg-gray-50 p-3 rounded-lg flex justify-between items-center">
        <span className="text-gray-600 text-sm">Total payment:</span>
        <span className="text-lg font-semibold text-gray-900">
          {totalCost > 0 ? `$${totalCost}` : "--"}
        </span>
      </div>

      {/* Reserve Button */}
      <button
        disabled={!checkIn || !checkOut}
        className={`mt-5 w-full py-3 rounded-lg font-semibold transition-colors duration-200 ${
          checkIn && checkOut
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
      >
        Reserve now
      </button>
    </div>
  );
};

export default BookingSection;
