import { Quote } from "lucide-react";

export default function RealtorTestimonial() {
  return (
    <div className="bg-white dark:bg-gray-900 py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 sm:p-12 border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
          <Quote className="absolute top-6 left-6 h-12 w-12 text-blue-300 dark:text-blue-700 opacity-50" />
          
          <div className="relative">
            <p className="text-xl sm:text-2xl text-gray-800 dark:text-gray-200 leading-relaxed mb-6 italic">
              "I listed <span className="font-bold text-green-600 dark:text-green-400">1,100 items</span> from an estate liquidation using just my cell phone. 
              I walked through the house and garage taking photos, uploaded them all at once, and AI generated titles, descriptions, 
              valuations, and meta tags. It saved me <span className="font-bold text-green-600 dark:text-green-400">days of work</span> and did a better job with meta-tagging each item for better search results.
            </p>
            <p className="text-xl sm:text-2xl text-gray-800 dark:text-gray-200 leading-relaxed mb-6 italic">
              Everything is branded under my name, and I got auto-generated links I could share on Facebook, Instagram, TikTok, X, 
              Facebook Marketplace, and Craigslist. One link gives access to all my items.
            </p>
            <p className="text-xl sm:text-2xl text-gray-800 dark:text-gray-200 leading-relaxed mb-8 italic font-semibold">
              It's <span className="text-green-600 dark:text-green-400">stupid cheap</span> for what you get."
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                R
              </div>
              <div>
                <div className="font-bold text-lg text-gray-900 dark:text-white">
                  Real Estate Professional
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Liquidated 1,100+ items successfully
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

