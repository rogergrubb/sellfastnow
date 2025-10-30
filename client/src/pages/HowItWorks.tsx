import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Zap, DollarSign, Clock, Camera, FileText, Package,
  CheckCircle, ArrowRight, Wand2, Shield, TrendingUp
} from "lucide-react";

export default function HowItWorks() {
  return (
    <>
      <SEO
        title="How It Works - AI-Powered Marketplace"
        description="Learn how SellFast.Now uses AI to help you sell faster. Post bulk listings in minutes, get AI-generated descriptions, and reach local buyers easily. Sell smarter, not harder."
        keywords="how it works, AI marketplace, bulk listings, sell faster, AI descriptions, local selling"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Sell on SellFast.Now",
          "description": "Step-by-step guide to selling items on SellFast.Now marketplace",
          "step": [
            {
              "@type": "HowToStep",
              "position": 1,
              "name": "Take Photos",
              "text": "Snap photos of items you want to sell"
            },
            {
              "@type": "HowToStep",
              "position": 2,
              "name": "AI Generation",
              "text": "Our AI creates titles, descriptions, and valuations"
            },
            {
              "@type": "HowToStep",
              "position": 3,
              "name": "Review & Post",
              "text": "Review AI suggestions and publish your listings"
            },
            {
              "@type": "HowToStep",
              "position": 4,
              "name": "Connect with Buyers",
              "text": "Receive offers and messages from local buyers"
            }
          ]
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            <Sparkles className="h-3 w-3 mr-1" />AI-Powered Marketplace
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Sell Smarter, Not Harder</h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Our AI does the heavy lifting so you can sell in bulk, save time, and make more money
          </p>
          <Link href="/post">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Start Selling Now<ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: Clock, label: "Time Saved", value: "90%", color: "text-blue-600" },
            { icon: DollarSign, label: "Higher Prices", value: "25%", color: "text-green-600" },
            { icon: Zap, label: "Faster Sales", value: "3x", color: "text-yellow-600" },
            { icon: Package, label: "Bulk Listings", value: "100+", color: "text-purple-600" },
          ].map((stat, i) => (
            <Card key={i} className="bg-white shadow-lg">
              <CardContent className="p-6 text-center">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How AI Works */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4"><Wand2 className="h-3 w-3 mr-1" />AI Magic</Badge>
          <h2 className="text-4xl font-bold mb-4">How Our AI Saves You Hours</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Just snap a photo. Our AI handles everything else.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Camera, title: "1. Take a Photo", desc: "Snap a quick photo with your phone. No staging required.", time: "10 sec" },
            { icon: Sparkles, title: "2. AI Analyzes", desc: "AI identifies the item, researches prices, writes descriptions, suggests optimal pricing.", time: "5 sec" },
            { icon: FileText, title: "3. Review & Post", desc: "Review the AI-generated listing, make tweaks, and publish.", time: "30 sec" },
          ].map((step, i) => (
            <Card key={i} className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{step.time}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent><p className="text-muted-foreground">{step.desc}</p></CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="p-8">
              <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold mb-2">Total Time: 45 Seconds</h3>
              <p className="text-lg text-muted-foreground mb-2">Traditional listing: 15-20 minutes. With SellFast.Now: Less than 1 minute.</p>
              <p className="text-3xl font-bold text-green-600">Save 95% of your time!</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bulk Selling */}
      <section className="bg-gradient-to-r from-purple-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4"><Package className="h-3 w-3 mr-1" />Bulk Selling Power</Badge>
            <h2 className="text-4xl font-bold mb-4">Sell 100 Items in 1 Hour</h2>
            <p className="text-xl text-muted-foreground">Moving? Downsizing? Estate sale? List everything at once.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-red-50 border-red-200">
              <CardHeader><CardTitle className="text-red-600">The Old Way (Painful)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {["Take photos: 5 min/item", "Write descriptions: 10 min/item", "Research prices: 5 min/item", "Post everywhere: 5 min/item"].map((t, i) => (
                  <div key={i} className="flex items-center gap-2"><Clock className="h-4 w-4 text-red-500" /><span>{t}</span></div>
                ))}
                <div className="pt-4 border-t border-red-200">
                  <p className="font-bold text-lg text-red-600">Total: 25 min × 100 items = 41 HOURS</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardHeader><CardTitle className="text-green-600">The SellFast.Now Way (Easy)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {["Take 100 photos: 10 minutes", "AI generates all listings: 5 minutes", "Review & post all: 30 minutes", "Done!"].map((t, i) => (
                  <div key={i} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>{t}</span></div>
                ))}
                <div className="pt-4 border-t border-green-200">
                  <p className="font-bold text-lg text-green-600">Total: 45 MINUTES</p>
                  <p className="text-sm text-muted-foreground mt-1">Save 40+ hours!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4"><DollarSign className="h-3 w-3 mr-1" />Transparent Pricing</Badge>
          <h2 className="text-4xl font-bold mb-4">Simple, Fair Pricing</h2>
          <p className="text-xl text-muted-foreground">We only make money when you make money</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader><CardTitle>Listing</CardTitle></CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 mb-2">FREE</div>
              <p className="text-muted-foreground">List unlimited items at no cost</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-500">
            <CardHeader><CardTitle>Transaction Fee</CardTitle></CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 mb-2">5%</div>
              <p className="text-muted-foreground">Only when your item sells</p>
              <ul className="mt-4 space-y-2 text-sm">
                {["Secure payments", "Buyer protection", "Seller protection", "Dispute resolution"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-500" />{f}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>AI Credits</CardTitle></CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600 mb-2">$0.10</div>
              <p className="text-muted-foreground">Per AI-generated listing</p>
              <p className="text-sm text-muted-foreground mt-2">First 10 listings FREE!</p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">Example: Sell a $100 item</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="font-medium">Sale Price:</span> $100.00</div>
                <div><span className="font-medium">Transaction Fee (5%):</span> -$5.00</div>
                <div className="font-bold text-green-600"><span>You Keep:</span> $95.00</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Why SellFast.Now?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Safe & Secure", desc: "Escrow payments protect both buyers and sellers" },
              { icon: TrendingUp, title: "Sell Faster", desc: "AI-optimized listings sell 3x faster than traditional platforms" },
              { icon: Sparkles, title: "AI-Powered", desc: "Save hours with automated listing creation and pricing" },
            ].map((item, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6">
                  <item.icon className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Sell Smarter?</h2>
        <p className="text-xl text-muted-foreground mb-8">Join thousands of sellers saving time and making more money</p>
        <Link href="/post">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Start Selling Now<ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>
    </div>
    </>
  );
}
