import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react";

export default function Admin() {
  const { isSignedIn } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/seed-listings', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || 'Failed to seed database');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be signed in to access the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Seed Sample Listings
          </CardTitle>
          <CardDescription>
            Generate 75 realistic sample listings across all categories to populate the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What will be created:</h3>
            <ul className="space-y-1 text-sm">
              <li>• <strong>Electronics:</strong> 15 listings (iPhones, laptops, cameras, etc.)</li>
              <li>• <strong>Furniture:</strong> 15 listings (sofas, tables, chairs, etc.)</li>
              <li>• <strong>Clothing:</strong> 15 listings (jackets, shoes, accessories, etc.)</li>
              <li>• <strong>Vehicles:</strong> 15 listings (cars, bikes, motorcycles, etc.)</li>
              <li>• <strong>Services:</strong> 15 listings (photography, cleaning, tutoring, etc.)</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              All listings will be created under your account with realistic descriptions, 
              pricing, and images from Unsplash.
            </p>
          </div>

          <Button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            size="lg"
            className="w-full"
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Listings...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Seed Database (75 Listings)
              </>
            )}
          </Button>

          {result && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                <p className="font-semibold mb-2">{result.message}</p>
                <div className="text-sm space-y-1">
                  <p><strong>Total Created:</strong> {result.totalCreated} listings</p>
                  {result.breakdown && (
                    <div className="mt-2">
                      <p className="font-semibold">Breakdown by category:</p>
                      <ul className="ml-4 mt-1">
                        {Object.entries(result.breakdown).map(([category, count]) => (
                          <li key={category}>
                            {category}: {count as number} listings
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                View Home Page
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1"
              >
                View My Listings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>⚠️ This will create 75 new listings in the database.</p>
          <p>⚠️ All listings will be associated with your user account.</p>
          <p>⚠️ You can delete individual listings from your dashboard if needed.</p>
          <p>💡 This is useful for testing and demonstrating the marketplace functionality.</p>
        </CardContent>
      </Card>
    </div>
  );
}

