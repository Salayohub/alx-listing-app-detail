import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gray-900 text-gray-300 py-10 mt-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand / Logo */}
        <div>
          <h2 className="text-2xl font-bold text-white">StayFinder</h2>
          <p className="mt-3 text-sm">
            Your trusted platform for booking the best accommodations worldwide.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Categories</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/rooms">Rooms</Link></li>
            <li><Link href="/mansion">Mansion</Link></li>
            <li><Link href="/countryside">Countryside</Link></li>
            <li><Link href="/apartments">Apartments</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Stay Updated</h3>
          <form className="flex flex-col space-y-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-3 py-2 rounded-md text-gray-800 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} StayFinder. All rights reserved.</p>
      </div>
    </footer>
  );
}


export default Footer;