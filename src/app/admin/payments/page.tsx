import { prisma } from "@/lib/prisma";
import PaymentsTable from "@/components/admin/PaymentsTable";

const PaymentsPage = async () => {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      _count: {
        select: { items: true }
      }
    }
  });

  return (
    <div className="">
      <PaymentsTable initialData={transactions} />
    </div>
  );
};

export default PaymentsPage;
