import { Link2, Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";
import { FaTiktok } from "react-icons/fa";

export default function SocialMediaDemo() {
  return (
    <div className="bg-white dark:bg-gray-900 py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Link2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Share Your Estate Sale Everywhere
            </h2>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Get one shareable link that works on all platforms
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 border-2 border-purple-200 dark:border-purple-800 shadow-xl">
          {/* Example Link */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <code className="text-sm sm:text-base text-purple-600 dark:text-purple-400 font-mono break-all">
                sellfast.now/estate/your-name-123
              </code>
            </div>
          </div>

          {/* Platform Icons */}
          <div className="mb-8">
            <p className="text-center text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Post this link to:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Facebook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-pink-200 dark:border-pink-800 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                  <Instagram className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Instagram</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Twitter className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">X (Twitter)</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <FaTiktok className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">TikTok</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Facebook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Marketplace</span>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Craigslist</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-white/80 dark:bg-gray-900/80 rounded-lg">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">One Link = All Items</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Buyers can browse your entire estate sale from any platform. No need to post items individually.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/80 dark:bg-gray-900/80 rounded-lg">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Branded Under Your Name</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All listings show your name or business. Build your reputation as a professional liquidator.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/80 dark:bg-gray-900/80 rounded-lg">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Maximum Reach</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Post to all platforms in seconds. Reach buyers wherever they browse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

