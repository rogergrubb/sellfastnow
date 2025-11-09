import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Camera, Brain, CheckCircle, Share2 } from "lucide-react";
import SectionNav from "./SectionNav";

export default function EstateHero() {
  const [, setLocation] = useLocation();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="how-it-works" className="relative bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 scroll-mt-20">
      <SectionNav currentSection="how-it-works" />
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            List Over 1,000 Items in Less Than One Hour. Not Days.
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-4 max-w-4xl mx-auto">
            Use AI powered item descriptions, details, retail and used values.
          </p>
          <p className="text-lg sm:text-xl font-semibold text-green-600 dark:text-green-400 mb-8 max-w-3xl mx-auto uppercase tracking-wide">
            Automatically Meta Tagged for Superior Search Optimization.
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
              Start Listing - First 5 Free →
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
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
            Real example: <span className="text-green-600 dark:text-green-400">1,100 items</span> listed in less than one hour by a realtor
          </p>
        </div>

        {/* Testimonials Section */}
        <div className="mt-16 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            What Professionals Are Saying
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-10 text-lg">
            Real stories from <span className="font-semibold text-gray-900 dark:text-white">Residential & Commercial Liquidators</span>, <span className="font-semibold text-gray-900 dark:text-white">Real Estate Professionals</span>, and bulk sellers
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Estate Sale Professional */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-green-200 dark:border-green-800">
              <div className="text-5xl text-green-600 dark:text-green-400 leading-none mb-4">"</div>
              <p className="text-base text-gray-700 dark:text-gray-300 italic mb-6">
                My old estate sale website only let me upload a picture — no titles, no descriptions, no meta tags. Just one simple photo. When I saw what SellFast.Now offers, my mind was blown... and for <span className="font-bold text-green-600 dark:text-green-400">less than half the cost!</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Sarah M.</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Estate Sale Professional, 15+ years</div>
                </div>
              </div>
            </div>

            {/* Realtor */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-blue-200 dark:border-blue-800">
              <div className="text-5xl text-blue-600 dark:text-blue-400 leading-none mb-4">"</div>
              <p className="text-base text-gray-700 dark:text-gray-300 italic mb-6">
                I used to spend <span className="font-bold text-red-600 dark:text-red-400">3 days</span> manually listing estate contents. With SellFast.Now, I listed <span className="font-bold text-green-600 dark:text-green-400">1,100 items in under an hour.</span> This has completely changed my business.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Michael R.</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Real Estate Broker, 20+ years</div>
                </div>
              </div>
            </div>

            {/* Commercial Liquidator */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-purple-200 dark:border-purple-800">
              <div className="text-5xl text-purple-600 dark:text-purple-400 leading-none mb-4">"</div>
              <p className="text-base text-gray-700 dark:text-gray-300 italic mb-6">
                Other platforms charge me <span className="font-bold text-red-600 dark:text-red-400">13% fees.</span> SellFast.Now is <span className="font-bold text-green-600 dark:text-green-400">FREE up to $100, then just 1%</span> AND gives me AI-powered descriptions. I'm <span className="font-bold text-green-600 dark:text-green-400">saving thousands</span> per estate.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  J
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Jennifer L.</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Commercial Liquidator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

