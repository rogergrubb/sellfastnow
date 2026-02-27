import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  FileText,
  HelpCircle,
  Mail,
  BookOpen,
  Lock,
  Scale,
  Heart,
  Search,
  MessageSquare,
  Users,
  Building,
} from "lucide-react";

const resourceSections = [
  {
    title: "Buyer Resources",
    icon: Shield,
    items: [
      {
        title: "Buyer Protection",
        description: "Learn how our escrow system and verification keeps you safe when purchasing items.",
        icon: Shield,
        href: "/how-it-works",
      },
      {
        title: "Saved Searches",
        description: "Set up alerts and get notified when new items matching your criteria are posted.",
        icon: Search,
        href: "/saved-searches",
      },
    ],
  },
  {
    title: "Seller Resources",
    icon: BookOpen,
    items: [
      {
        title: "Best Practices",
        description: "Tips for creating great listings, taking photos, and pricing your items to sell faster.",
        icon: BookOpen,
        href: "/how-it-works",
      },
      {
        title: "Pricing Guide",
        description: "Understand our fee structure and how to maximize your earnings.",
        icon: FileText,
        href: "/sell/pricing",
      },
    ],
  },
  {
    title: "Company",
    icon: Building,
    items: [
      {
        title: "About Us",
        description: "SellFast.Now is a modern marketplace built to make local buying and selling simple, safe, and fast.",
        icon: Users,
        href: "#about",
      },
      {
        title: "Contact Us",
        description: "Have questions? Reach out to our support team and we'll get back to you quickly.",
        icon: Mail,
        href: "#contact",
      },
      {
        title: "Blog",
        description: "Stay updated with the latest news, tips, and marketplace insights.",
        icon: MessageSquare,
        href: "#blog",
      },
    ],
  },
  {
    title: "Legal",
    icon: Scale,
    items: [
      {
        title: "Terms of Service",
        description: "Read our terms and conditions for using the SellFast.Now platform.",
        icon: FileText,
        href: "#terms",
      },
      {
        title: "Privacy Policy",
        description: "Learn how we collect, use, and protect your personal information.",
        icon: Lock,
        href: "#privacy",
      },
      {
        title: "Community Guidelines",
        description: "Our guidelines for maintaining a safe and respectful marketplace community.",
        icon: Heart,
        href: "#guidelines",
      },
    ],
  },
];

export default function Resources() {
  const [location] = useLocation();

  return (
    <>
      <Helmet>
        <title>Resources & Help - SellFast.Now</title>
        <meta
          name="description"
          content="Find help and resources for using SellFast.Now. Learn about buyer protection, seller best practices, our terms of service, and more."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Resources & Help</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Everything you need to know about buying and selling on SellFast.Now
            </p>
          </div>
        </section>

        {/* Resource Sections */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="space-y-12">
            {resourceSections.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-3 mb-6">
                  <section.icon className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.items.map((item) => (
                    <Card
                      key={item.title}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <item.icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {item.description}
                        </p>
                        {item.href.startsWith("#") ? (
                          <span className="text-sm text-gray-400">Coming soon</span>
                        ) : (
                          <Link href={item.href}>
                            <Button variant="outline" size="sm">
                              Learn More
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="max-w-7xl mx-auto px-4 py-12">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                About SellFast.Now
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  SellFast.Now is a modern marketplace platform designed to make local buying and selling 
                  simple, safe, and fast. We use AI technology to help sellers create better listings 
                  and price items competitively.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  Our platform includes built-in buyer protection, seller verification, and secure 
                  messaging to ensure safe transactions for everyone.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Whether you're decluttering your home, running an estate sale, or starting a 
                  reselling business, SellFast.Now gives you the tools to succeed.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section id="contact" className="max-w-7xl mx-auto px-4 py-12">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
            <CardContent className="p-8 text-center">
              <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Contact Us
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                Have questions, feedback, or need support? We'd love to hear from you.
              </p>
              <a
                href="mailto:support@sellfast.now"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                support@sellfast.now
              </a>
            </CardContent>
          </Card>
        </section>

        {/* Terms & Privacy Placeholders */}
        <section id="terms" className="max-w-7xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Terms of Service
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  By using SellFast.Now, you agree to our terms of service. Key points include:
                </p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                  <li>You must be 18 years or older to use this platform</li>
                  <li>All listings must be accurate and not misleading</li>
                  <li>Prohibited items include illegal goods, weapons, and stolen property</li>
                  <li>Users are responsible for their own transactions</li>
                  <li>We reserve the right to remove any listing or user for violations</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300 mt-4">
                  Full terms of service document coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="privacy" className="max-w-7xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Privacy Policy
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We take your privacy seriously. Here's how we handle your data:
                </p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                  <li>We collect only information necessary to provide our services</li>
                  <li>Your data is never sold to third parties</li>
                  <li>Location data is used only for search functionality</li>
                  <li>Messages between users are encrypted in transit</li>
                  <li>You can request deletion of your account and data at any time</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300 mt-4">
                  Full privacy policy document coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="guidelines" className="max-w-7xl mx-auto px-4 pb-16">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Community Guidelines
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Help us maintain a safe and respectful community:
                </p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Be honest in all your listings and communications</li>
                  <li>Treat other users with respect and courtesy</li>
                  <li>Report suspicious activity or scam attempts</li>
                  <li>Meet in safe, public locations for exchanges</li>
                  <li>Leave honest reviews to help other users</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
