export default function SecurityPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Keamanan Password</h1>
      
      <form className="flex flex-col gap-5 max-w-lg">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">Password Lama</label>
          <input 
            type="password" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black"
            placeholder="Masukkan password saat ini"
          />
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-sm text-gray-600 font-medium">Password Baru</label>
          <input 
            type="password" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black"
            placeholder="Minimal 8 karakter"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">Konfirmasi Password Baru</label>
          <input 
            type="password" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black"
            placeholder="Ulangi password baru"
          />
        </div>

        <button 
          type="button" 
          className="mt-4 bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors self-start"
        >
          Ubah Password
        </button>
      </form>
    </div>
  );
}
