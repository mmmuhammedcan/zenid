import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

export default function TopNav() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-stone-800/50 bg-stone-950/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center transition-opacity hover:opacity-90" aria-label="ZenID home">
          <img
            src="/assets/zenid-wordmark.png"
            alt="ZenID"
            width={1244}
            height={332}
            className="h-6 w-auto sm:h-7 md:h-8"
          />
        </Link>

        {!isHome && (
          <Link
            to="/"
            title="Back to home"
            className="flex items-center justify-center rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-200"
            aria-label="Go to home"
          >
            <Home size={20} />
          </Link>
        )}
      </div>
    </nav>
  );
}
