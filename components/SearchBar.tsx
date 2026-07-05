"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  size?: "sm" | "lg";
}

export default function SearchBar({
  placeholder = "브랜드명을 검색하세요",
  defaultValue = "",
  size = "sm",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/brand?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const isLarge = size === "lg";

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search
        className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${isLarge ? "size-5" : "size-4"}`}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white text-gray-900 border border-gray-200 rounded-xl pl-11 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent placeholder:text-gray-400 ${
          isLarge ? "py-4 text-base" : "py-2.5 text-sm"
        }`}
      />
      <button
        type="submit"
        className={`absolute right-2 top-1/2 -translate-y-1/2 bg-green-800 text-white rounded-lg font-medium hover:bg-green-700 transition-colors ${
          isLarge ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs"
        }`}
      >
        검색
      </button>
    </form>
  );
}
