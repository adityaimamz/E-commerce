"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Package, Truck, CheckCircle2, Clock } from "lucide-react";

interface Manifest {
  manifest_date: string;
  manifest_time: string;
  manifest_description: string;
  city_name: string;
}

interface TrackOrderButtonProps {
  transactionId: string;
  trackingNumber?: string | null;
}

export default function TrackOrderButton({ transactionId, trackingNumber }: TrackOrderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async () => {
    if (data) return; // Don't refetch if already have data
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shipping/track?transactionId=${transactionId}`);
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal melacak pesanan");
      }
      
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          onClick={fetchTracking}
          className="border border-black text-black px-6 py-2 rounded-md hover:bg-black hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Truck className="w-4 h-4" />
          Lacak Pesanan
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detail Pengiriman
          </DialogTitle>
          {trackingNumber && (
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Resi: {trackingNumber}
            </p>
          )}
        </DialogHeader>

        <div className="mt-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
              Memuat data pelacakan...
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{error}</p>
              <button 
                onClick={fetchTracking}
                className="mt-4 text-xs font-semibold underline"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {data && data.data && (
            <div className="relative flex flex-col gap-8 ml-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-200">
              {data.data.manifest?.map((item: Manifest, idx: number) => {
                const isLatest = idx === 0;
                return (
                  <div key={idx} className="relative pl-8">
                    {/* Progress Dot */}
                    <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-1 ${isLatest ? 'bg-black ring-black' : 'bg-gray-300 ring-gray-300'}`} />
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className={`text-sm font-semibold ${isLatest ? 'text-black' : 'text-gray-600'}`}>
                          {item.manifest_description}
                        </p>
                        {isLatest && <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Terbaru</span>}
                      </div>
                      <p className="text-xs text-gray-500">{item.city_name}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{item.manifest_date} {item.manifest_time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {!data.data.manifest?.length && (
                <div className="text-center py-4 text-sm text-gray-500">
                  Data manifest belum tersedia.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
