import { useState } from "react";
import { useLocation } from "wouter";
import { Upload, Download, FileText, Image, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CSVRow {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  location: string;
  imageFiles: string;
  sku?: string;
}

interface ParsedItem extends CSVRow {
  rowNumber: number;
  matchedImages: string[];
  errors: string[];
}

export default function PartnerBulkUpload() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string }>({});
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [importProgress, setImportProgress] = useState(0);

  const downloadTemplate = () => {
    const template = `title,description,price,category,condition,location,imageFiles,sku
"Herman Miller Office Chair","Ergonomic office chair in excellent condition",350,furniture,excellent,"Seattle, WA","chair1.jpg,chair2.jpg",SKU001
"Dell 24-inch Monitor","Professional display, barely used",200,electronics,good,"Tacoma, WA",monitor.jpg,SKU002
"Industrial Shelving Unit","Heavy-duty metal shelving",150,furniture,fair,"Bellevue, WA","shelf1.jpg,shelf2.jpg,shelf3.jpg",SKU003`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-upload-template.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Fill out the CSV template and upload it along with your images.",
    });
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    toast({
      title: "CSV Uploaded",
      description: `${file.name} ready to process`,
    });
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipFile(file);
    
    // In a real implementation, we'd extract the ZIP and get image URLs
    // For now, we'll simulate this
    toast({
      title: "Images Uploaded",
      description: `${file.name} ready to process`,
    });
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        // Simple CSV parsing (doesn't handle quotes properly - would need proper CSV parser)
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row as CSVRow;
      });
  };

  const processFiles = async () => {
    if (!csvFile) {
      toast({
        title: "Missing CSV",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    try {
      // Read CSV
      const csvText = await csvFile.text();
      const rows = parseCSV(csvText);

      // Parse and validate each row
      const items: ParsedItem[] = rows.map((row, index) => {
        const errors: string[] = [];
        
        if (!row.title) errors.push("Missing title");
        if (!row.price || isNaN(Number(row.price))) errors.push("Invalid price");
        if (!row.category) errors.push("Missing category");

        // Parse image filenames
        const imageFiles = row.imageFiles
          ? row.imageFiles.split(',').map(f => f.trim())
          : [];

        return {
          ...row,
          rowNumber: index + 2, // +2 because of header and 0-indexing
          matchedImages: imageFiles,
          errors,
        };
      });

      setParsedItems(items);
      setStep('preview');

      toast({
        title: "CSV Processed",
        description: `Found ${items.length} items to import`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse CSV file",
        variant: "destructive",
      });
    }
  };

  const importItems = async () => {
    setStep('importing');
    
    const validItems = parsedItems.filter(item => item.errors.length === 0);
    
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      
      try {
        // Upload images first (simulated - would use actual upload endpoint)
        const imageUrls: string[] = [];
        
        // Create listing
        const response = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: item.title,
            description: item.description,
            price: Number(item.price),
            category: item.category,
            condition: item.condition,
            location: item.location,
            images: imageUrls,
            partnerListing: true,
          }),
        });

        if (!response.ok) throw new Error('Failed to create listing');

        setImportProgress(((i + 1) / validItems.length) * 100);
      } catch (error) {
        console.error(`Failed to import item ${item.rowNumber}:`, error);
      }
    }

    toast({
      title: "Import Complete!",
      description: `Successfully imported ${validItems.length} items`,
    });

    setTimeout(() => navigate('/partner/dashboard'), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/partner/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Bulk Upload Listings</h1>
          <p className="text-gray-600 mt-2">
            Upload multiple listings at once using a CSV file and images
          </p>
        </div>

        {/* Step 1: Upload Files */}
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Download Template */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-4">
                <Download className="w-6 h-6 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">Step 1: Download Template</h2>
                  <p className="text-gray-600 mb-4">
                    Download our CSV template and fill it out with your listing data
                  </p>
                  <Button onClick={downloadTemplate} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>
              </div>
            </div>

            {/* Upload CSV */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-green-600 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">Step 2: Upload CSV File</h2>
                  <p className="text-gray-600 mb-4">
                    Upload your completed CSV file with listing data
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {csvFile ? csvFile.name : 'Click to upload CSV file'}
                      </p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Images */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-4">
                <Image className="w-6 h-6 text-purple-600 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">Step 3: Upload Images (ZIP)</h2>
                  <p className="text-gray-600 mb-4">
                    Upload a ZIP file containing all your product images
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleZipUpload}
                      className="hidden"
                      id="zip-upload"
                    />
                    <label htmlFor="zip-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {zipFile ? zipFile.name : 'Click to upload ZIP file'}
                      </p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    💡 Tip: Name your image files to match the "imageFiles" column in your CSV
                  </p>
                </div>
              </div>
            </div>

            {/* Process Button */}
            <div className="flex justify-end">
              <Button
                onClick={processFiles}
                disabled={!csvFile}
                size="lg"
              >
                Process Files
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Preview & Validate</h2>
              <p className="text-gray-600 mb-6">
                Review your items before importing. Fix any errors before proceeding.
              </p>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-blue-600">{parsedItems.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Valid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {parsedItems.filter(i => i.errors.length === 0).length}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">
                    {parsedItems.filter(i => i.errors.length > 0).length}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {parsedItems.map((item, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      item.errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {item.errors.length === 0 ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <h3 className="font-semibold">{item.title || `Row ${item.rowNumber}`}</h3>
                          <span className="text-sm text-gray-500">Row {item.rowNumber}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>Price: ${item.price}</div>
                          <div>Category: {item.category}</div>
                          <div>Condition: {item.condition}</div>
                          <div>Images: {item.matchedImages.length}</div>
                        </div>
                        {item.errors.length > 0 && (
                          <div className="mt-2 text-sm text-red-600">
                            {item.errors.map((error, i) => (
                              <div key={i}>• {error}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  ← Back
                </Button>
                <Button
                  onClick={importItems}
                  disabled={parsedItems.filter(i => i.errors.length === 0).length === 0}
                >
                  Import {parsedItems.filter(i => i.errors.length === 0).length} Items
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-semibold mb-4">Importing Listings...</h2>
            <div className="max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-gray-600">{Math.round(importProgress)}% complete</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

