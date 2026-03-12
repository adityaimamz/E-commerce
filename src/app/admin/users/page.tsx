import { prisma } from "@/lib/prisma";
import UsersTable from "@/components/admin/UsersTable";

const UsersPage = async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="">
      <UsersTable initialData={users} />
    </div>
  );
};

export default UsersPage;
