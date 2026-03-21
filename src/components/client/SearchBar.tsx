"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

const SearchBar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    
    // If searching from anywhere else, go to products page
    if (pathname !== "/" && !pathname.startsWith("/products")) {
       router.push(`/products?${params.toString()}`);
    } else {
       router.replace(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className='hidden sm:flex items-center gap-2 rounded-md ring-1 ring-gray-200 px-2 py-1 shadow-md'>
      <Search className="w-4 h-4 text-gray-500"/>
      <input 
        id="search" 
        placeholder="Search..." 
        className="text-sm outline-0 bg-transparent w-full"
        defaultValue={searchParams.get("search") || ""}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;