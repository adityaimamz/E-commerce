import { auth } from "@/lib/auth";
import { TransactionService } from "@/services/transaction.service";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import TrackOrderButton from "@/components/client/TrackOrderButton";

export default async function PurchasesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] mt-10">
        <h2 className="text-2xl font-semibold mb-4">Silakan Masuk</h2>
        <p className="text-gray-500 mb-6">Anda harus masuk untuk melihat riwayat pembelian.</p>
        <Link href="/auth/login" className="bg-black text-white px-6 py-2 rounded-md">
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  const transactions = await TransactionService.getUserTransactions(session.user.id);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-green-100 text-green-700 border-green-200";
      case "PENDING": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      case "EXPIRED": return "bg-gray-100 text-gray-700 border-gray-200";
      case "FAILED": return "bg-red-100 text-red-700 border-red-200";
      case "REFUNDED": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-gray-100 text-gray-600 border-gray-200";
      case "PROCESSING": return "bg-sky-100 text-sky-700 border-sky-200";
      case "PACKING": return "bg-blue-100 text-blue-700 border-blue-200";
      case "SHIPPED": return "bg-purple-100 text-purple-700 border-purple-200";
      case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-300";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      case "RETURNED": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "Menunggu Pembayaran";
      case "PAID": return "Terbayar";
      case "CANCELLED": return "Dibatalkan";
      case "EXPIRED": return "Kedaluwarsa";
      case "FAILED": return "Gagal";
      case "REFUNDED": return "Refund";
      default: return status;
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "Menunggu";
      case "PROCESSING": return "Diproses";
      case "PACKING": return "Dikemas";
      case "SHIPPED": return "Dikirim";
      case "DELIVERED": return "Sampai";
      case "COMPLETED": return "Selesai";
      case "CANCELLED": return "Batal";
      case "RETURNED": return "Retur";
      default: return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mt-4 mb-24">
      <h1 className="text-2xl font-semibold mb-8">Riwayat Pembelian</h1>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border border-gray-100">
          <Package className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Belum ada transaksi</h3>
          <p className="text-gray-500 mt-2">Anda belum melakukan pembelian apa pun.</p>
          <Link href="/" className="mt-6 text-black border border-black hover:bg-black hover:text-white transition-colors px-6 py-2 rounded-md">
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {transactions.map((tx) => (
            <div key={tx.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tanggal</p>
                    <p className="text-sm font-medium">{new Date(tx.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-sm font-medium">Rp {tx.totalAmount.toLocaleString("id-ID")}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold px-1">Pembayaran</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getPaymentStatusColor(tx.paymentStatus)}`}>
                      {getPaymentStatusText(tx.paymentStatus)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold px-1">Pesanan</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getOrderStatusColor(tx.orderStatus)}`}>
                      {getOrderStatusText(tx.orderStatus)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col gap-4">
                  {tx.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {item.product.images[0] ? (
                          <Image 
                            src={item.product.images[0].url} 
                            alt={item.product.name} 
                            fill 
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <h4 className="font-medium text-gray-800 line-clamp-1">{item.product.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{item.quantity} barang x Rp {item.priceSnapshot.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  {["SHIPPED", "DELIVERED", "COMPLETED"].includes(tx.orderStatus) && tx.shipment?.trackingNumber && (
                    <TrackOrderButton 
                      transactionId={tx.id} 
                      trackingNumber={tx.shipment.trackingNumber} 
                    />
                  )}
                  {tx.paymentStatus === "PENDING" && tx.paymentUrl && (
                    <a href={tx.paymentUrl} target="_blank" rel="noopener noreferrer" className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium">
                      Bayar Sekarang
                    </a>
                  )}
                  {tx.orderStatus === "COMPLETED" && (
                    <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                      Beli Lagi
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
