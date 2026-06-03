"use client";

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
      className={`text-lg leading-none transition-colors ${
        favorite ? "text-amber-400" : "text-neutral-300 hover:text-amber-300"
      }`}
      title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {favorite ? "★" : "☆"}
    </button>
  );
}
