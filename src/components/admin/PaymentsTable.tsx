"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PAID": return "bg-green-100 text-green-700";
    case "PENDING": return "bg-yellow-100 text-yellow-700";
    case "CANCELLED": return "bg-red-100 text-red-700";
    case "EXPIRED": return "bg-gray-100 text-gray-700";
    case "PACKING": return "bg-blue-100 text-blue-700";
    case "SHIPPED": return "bg-purple-100 text-purple-700";
    case "DELIVERED": return "bg-emerald-100 text-emerald-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "PAID": return "Perlu Dikemas"; // Already paid, waiting to be packed
    case "PENDING": return "Perlu Dibayar"; // Waiting for payment
    case "CANCELLED": return "Dibatalkan";
    case "EXPIRED": return "Kedaluwarsa";
    case "PACKING": return "Sedang Dikemas"; // Packing
    case "SHIPPED": return "Sedang Dikirim"; // Delivery
    case "DELIVERED": return "Diterima / Selesai"; // Done
    default: return status;
  }
};

interface Transaction {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string | Date;
  user: {
    name: string | null;
    email: string | null;
  };
  _count: {
    items: number;
  };
}

interface PaymentsTableProps {
  initialData: Transaction[];
}

const PaymentsTable = ({ initialData }: PaymentsTableProps) => {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update status");

      toast.success("Transaction status updated!");
      router.refresh(); // Fetch new data
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="">
      <div className="mb-8 px-4 py-3 bg-secondary rounded-md flex justify-between items-center">
        <h1 className="font-semibold">All Transactions</h1>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Status & Action</th>
            </tr>
          </thead>
          <tbody>
            {initialData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  Belum ada transaksi.
                </td>
              </tr>
            ) : (
              initialData.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-mono text-xs">{tx.id.substring(0, 8)}...</td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{tx.user.name || "Guest"}</div>
                    <div className="text-xs text-muted-foreground">{tx.user.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    Rp {tx.totalAmount.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-4">{tx._count.items} qty</td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          disabled={updatingId === tx.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold hover:opacity-80 transition-opacity outline-none ${getStatusColor(tx.status)}`}
                        >
                          {updatingId === tx.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            getStatusText(tx.status)
                          )}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {tx.status === "PENDING" && (
                          <DropdownMenuItem 
                            className="cursor-pointer text-xs"
                            onClick={() => handleStatusUpdate(tx.id, "PAID")}
                          >
                            Setujui Pembayaran (Paid)
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="cursor-pointer text-xs"
                          onClick={() => handleStatusUpdate(tx.id, "PACKING")}
                        >
                          Tandai "Sedang Dikemas" (Packing)
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-xs"
                          onClick={() => handleStatusUpdate(tx.id, "SHIPPED")}
                        >
                          Tandai "Sedang Dikirim" (Shipped)
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-xs focus:text-emerald-600 text-emerald-600"
                          onClick={() => handleStatusUpdate(tx.id, "DELIVERED")}
                        >
                          Tandai "Selesai" (Delivered)
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-xs focus:text-red-600 text-red-600"
                          onClick={() => handleStatusUpdate(tx.id, "CANCELLED")}
                        >
                          Batalkan Pesanan (Cancel)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsTable;
