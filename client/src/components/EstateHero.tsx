import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Camera, Brain, CheckCircle, Share2 } from "lucide-react";

export default function EstateHero() {
  const [, setLocation] = useLocation();

  return (
    <div className="relative bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            List 1,100 Items in Hours, Not Weeks
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-4 max-w-4xl mx-auto">
            AI-powered estate liquidation for realtors, liquidators, and bulk sellers.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Upload photos from your phone, AI generates everything, share one link everywhere.
          </p>

          {/* Key Features Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium">Unlimited photo uploads</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">AI titles, descriptions, valuations</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200 dark:border-purple-800">
              <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium">Auto-generated meta tags (SEO)</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-200 dark:border-orange-800">
              <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium">One link for all platforms</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 text-lg font-semibold shadow-xl"
              onClick={() => setLocation('/post-ad')}
            >
              Start Your Estate Sale - First 5 Free →
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold border-2"
              onClick={() => {
                // Scroll to how it works section
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works
            </Button>
          </div>
        </div>

        {/* 4-Step Process */}
        <div id="how-it-works" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Camera className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">1. Photo Items</div>
            <p className="text-gray-600 dark:text-gray-400">
              Walk through with phone. Take photos of everything. No limits.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">2. AI Writes</div>
            <p className="text-gray-600 dark:text-gray-400">
              Titles, descriptions, prices, SEO tags - all automatic.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">3. Review & Save</div>
            <p className="text-gray-600 dark:text-gray-400">
              Brand under your name. Edit if needed. Save drafts.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
              <Share2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">4. Share Link</div>
            <p className="text-gray-600 dark:text-gray-400">
              Post to all social media. One link for everything.
            </p>
          </div>
        </div>

        {/* Real Example Callout */}
        <div className="mt-12 text-center">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Real example: <span className="text-green-600 dark:text-green-400">1,100 items</span> listed in hours by a realtor
          </p>
        </div>
      </div>
    </div>
  );
}

