import { prisma } from "@/lib/prisma";
import CategoriesTable from "@/components/admin/CategoriesTable";

const CategoriesPage = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <div className="">
      <CategoriesTable initialData={categories} />
    </div>
  );
};

export default CategoriesPage;
