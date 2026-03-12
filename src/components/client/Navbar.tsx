import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";
import { Bell, Home, LogOut, User } from "lucide-react";
import ShoppingCartIcon from "./ShoppingCartIcon";
import { auth, signOut } from "@/lib/auth";

const Navbar = async () => {
  const session = await auth();

  return (
    <nav className="w-full flex items-center justify-between border-b border-gray-200 pb-4">
      {/* LEFT */}
      <Link href="/" className="flex items-center">
        <Image
          src="/logo.png"
          alt="TrendLama"
          width={36}
          height={36}
          className="w-6 h-6 md:w-9 md:h-9"
        />
        <p className="hidden md:block text-md font-medium tracking-wider">
          TRENDLAMA.
        </p>
      </Link>
      {/* RIGHT */}
      <div className="flex items-center gap-6">
        <SearchBar />
        <Link href="/">
          <Home className="w-4 h-4 text-gray-600"/>
        </Link>
        <Bell className="w-4 h-4 text-gray-600"/>
        <ShoppingCartIcon/>
        {session?.user ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-600 flex items-center gap-1">
              <User className="w-3 h-3 inline" /> {session.user.name || session.user.email}
            </span>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}>
              <button type="submit" className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Keluar</span>
              </button>
            </form>
          </div>
        ) : (
          <Link href="/auth/login" className="text-sm text-gray-700 hover:text-black transition-colors">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
