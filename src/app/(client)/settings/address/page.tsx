export default function AddressPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Alamat Pengiriman</h1>
      
      <form className="flex flex-col gap-5 max-w-lg">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">Jalan</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black"
            placeholder="Jl. Merdeka No. 1"
          />
        </div>
        
        <div className="flex flex-row gap-4">
          <div className="flex flex-col gap-2 w-1/2">
            <label className="text-sm text-gray-600 font-medium">Kota</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black"
              placeholder="Jakarta Pusat"
            />
          </div>
          <div className="flex flex-col gap-2 w-1/2">
            <label className="text-sm text-gray-600 font-medium">Provinsi</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black"
              placeholder="DKI Jakarta"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-1/2">
          <label className="text-sm text-gray-600 font-medium">Kode Pos</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-black"
            placeholder="10110"
          />
        </div>

        <button 
          type="button" 
          className="mt-4 bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors self-start"
        >
          Simpan Alamat
        </button>
      </form>
    </div>
  );
}
