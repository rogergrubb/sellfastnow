import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, Mail, Phone, Globe, MapPin, Palette, 
  CheckCircle, ArrowRight, ArrowLeft, Upload, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface OnboardingData {
  businessName: string;
  businessType: string;
  businessDescription: string;
  businessEmail: string;
  businessPhone: string;
  businessWebsite: string;
  customDomain: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor: string;
  secondaryColor: string;
}

export default function PartnerOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    businessName: "",
    businessType: "liquidation",
    businessDescription: "",
    businessEmail: "",
    businessPhone: "",
    businessWebsite: "",
    customDomain: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
  });

  // Check if user is logged in
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Check if user already has a partner account
  const { data: existingPartner } = useQuery({
    queryKey: ["/api/partners/profile"],
    enabled: !!user,
    retry: false,
  });

  const onboardMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const response = await apiRequest("POST", "/api/partners/onboard", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your partner account has been created. Redirecting to dashboard...",
      });
      setTimeout(() => navigate("/partner/dashboard"), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateField = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate custom domain from business name
    if (field === "businessName" && !formData.customDomain) {
      const domain = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, customDomain: domain }));
    }
  };

  const handleSubmit = () => {
    onboardMutation.mutate(formData);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.businessName && formData.businessType && formData.businessEmail;
      case 2:
        return formData.city && formData.state;
      case 3:
        return formData.customDomain;
      default:
        return true;
    }
  };

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in to create a business partner account.
          </p>
          <Button onClick={() => navigate("/sign-in")} className="w-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Redirect if already has partner account
  if (existingPartner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Already a Partner</h2>
          <p className="text-gray-600 mb-6">
            You already have a business partner account. Visit your dashboard to manage your storefront.
          </p>
          <Button onClick={() => navigate("/partner/dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const businessTypes = [
    { value: "liquidation", label: "Liquidation Company" },
    { value: "realtor", label: "Real Estate / Realtor" },
    { value: "mover", label: "Moving Company" },
    { value: "estate_sale", label: "Estate Sale Company" },
    { value: "wholesaler", label: "Wholesaler" },
    { value: "retailer", label: "Retailer" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Business Partner Program</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Partner Account
          </h1>
          <p className="text-xl text-gray-600">
            Join 156+ businesses selling with their own branded storefront
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s < step
                      ? "bg-green-600 text-white"
                      : s === step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {s < step ? <CheckCircle className="w-6 h-6" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-16 h-1 ${
                      s < step ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 mt-4">
            <span className={`text-sm ${step === 1 ? "font-semibold text-blue-600" : "text-gray-500"}`}>
              Business Info
            </span>
            <span className={`text-sm ${step === 2 ? "font-semibold text-blue-600" : "text-gray-500"}`}>
              Location
            </span>
            <span className={`text-sm ${step === 3 ? "font-semibold text-blue-600" : "text-gray-500"}`}>
              Branding
            </span>
            <span className={`text-sm ${step === 4 ? "font-semibold text-blue-600" : "text-gray-500"}`}>
              Review
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Step 1: Business Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => updateField("businessName", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Liquidators Inc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => updateField("businessType", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {businessTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description *
                </label>
                <textarea
                  value={formData.businessDescription}
                  onChange={(e) => updateField("businessDescription", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell customers about your business, specialties, and what makes you unique..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => updateField("businessEmail", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@business.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) => updateField("businessPhone", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={formData.businessWebsite}
                    onChange={(e) => updateField("businessWebsite", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.yourbusiness.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Location</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => updateField("streetAddress", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Business St"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seattle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="WA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="98101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Branding */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Branding & Customization</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">sellfast.now/partner/</span>
                  <input
                    type="text"
                    value={formData.customDomain}
                    onChange={(e) => updateField("customDomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your-business-name"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This will be your public storefront URL
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => updateField("primaryColor", e.target.value)}
                      className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => updateField("primaryColor", e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => updateField("secondaryColor", e.target.value)}
                      className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => updateField("secondaryColor", e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can upload your logo and banner image after creating your account in the dashboard settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Information</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Business Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{formData.businessName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Type:</dt>
                      <dd className="font-medium">{businessTypes.find(t => t.value === formData.businessType)?.label}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Email:</dt>
                      <dd className="font-medium">{formData.businessEmail}</dd>
                    </div>
                    {formData.businessPhone && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Phone:</dt>
                        <dd className="font-medium">{formData.businessPhone}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                  <p className="text-sm">
                    {formData.streetAddress && `${formData.streetAddress}, `}
                    {formData.city}, {formData.state} {formData.postalCode}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Storefront</h3>
                  <p className="text-sm">
                    <strong>URL:</strong> sellfast.now/partner/{formData.customDomain}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded" style={{ backgroundColor: formData.primaryColor }}></div>
                      <span className="text-xs text-gray-600">Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded" style={{ backgroundColor: formData.secondaryColor }}></div>
                      <span className="text-xs text-gray-600">Secondary</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">What Happens Next?</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Your account will be created and pending approval</li>
                    <li>• Our team will review your application (usually within 24 hours)</li>
                    <li>• You'll receive an email when approved</li>
                    <li>• Then you can start adding listings and customizing your storefront</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid()}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={onboardMutation.isPending}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {onboardMutation.isPending ? "Creating Account..." : "Submit Application"}
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8 text-gray-600">
          <p>Need help? Contact us at <a href="mailto:partners@sellfast.now" className="text-blue-600 hover:underline">partners@sellfast.now</a></p>
        </div>
      </div>
    </div>
  );
}

