"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddCategory from "@/components/admin/AddCategory";
import EditCategory from "@/components/admin/EditCategory";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string | Date;
  _count: {
    products: number;
  };
}

interface CategoriesTableProps {
  initialData: Category[];
}

const CategoriesTable = ({ initialData }: CategoriesTableProps) => {
  const router = useRouter();
  
  // State for Edit Sheet
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<Category | null>(null);

  // State for Delete Alerts
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditClick = (category: Category) => {
    setSelectedCategoryToEdit(category);
    setIsEditSheetOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to delete category");
      }

      toast.success("Category deleted successfully!");
      router.refresh(); // Refresh the page to get updated data
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="">
      <div className="mb-8 px-4 py-3 bg-secondary rounded-md flex justify-between items-center">
        <h1 className="font-semibold">All Categories</h1>
        <Sheet>
          <SheetTrigger asChild>
            <button className="bg-black text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </SheetTrigger>
          <AddCategory />
        </Sheet>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Products Count</th>
              <th className="py-3 px-4">Added</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada kategori.
                </td>
              </tr>
            ) : (
              initialData.map((category) => (
                <tr key={category.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{category.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{category.slug}</td>
                  <td className="py-3 px-4">{category._count.products} products</td>
                  <td className="py-3 px-4">
                    {new Date(category.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 rounded-md outline-none">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleEditClick(category)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
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

      {/* Edit Category Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        {selectedCategoryToEdit && (
          <EditCategory 
            category={selectedCategoryToEdit} 
            onSuccess={() => setIsEditSheetOpen(false)} 
          />
        )}
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you thoroughly sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              <span className="font-semibold text-black"> {categoryToDelete?.name}</span>.
              If this category has products associated with it, you might not be able to delete it, or those products might be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesTable;
