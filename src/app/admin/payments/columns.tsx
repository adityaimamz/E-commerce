"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export type Payment = {
  id: string;
  amount: number;
  fullName: string;
  userId: string;
  email: string;
  paymentStatus: string;
  orderStatus: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
  },
  {
    accessorKey: "fullName",
    header: "User",
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const status = row.getValue("paymentStatus") as string;

      return (
        <div
          className={cn(
            `px-2 py-0.5 rounded-full w-max text-[10px] font-bold border`,
            status === "PAID" && "bg-green-100 text-green-700 border-green-200",
            status === "PENDING" && "bg-yellow-100 text-yellow-700 border-yellow-200",
            (status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") && "bg-red-100 text-red-700 border-red-200"
          )}
        >
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "orderStatus",
    header: "Order",
    cell: ({ row }) => {
      const status = row.getValue("orderStatus") as string;

      return (
        <div
          className={cn(
            `px-2 py-0.5 rounded-full w-max text-[10px] font-bold border`,
            status === "DELIVERED" && "bg-emerald-100 text-emerald-700 border-emerald-200",
            status === "SHIPPED" && "bg-purple-100 text-purple-700 border-purple-200",
            status === "PROCESSING" && "bg-sky-100 text-sky-700 border-sky-200",
            status === "PENDING" && "bg-gray-100 text-gray-600 border-gray-200"
          )}
        >
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/users/${payment.userId}`}>View customer</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
