import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  Sofa,
  Car,
  Shirt,
  Wrench,
  Dumbbell,
  Baby,
  Book,
  Gamepad2,
  Home,
  Leaf,
  Music,
  Camera,
  Watch,
  Gift,
  MoreHorizontal,
} from "lucide-react";

const categories = [
  { name: "Electronics", icon: Smartphone, slug: "electronics", color: "bg-blue-500" },
  { name: "Furniture", icon: Sofa, slug: "furniture", color: "bg-amber-600" },
  { name: "Vehicles", icon: Car, slug: "vehicles", color: "bg-red-500" },
  { name: "Clothing", icon: Shirt, slug: "clothing", color: "bg-pink-500" },
  { name: "Services", icon: Wrench, slug: "services", color: "bg-gray-600" },
  { name: "Sports & Outdoors", icon: Dumbbell, slug: "sports", color: "bg-green-600" },
  { name: "Baby & Kids", icon: Baby, slug: "baby-kids", color: "bg-purple-500" },
  { name: "Books & Media", icon: Book, slug: "books", color: "bg-indigo-500" },
  { name: "Gaming", icon: Gamepad2, slug: "gaming", color: "bg-violet-600" },
  { name: "Home & Garden", icon: Home, slug: "home-garden", color: "bg-teal-500" },
  { name: "Garden & Plants", icon: Leaf, slug: "garden", color: "bg-lime-600" },
  { name: "Musical Instruments", icon: Music, slug: "music", color: "bg-rose-500" },
  { name: "Cameras & Photo", icon: Camera, slug: "cameras", color: "bg-slate-600" },
  { name: "Watches & Jewelry", icon: Watch, slug: "jewelry", color: "bg-yellow-600" },
  { name: "Free Items", icon: Gift, slug: "free", color: "bg-emerald-500" },
  { name: "Other", icon: MoreHorizontal, slug: "other", color: "bg-gray-500" },
];

export default function Categories() {
  return (
    <>
      <Helmet>
        <title>Browse Categories - SellFast.Now</title>
        <meta
          name="description"
          content="Browse all categories on SellFast.Now marketplace. Find electronics, furniture, vehicles, clothing, and more near you."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Categories</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Find exactly what you're looking for. Browse by category to discover great deals near you.
            </p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link key={category.slug} href={`/search?category=${category.slug}`}>
                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Can't find what you're looking for?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try our search feature to find specific items near you.
              </p>
              <Link href="/search">
                <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Search All Listings
                </button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
