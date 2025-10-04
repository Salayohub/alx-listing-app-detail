"use client";

import { useState } from "react";
import Link from "next/link";

const Header: React.FC = () => {
  const [search, setSearch] = useState("");

  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          StayFinder
        </Link>

        {/* Search Bar */}
        <div className="flex-1 mx-6">
          <input
            type="text"
            placeholder="Search for accommodation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Auth Buttons */}
        <div className="space-x-4">
          <button className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100">
            Sign In
          </button>
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            Sign Up
          </button>
        </div>
      </div>

      {/* Types of Accommodation */}
      <nav className="w-full border-t border-gray-200 bg-gray-50">
        <ul className="flex items-center justify-center space-x-6 py-3 text-gray-600 font-medium">
          <li><Link href="/rooms">Rooms</Link></li>
          <li><Link href="/mansion">Mansion</Link></li>
          <li><Link href="/countryside">Countryside</Link></li>
          <li><Link href="/apartments">Apartments</Link></li>
          <li><Link href="/resorts">Resorts</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;