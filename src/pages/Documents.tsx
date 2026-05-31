import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { format } from "date-fns";
import { formatCurrency } from "../utils";
import {
  ArrowLeft,
  Search,
  FileText,
  Eye,
  Calendar,
  User,
  X,
  CreditCard,
  Notebook
} from "lucide-react";

interface DocumentItem {
  id: string; // transaction id or sale id
  docType: "udhaar_slip" | "payment_receipt" | "sale_invoice";
  docNumber: string;
  customerName: string;
  customerId?: string;
  amount: number;
  date: number;
  details: string;
  status: "active" | "void";
}

export const Documents = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customers, transactions, sales } = useStore();

  const customerIdFilter = searchParams.get("customerId");

  const [searchTerm, setSearchTerm] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState<"all" | "udhaar_slip" | "payment_receipt" | "sale_invoice">("all");

  // Compile all documents across the application
  const allDocs: DocumentItem[] = [];

  // 1. Gather documents from Transactions
  (transactions || []).forEach((tx) => {
    const customer = customers.find((c) => c.id === tx.customerId);
    const customerName = customer ? customer.name : "Walk-in Customer";

    const hasDoc = tx.documentGenerated || !!tx.documentType || !!tx.receiptNumber || !!tx.slipNumber;
    if (hasDoc) {
      const isUdhaarDoc = tx.type === "udhaar" || tx.type === "sale_credit";
      const docType = isUdhaarDoc ? "udhaar_slip" : "payment_receipt";
      const docNumber = tx.slipNumber || tx.receiptNumber || `DOC-${tx.id.slice(0, 6).toUpperCase()}`;

      allDocs.push({
        id: tx.id,
        docType,
        docNumber,
        customerName,
        customerId: tx.customerId,
        amount: tx.amount,
        date: tx.createdAt,
        details: tx.description || (isUdhaarDoc ? "Udhaar Entry" : "Received Payment"),
        status: tx.status === "void" ? "void" : "active"
      });
    }
  });

  // 2. Gather documents from Sales
  (sales || []).forEach((sale) => {
    const customer = sale.customerId ? customers.find((c) => c.id === sale.customerId) : null;
    const customerName = customer ? customer.name : "Walk-in Customer";

    if (sale.invoiceNumber || sale.billGenerated) {
      const docNumber = sale.invoiceNumber || `SAL-${sale.id.slice(0, 6).toUpperCase()}`;
      allDocs.push({
        id: sale.id,
        docType: "sale_invoice",
        docNumber,
        customerName,
        customerId: sale.customerId,
        amount: sale.totalPaise,
        date: sale.createdAt,
        details: sale.items.map(item => `${item.name} (${item.quantity})`).join(", ") || "Sale Bill",
        status: sale.status === "void" ? "void" : "active"
      });
    }
  });

  // Sort descending by date
  allDocs.sort((a, b) => b.date - a.date);

  // Apply filters
  const filteredDocs = allDocs.filter((doc) => {
    // Customer filter from query params
    if (customerIdFilter && doc.customerId !== customerIdFilter) return false;

    // Doc type filter
    if (docTypeFilter !== "all" && doc.docType !== docTypeFilter) return false;

    // Search term (searches customer name, doc number, details)
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const matchName = doc.customerName.toLowerCase().includes(term);
      const matchNum = doc.docNumber.toLowerCase().includes(term);
      const matchDetail = doc.details.toLowerCase().includes(term);
      return matchName || matchNum || matchDetail;
    }

    return true;
  });

  const getDocTypeBadge = (type: DocumentItem["docType"]) => {
    switch (type) {
      case "udhaar_slip":
        return {
          label: "Udhaar Slip",
          color: "bg-red-50 text-red-700 border-red-100",
          icon: <Notebook className="w-3 h-3 mr-1" />
        };
      case "payment_receipt":
        return {
          label: "Receipt",
          color: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: <CreditCard className="w-3 h-3 mr-1" />
        };
      case "sale_invoice":
        return {
          label: "Sale Bill",
          color: "bg-indigo-50 text-indigo-700 border-indigo-100",
          icon: <FileText className="w-3 h-3 mr-1" />
        };
    }
  };

  const getFilteredCustomerName = () => {
    if (!customerIdFilter) return null;
    const cust = customers.find(c => c.id === customerIdFilter);
    return cust ? cust.name : "Customer";
  };

  const customerNameFiltered = getFilteredCustomerName();

  return (
    <div className="w-full min-h-full px-6 pt-6 pb-28 bg-slate-50">
      <header className="mb-5">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:bg-slate-100 p-2 rounded-full -ml-2 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Document Store</h1>
        </div>

        {customerNameFiltered && (
          <div className="flex items-center justify-between text-xs bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-650" />
              <p className="text-indigo-800 font-bold">
                Showing documents of: <span className="underline">{customerNameFiltered}</span>
              </p>
            </div>
            <button
              onClick={() => {
                searchParams.delete("customerId");
                navigate(`/documents?${searchParams.toString()}`);
              }}
              className="text-indigo-500 hover:text-indigo-800 p-1 bg-white hover:bg-slate-100 rounded-full transition-colors border border-indigo-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, bill No, item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {(["all", "sale_invoice", "udhaar_slip", "payment_receipt"] as const).map((type) => {
              const isActive = docTypeFilter === type;
              const labels = {
                all: "All Docs",
                sale_invoice: "Sale Bills",
                udhaar_slip: "Udhaar Slips",
                payment_receipt: "Receipts"
              };

              return (
                <button
                  key={type}
                  onClick={() => setDocTypeFilter(type)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 whitespace-nowrap active:scale-95 ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Docs List */}
      <section className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-150 rounded-2xl p-6">
            <FileText className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
            <p className="font-bold text-slate-800 text-sm">No Documents Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Select other document filters or search terms.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const badge = getDocTypeBadge(doc.docType);

            return (
              <div
                key={`${doc.docType}-${doc.id}`}
                onClick={() => navigate(`/documents/${doc.docType}/${doc.id}`)}
                className={`bg-white rounded-xl p-4 border transition-all hover:shadow-sm cursor-pointer group active:scale-[0.99] relative ${
                  doc.status === "void" ? "border-red-200 opacity-60" : "border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border flex items-center ${badge.color}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                      {doc.status === "void" && (
                        <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          VOIDED
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-slate-600">
                        #{doc.docNumber}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 mt-2 text-sm group-hover:text-indigo-650 transition-colors">
                      {doc.customerName}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
                      {doc.details}
                    </p>

                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-2.5 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{format(doc.date, "dd MMM yyyy, h:mm a")}</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end justify-between h-full">
                    <p className={`font-black text-sm ${doc.status === "void" ? "text-slate-400 line-through" : "text-indigo-950"}`}>
                      {formatCurrency(doc.amount)}
                    </p>

                    <span className="mt-6 inline-flex p-1.5 bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 rounded-lg border border-slate-100 group-hover:border-indigo-100 transition-all self-end">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
