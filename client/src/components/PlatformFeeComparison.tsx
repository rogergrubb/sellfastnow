import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DollarSign, TrendingDown, CheckCircle2 } from "lucide-react";

export default function PlatformFeeComparison() {
  const [salePrice, setSalePrice] = useState<string>("100");
  const [totalSales, setTotalSales] = useState<string>("10");
  const [comparison, setComparison] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateFees = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch("/api/analytics/fee-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salePrice: parseFloat(salePrice),
          totalSales: parseInt(totalSales),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComparison(data);
      }
    } catch (error) {
      console.error("Error calculating fees:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
          <DollarSign className="h-5 w-5" />
          Platform Fee Comparison
        </CardTitle>
        <CardDescription className="text-green-700 dark:text-green-300">
          See how much you save compared to other platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="salePrice">Average Sale Price</Label>
            <Input
              id="salePrice"
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="100"
              className="bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <Label htmlFor="totalSales">Number of Sales</Label>
            <Input
              id="totalSales"
              type="number"
              value={totalSales}
              onChange={(e) => setTotalSales(e.target.value)}
              placeholder="10"
              className="bg-white dark:bg-gray-900"
            />
          </div>
        </div>

        <Button 
          onClick={calculateFees} 
          disabled={isCalculating}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isCalculating ? "Calculating..." : "Calculate Savings"}
        </Button>

        {/* Results */}
        {comparison && (
          <div className="space-y-4 mt-6">
            {/* Comparison Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium">Platform</th>
                    <th className="text-right py-3 px-4 text-sm font-medium">Total Fees</th>
                    <th className="text-right py-3 px-4 text-sm font-medium">You Keep</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-50 dark:bg-green-950 border-t-2 border-green-500">
                    <td className="py-3 px-4 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      SellFast.Now
                      <Badge className="bg-green-600">Best Value</Badge>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-green-600">
                      ${comparison.sellFastNow.totalFees.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-green-600">
                      ${comparison.sellFastNow.netRevenue.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3 px-4">eBay</td>
                    <td className="text-right py-3 px-4 text-red-600">
                      ${comparison.ebay.totalFees.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${comparison.ebay.netRevenue.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3 px-4">Etsy</td>
                    <td className="text-right py-3 px-4 text-red-600">
                      ${comparison.etsy.totalFees.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${comparison.etsy.netRevenue.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3 px-4">EstateSales.org</td>
                    <td className="text-right py-3 px-4 text-red-600">
                      ${comparison.estateSales.totalFees.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${comparison.estateSales.netRevenue.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Savings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">vs eBay</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${comparison.totalSavings.vsEbay.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">saved</p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">vs Etsy</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${comparison.totalSavings.vsEtsy.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">saved</p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">vs EstateSales.org</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${comparison.totalSavings.vsEstateSales.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">saved</p>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Fee Breakdown</h4>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p>• <strong>SellFast.Now:</strong> FREE up to $100, then 1% listing fee + 5% transaction fee (when using Stripe)</p>
                <p>• <strong>eBay:</strong> 13.25% final value fee + $0.35 per listing</p>
                <p>• <strong>Etsy:</strong> 6.5% transaction + 3% payment + $0.20 per listing</p>
                <p>• <strong>EstateSales.org:</strong> 15% commission</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

