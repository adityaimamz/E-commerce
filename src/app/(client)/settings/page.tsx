import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Biodata Diri</h1>
      
      <form className="flex flex-col gap-5 max-w-lg">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">Nama Lengkap</label>
          <input 
            type="text" 
            defaultValue={user.name || ""} 
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black"
            placeholder="John Doe"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">Email</label>
          <input 
            type="email" 
            defaultValue={user.email} 
            disabled
            className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-md outline-none cursor-not-allowed"
          />
          <p className="text-xs text-gray-500">Email tidak dapat diubah (digunakan untuk login).</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">Nomor Telepon</label>
          <input 
            type="tel" 
            defaultValue={""} 
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black"
            placeholder="08123456789"
          />
        </div>

        <button 
          type="button" 
          className="mt-4 bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors self-start"
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
