import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Package, PackagePlus, Settings2 } from "lucide-react";

interface DetectedProduct {
  imageIndices: number[];
  imageUrls: string[];
  title: string;
  description: string;
  category: string;
  condition: string;
  confidence?: number;
}

interface GroupingInfo {
  scenario: "same_product" | "multiple_products";
  message?: string;
  totalGroups: number;
}

interface MultiItemGroupingModalProps {
  open: boolean;
  products: DetectedProduct[];
  groupingInfo: GroupingInfo;
  onCreateSeparate: () => void;
  onCreateBundle: () => void;
  onManualRegroup: () => void;
}

export function MultiItemGroupingModal({
  open,
  products,
  groupingInfo,
  onCreateSeparate,
  onCreateBundle,
  onManualRegroup,
}: MultiItemGroupingModalProps) {
  const isSameProduct = groupingInfo.scenario === "same_product";
  const productCount = products.length;

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-grouping-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isSameProduct ? "Single Item Detected" : `${productCount} Different Items Detected`}
          </DialogTitle>
          <DialogDescription>
            {isSameProduct
              ? "All photos show the same item from different angles"
              : `AI detected ${productCount} different products in your photos`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {products.map((product, idx) => (
            <Card key={idx} className="p-4" data-testid={`card-product-${idx}`}>
              <div className="flex gap-4">
                <div className="flex gap-2">
                  {product.imageUrls.slice(0, 3).map((url, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={url}
                      alt={`Product ${idx + 1} - Image ${imgIdx + 1}`}
                      className="w-20 h-20 object-cover rounded"
                      data-testid={`img-product-${idx}-${imgIdx}`}
                    />
                  ))}
                  {product.imageUrls.length > 3 && (
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                      +{product.imageUrls.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium" data-testid={`text-product-title-${idx}`}>
                        {isSameProduct ? product.title : `Product ${idx + 1}: ${product.title}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.imageUrls.length} {product.imageUrls.length === 1 ? "photo" : "photos"}
                        {!isSameProduct && ` • ${product.category}`}
                      </p>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-confidence-${idx}`}>
                      {product.confidence}% confident
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {!isSameProduct && productCount > 1 && (
            <>
              <Button
                onClick={onCreateSeparate}
                size="lg"
                className="w-full"
                data-testid="button-create-separate"
              >
                <Package className="mr-2 h-4 w-4" />
                Create {productCount} Separate Listings
              </Button>

              <Button
                onClick={onCreateBundle}
                variant="outline"
                size="lg"
                className="w-full"
                data-testid="button-create-bundle"
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                Create Bundle Listing (All {productCount} Items Together)
              </Button>
            </>
          )}

          {isSameProduct && (
            <Button
              onClick={onCreateSeparate}
              size="lg"
              className="w-full"
              data-testid="button-create-listing"
            >
              <Package className="mr-2 h-4 w-4" />
              Create Listing
            </Button>
          )}

          <Button
            onClick={onManualRegroup}
            variant="ghost"
            size="lg"
            className="w-full"
            data-testid="button-manual-regroup"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Let Me Regroup Manually
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
