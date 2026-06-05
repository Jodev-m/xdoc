"use client";

import { Star } from "lucide-react";

interface FavoriteButtonProps {
  favorite: boolean;
  onToggle: () => void;
}

export function FavoriteButton({ favorite, onToggle }: FavoriteButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`transition-colors ${
        favorite ? "text-amber-400" : "text-neutral-300 hover:text-amber-300"
      }`}
      title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Star size={18} fill={favorite ? "currentColor" : "none"} />
    </button>
  );
}
