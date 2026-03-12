import { auth } from "@/lib/auth";
import Link from "next/link";
import { User, MapPin, Shield } from "lucide-react";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-semibold mb-4">Silakan Masuk</h2>
        <p className="text-gray-500 mb-6">Anda harus masuk untuk mengakses pengaturan.</p>
        <Link href="/auth/login" className="bg-black text-white px-6 py-2 rounded-md">
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  const menuItems = [
    { title: "Biodata Diri", icon: User, href: "/settings" },
    { title: "Alamat Pengiriman", icon: MapPin, href: "/settings/address" },
    { title: "Keamanan Password", icon: Shield, href: "/settings/security" },
  ];

  return (
    <div className="my-10 flex flex-col md:flex-row gap-8">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-1/4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="text-gray-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{session.user.name}</p>
              <p className="text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                // Ideally use usePathname here for active state, but since this is a server component, simple UI applies
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="w-full md:w-3/4">
        <div className="bg-white rounded-lg border border-gray-200">
          {children}
        </div>
      </main>
    </div>
  );
}
