import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto p-4 sm:px-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-6xl">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
