"use client";

import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import { useSupabase } from "@/lib/supabase/use-supabase";

// ============================================
// Types
// ============================================
type Order = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  due_at: string;
  status: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  deposit_paid: number;
  balance_due: number;
  notes: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
};

type Props = {
  order: Order;
  items: OrderItem[];
};

// ============================================
// Company Info Constants
// ============================================
const COMPANY = {
  name: "Cake Bucket",
  address: "5/10 Woodvale Road, Boronia 3155 VIC",
  phone: "0416 496 097",
  email: "cakebucketsl@gmail.com",
  abn: "21 739 952 934",
} as const;

// ============================================
// PDF Color Scheme
// ============================================
const COLORS = {
  primary: [114, 63, 59] as [number, number, number],     // #723F3B
  secondary: [194, 114, 124] as [number, number, number], // #C2727C
  lightBg: [255, 248, 240] as [number, number, number],   // #FFF8F0
  text: [60, 60, 60] as [number, number, number],
  textLight: [120, 120, 120] as [number, number, number],
  success: [34, 139, 34] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

// Status colors for invoice
const STATUS_COLORS: Record<string, [number, number, number]> = {
  completed: [34, 139, 34],      // Green
  delivered: [75, 0, 130],       // Indigo
  ready: [128, 0, 128],          // Purple
  in_progress: [30, 144, 255],   // Blue
  confirmed: [194, 114, 124],    // Pink
  pending_confirm: [218, 165, 32], // Gold
  cancelled: [220, 20, 60],      // Red
  draft: [128, 128, 128],        // Gray
};

export function GenerateInvoiceButton({ order, items }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [specialNotes, setSpecialNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const { supabase, refreshSession } = useSupabase();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    setGenerating(true);

    try {
      // Refresh session first
      await refreshSession();

      // Create invoice record in database to get the invoice number
      const notesToSave = specialNotes.trim() || order.notes || null;
      
      const { data: invoiceRecord, error: insertError } = await supabase
        .from("invoices")
        .insert({
          order_id: order.id,
          customer_name: order.customer_name,
          total: order.total,
          balance_due: order.balance_due,
          event_date: order.due_at,
          special_notes: notesToSave,
        })
        .select("invoice_number")
        .single();

      if (insertError) {
        console.error("Failed to create invoice record:", insertError);
        alert("Failed to create invoice record: " + insertError.message);
        setGenerating(false);
        return;
      }

      const invoiceNumber = `INV${String(invoiceRecord.invoice_number).padStart(4, "0")}`;

      // Create PDF with compression
      const doc = new jsPDF({
        compress: true,
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      // Date formatting
      const invoiceDate = new Date().toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const eventDate = new Date(order.due_at).toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      // Try to load and compress logo
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        
        await new Promise<void>((resolve) => {
          logoImg.onload = () => {
            // Create a canvas to resize the logo with good quality
            const canvas = document.createElement("canvas");
            const targetSize = 150; // Higher resolution for better quality
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Enable high-quality image smoothing
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";
              ctx.drawImage(logoImg, 0, 0, targetSize, targetSize);
              // Use PNG for logo to preserve quality (small file anyway)
              const compressedDataUrl = canvas.toDataURL("image/png");
              doc.addImage(compressedDataUrl, "PNG", margin, y, 38, 38);
            }
            resolve();
          };
          logoImg.onerror = () => {
            console.warn("Could not load logo");
            resolve(); // Continue without logo
          };
          logoImg.src = "/logo/cakebucketlogo.png";
        });
      } catch {
        console.warn("Logo loading failed");
      }

      // Header - Company Info (right side)
      doc.setFontSize(24);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", pageWidth - margin, y + 10, { align: "right" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textLight);
      doc.text(COMPANY.name, pageWidth - margin, y + 20, { align: "right" });
      doc.text(COMPANY.address, pageWidth - margin, y + 26, { align: "right" });
      doc.text(`Phone: ${COMPANY.phone} | Email: ${COMPANY.email}`, pageWidth - margin, y + 32, { align: "right" });
      doc.text(`ABN: ${COMPANY.abn}`, pageWidth - margin, y + 38, { align: "right" });

      y += 55;

      // Invoice Details Box
      doc.setFillColor(...COLORS.lightBg);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, "F");

      doc.setFontSize(10);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text("Invoice Number:", margin + 5, y + 10);
      doc.text("Invoice Date:", margin + 5, y + 20);
      doc.text("Event Date:", margin + 5, y + 30);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      doc.text(invoiceNumber, margin + 45, y + 10);
      doc.text(invoiceDate, margin + 45, y + 20);
      doc.text(eventDate, margin + 45, y + 30);

      // Order Status (right side of box)
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text("Status:", pageWidth - margin - 70, y + 15);
      
      const statusColor = STATUS_COLORS[order.status] || COLORS.secondary;
      doc.setTextColor(...statusColor);
      doc.text(order.status.replace("_", " ").toUpperCase(), pageWidth - margin - 40, y + 15);

      y += 45;

      // Bill To Section
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", margin, y);

      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      doc.text(order.customer_name, margin, y);
      y += 6;
      if (order.customer_phone) {
        doc.text(`Phone: ${order.customer_phone}`, margin, y);
        y += 6;
      }
      if (order.customer_email) {
        doc.text(`Email: ${order.customer_email}`, margin, y);
        y += 6;
      }

      y += 10;

      // Items Table Header
      doc.setFillColor(...COLORS.secondary);
      doc.rect(margin, y, pageWidth - 2 * margin, 10, "F");

      doc.setFontSize(10);
      doc.setTextColor(...COLORS.white);
      doc.setFont("helvetica", "bold");
      doc.text("Description", margin + 5, y + 7);
      doc.text("Qty", pageWidth - margin - 55, y + 7);
      doc.text("Price", pageWidth - margin - 35, y + 7);
      doc.text("Total", pageWidth - margin - 10, y + 7, { align: "right" });

      y += 12;

      // Items
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);

      items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 2, pageWidth - 2 * margin, 10, "F");
        }

        // Truncate long item names
        const maxNameWidth = pageWidth - margin - 80;
        let itemName = item.item_name;
        while (doc.getTextWidth(itemName) > maxNameWidth && itemName.length > 10) {
          itemName = itemName.slice(0, -4) + "...";
        }

        doc.text(itemName, margin + 5, y + 5);
        doc.text(String(item.quantity), pageWidth - margin - 55, y + 5);
        doc.text(`$${Number(item.unit_price).toFixed(2)}`, pageWidth - margin - 35, y + 5);
        doc.text(`$${Number(item.line_total).toFixed(2)}`, pageWidth - margin - 5, y + 5, { align: "right" });

        if (item.notes) {
          y += 8;
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.textLight);
          doc.text(`Note: ${item.notes}`, margin + 10, y + 3);
          doc.setFontSize(10);
          doc.setTextColor(...COLORS.text);
        }

        y += 10;
      });

      y += 5;

      // Totals Section
      doc.setDrawColor(200, 200, 200);
      doc.line(pageWidth - margin - 80, y, pageWidth - margin, y);

      y += 8;
      const totalsX = pageWidth - margin - 80;

      // Subtotal
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", totalsX, y);
      doc.text(`$${Number(order.subtotal).toFixed(2)}`, pageWidth - margin - 5, y, { align: "right" });
      y += 7;

      // Discount (if any)
      if (Number(order.discount) > 0) {
        doc.text("Discount:", totalsX, y);
        doc.setTextColor(...COLORS.success);
        doc.text(`-$${Number(order.discount).toFixed(2)}`, pageWidth - margin - 5, y, { align: "right" });
        doc.setTextColor(...COLORS.text);
        y += 7;
      }

      // Delivery fee (if any)
      if (Number(order.delivery_fee) > 0) {
        doc.text("Delivery Fee:", totalsX, y);
        doc.text(`$${Number(order.delivery_fee).toFixed(2)}`, pageWidth - margin - 5, y, { align: "right" });
        y += 7;
      }

      // Total
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.primary);
      doc.text("Total:", totalsX, y);
      doc.text(`$${Number(order.total).toFixed(2)}`, pageWidth - margin - 5, y, { align: "right" });
      y += 10;

      // Deposit Paid
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      doc.text("Deposit Paid:", totalsX, y);
      doc.setTextColor(...COLORS.success);
      doc.text(`$${Number(order.deposit_paid).toFixed(2)}`, pageWidth - margin - 5, y, { align: "right" });
      y += 7;

      // Balance Due
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.secondary);
      doc.text("Balance Due:", totalsX, y);
      doc.text(`$${Number(order.balance_due).toFixed(2)}`, pageWidth - margin - 5, y, { align: "right" });

      y += 20;

      // Special Notes Section
      const notesToUse = notesToSave || "";
      if (notesToUse) {
        // Check if we need a new page
        if (y > pageHeight - 80) {
          doc.addPage();
          y = margin;
        }

        doc.setFillColor(...COLORS.lightBg);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, 8, 2, 2, "F");

        doc.setFontSize(11);
        doc.setTextColor(...COLORS.primary);
        doc.setFont("helvetica", "bold");
        doc.text("Special Notes:", margin + 5, y + 6);

        y += 12;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.text);

        // Word wrap for notes
        const splitNotes = doc.splitTextToSize(notesToUse, pageWidth - 2 * margin - 10);
        doc.text(splitNotes, margin + 5, y);
        y += splitNotes.length * 5 + 5;
      }

      // Attached Images
      if (attachedImages.length > 0) {
        if (y > pageHeight - 100) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(11);
        doc.setTextColor(...COLORS.primary);
        doc.setFont("helvetica", "bold");
        doc.text("Attached Images:", margin, y);
        y += 10;

        for (const imgData of attachedImages) {
          if (y > pageHeight - 80) {
            doc.addPage();
            y = margin;
          }

          try {
            // Compress attached images before adding
            const img = new Image();
            img.src = imgData;
            await new Promise<void>((resolve) => {
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const maxSize = 200; // Resize to max 200px
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  const compressedImg = canvas.toDataURL("image/jpeg", 0.6);
                  doc.addImage(compressedImg, "JPEG", margin, y, 50, 50);
                }
                resolve();
              };
              img.onerror = () => resolve();
            });
            y += 55;
          } catch {
            console.warn("Could not add image to PDF");
          }
        }
      }

      // Footer
      const footerY = pageHeight - 25;
      doc.setDrawColor(...COLORS.secondary);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textLight);
      doc.setFont("helvetica", "normal");
      doc.text("Thank you for your Order!", pageWidth / 2, footerY, { align: "center" });
      doc.text(
        "Payment can be made via bank transfer or cash on pickup/delivery.",
        pageWidth / 2,
        footerY + 5,
        { align: "center" }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString("en-AU")}`,
        pageWidth / 2,
        footerY + 10,
        { align: "center" }
      );

      // Save PDF
      const fileName = `${invoiceNumber}_${order.customer_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      doc.save(fileName);

      setShowModal(false);
      setSpecialNotes("");
      setAttachedImages([]);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate invoice. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-[#723F3B] hover:bg-[#5a312e] text-white font-medium rounded-lg transition"
      >
        Generate Invoice
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#723F3B] mb-4">Generate Invoice</h2>

              <div className="space-y-4">
                {/* Order Summary */}
                <div className="bg-[#FFF8F0] rounded-lg p-4 text-sm">
                  <p><strong>Customer:</strong> {order.customer_name}</p>
                  <p><strong>Total:</strong> ${Number(order.total).toFixed(2)}</p>
                  <p><strong>Deposit Paid:</strong> ${Number(order.deposit_paid).toFixed(2)}</p>
                  <p><strong>Balance Due:</strong> ${Number(order.balance_due).toFixed(2)}</p>
                  <p><strong>Event Date:</strong> {new Date(order.due_at).toLocaleDateString()}</p>
                </div>

                {/* Special Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Notes (optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Leave empty to use order notes automatically
                  </p>
                  <textarea
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Enter special notes for this invoice..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D7A1B4] focus:border-[#D7A1B4] outline-none"
                  />
                </div>

                {/* Attach Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attach Images (optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition"
                  >
                    + Add Images
                  </button>

                  {/* Image Previews */}
                  {attachedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {attachedImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img
                            src={img}
                            alt={`Attachment ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Notes Preview */}
                {!specialNotes && order.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-gray-700 mb-1">Order Notes (will be used):</p>
                    <p className="text-gray-600 whitespace-pre-wrap text-xs">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSpecialNotes("");
                    setAttachedImages([]);
                  }}
                  disabled={generating}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={generatePDF}
                  disabled={generating}
                  className="px-4 py-2 bg-[#723F3B] hover:bg-[#5a312e] text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Download Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
