import { Button } from "@/components/ui/button";
import { Smartphone, Sofa, Shirt, Car, Wrench, Grid3x3 } from "lucide-react";

const categories = [
  { id: "", label: "All Categories", icon: Grid3x3 },
  { id: "electronics", label: "Electronics", icon: Smartphone },
  { id: "furniture", label: "Furniture", icon: Sofa },
  { id: "clothing", label: "Clothing", icon: Shirt },
  { id: "vehicles", label: "Vehicles", icon: Car },
  { id: "services", label: "Services", icon: Wrench },
];

interface CategoryFiltersProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export default function CategoryFilters({ selectedCategory, onCategorySelect }: CategoryFiltersProps) {

  return (
    <div className="sticky top-16 z-40 bg-background border-b py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => onCategorySelect(category.id)}
                data-testid={`button-filter-${category.id || 'all'}`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
