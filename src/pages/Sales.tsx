import React, { useState } from "react";
import { useStore } from "../store/useStore";
import {
  getSales,
  getSalesSummary,
  getTodaySalesSummary,
} from "../store/selectors";
import { formatCurrency } from "../utils";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  NotebookText,
  XCircle,
  MoreVertical,
  X,
  Settings,
} from "lucide-react";
import { PaymentMode, Sale } from "../types";

export const Sales = () => {
  const navigate = useNavigate();
  const { customers, voidSale, sales, transactions } = useStore();
  const allSales = sales || [];

  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month">(
    "today",
  );
  const [filterMode, setFilterMode] = useState<"all" | PaymentMode>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [voidConfirmMode, setVoidConfirmMode] = useState(false);

  const now = new Date();
  let start = 0;
  let end = 0;

  if (filterPeriod === "today") {
    start = startOfDay(now).getTime();
    end = endOfDay(now).getTime();
  } else if (filterPeriod === "week") {
    start = startOfWeek(now, { weekStartsOn: 1 }).getTime();
    end = endOfWeek(now, { weekStartsOn: 1 }).getTime();
  } else {
    start = startOfMonth(now).getTime();
    end = endOfMonth(now).getTime();
  }

  const filteredSales = allSales
    .filter((s) => s.createdAt >= start && s.createdAt <= end)
    .filter((s) => filterMode === "all" || s.paymentMode === filterMode)
    .sort((a, b) => b.createdAt - a.createdAt);

  // Summary ignores the mode filter so we always see total for the period
  // Summary should ONLY include 'active' sales
  const periodActiveSales = allSales.filter(
    (s) => s.createdAt >= start && s.createdAt <= end && s.status === "active",
  );
  const summary = getSalesSummary(periodActiveSales);

  const periodPayments = (transactions || []).filter(
    (t) => t.type === "payment" && t.status === "active" && t.createdAt >= start && t.createdAt <= end
  );

  const collectionSummary = {
    total: 0,
    cash: 0,
    upi: 0,
    card: 0,
  };

  for (const p of periodPayments) {
    if (p.paymentMode === 'cash' || p.paymentMode === 'upi' || p.paymentMode === 'card') {
      collectionSummary.total += p.amount;
      if (p.paymentMode === 'cash') collectionSummary.cash += p.amount;
      if (p.paymentMode === 'upi') collectionSummary.upi += p.amount;
      if (p.paymentMode === 'card') collectionSummary.card += p.amount;
    }
  }

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const confirmVoidSale = () => {
    if (!selectedSale?.id) {
      setErrorText("No sale selected");
      return;
    }

    const saleId = selectedSale.id;

    const beforeSale = useStore.getState().sales.find((s) => s.id === saleId);

    if (!beforeSale) {
      setErrorText("Sale not found");
      return;
    }

    if (beforeSale.status === "void") {
      setErrorText("Ye sale pehle se void hai");
      return;
    }

    useStore.getState().voidSale(saleId);

    const afterSale = useStore.getState().sales.find((s) => s.id === saleId);

    if (afterSale?.status === "void") {
      setSuccessText("Sale void ho gayi");
      setSelectedSale(null);
      setVoidConfirmMode(false);
    } else {
      setErrorText("Void failed. Status update nahi hua.");
    }
  };

  const toast = {
    error: (msg: string) => {
      setErrorText(msg);
      setTimeout(() => setErrorText(""), 3000);
    },
    success: (msg: string) => {
      setSuccessText(msg);
      setTimeout(() => setSuccessText(""), 3000);
    },
  };

  return (
    <div className="w-full min-h-full px-6 pt-6 pb-28 bg-slate-50">
      <header className="mb-5 shrink-0">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Sales Tracker</h1>
        </div>

        {errorText && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100 flex items-center">
            <XCircle className="w-4 h-4 mr-2" />
            {errorText}
          </div>
        )}

        {successText && (
          <div className="mb-4 bg-emerald-50 text-emerald-600 p-3 rounded-lg text-xs font-bold border border-emerald-100 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {successText}
          </div>
        )}

        {/* Filters */}
        <div className="flex overflow-x-auto gap-2 scrollbar-hide">
          {["today", "week", "month"].map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-colors ${
                filterPeriod === period
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </header>

      <section className="mb-5">
        {/* Summary Cards */}
        <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden mb-5">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">
            {filterPeriod === "today"
              ? "Total Sales (Today)"
              : filterPeriod === "week"
                ? "Total Sales (Week)"
                : "Total Sales (Month)"}
          </p>
          <h3 className="text-3xl font-bold mb-4">
            {formatCurrency(summary.totalSalesPaise)}
          </h3>
          <div className="grid grid-cols-4 gap-2 relative z-10 w-full mb-1">
            <div>
              <p className="text-[9px] text-emerald-200 uppercase font-bold tracking-wider">
                Cash Sales
              </p>
              <p className="text-xs font-bold">
                {formatCurrency(summary.cashPaise)}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-emerald-200 uppercase font-bold tracking-wider">
                UPI Sales
              </p>
              <p className="text-xs font-bold">
                {formatCurrency(summary.upiPaise)}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-emerald-200 uppercase font-bold tracking-wider">
                Card Sales
              </p>
              <p className="text-xs font-bold">
                {formatCurrency(summary.cardPaise)}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-yellow-300 uppercase font-bold tracking-wider">
                Udhaar Sales
              </p>
              <p className="text-xs font-bold text-yellow-300">
                {formatCurrency(summary.udhaarPaise)}
              </p>
            </div>
          </div>
          {summary.profitPaise > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-500/50 flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100">
                Profit Estimate
              </span>
              <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded">
                {formatCurrency(summary.profitPaise)}
              </span>
            </div>
          )}
        </div>

        {/* Collection Summary */}
        <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden mb-5">
           <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
           <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">
             {filterPeriod === "today"
               ? "Today Collection"
               : filterPeriod === "week"
                 ? "Week Collection"
                 : "Month Collection"}
           </p>
           <h3 className="text-3xl font-bold mb-4">
             {formatCurrency(collectionSummary.total)}
           </h3>
           <div className="grid grid-cols-4 gap-2 relative z-10 w-full mb-1">
             <div>
               <p className="text-[9px] text-indigo-200 uppercase font-bold tracking-wider">
                 Cash Collection
               </p>
               <p className="text-xs font-bold">
                 {formatCurrency(collectionSummary.cash)}
               </p>
             </div>
             <div>
               <p className="text-[9px] text-indigo-200 uppercase font-bold tracking-wider">
                 UPI Collection
               </p>
               <p className="text-xs font-bold">
                 {formatCurrency(collectionSummary.upi)}
               </p>
             </div>
             <div>
               <p className="text-[9px] text-indigo-200 uppercase font-bold tracking-wider">
                 Card Collection
               </p>
               <p className="text-xs font-bold">
                 {formatCurrency(collectionSummary.card)}
               </p>
             </div>
           </div>
        </div>
        <p className="text-[10px] text-slate-500 mb-4 px-1">Udhaar sale total sales mein count hoti hai, lekin collection mein nahi jab tak payment na mile.</p>
      </section>

      <section className="mb-4">
        {/* Mode Filter */}
        <div className="flex gap-2 mb-4">
          {["all", "cash", "upi", "card", "udhaar"].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode as any)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filterMode === mode
                  ? "bg-slate-800 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      <section>
        {/* List */}
        {filteredSales.length === 0 ? (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center">
            <NotebookText className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              Aaj koi sale nahi hui
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Nayi sale add karne ke liye upar '+' dabayein
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSales.map((sale, index) => {
              const customer = sale.customerId
                ? customers.find((c) => c.id === sale.customerId)
                : null;
              const isUdhaar = sale.paymentMode === "udhaar";
              const mainItem = sale.items[0];

              let udhaarStatusText = '';
              let udhaarStatusClass = '';

              if (sale.status !== 'void' && isUdhaar && sale.linkedTransactionId) {
                const linkedPayments = (transactions || []).filter(t => t.type === 'payment' && t.status !== 'void' && t.linkedUdhaarTransactionId === sale.linkedTransactionId);
                const totalPaid = linkedPayments.reduce((acc, t) => acc + t.amount, 0);
                const remaining = sale.totalPaise - totalPaid;
                
                if (remaining <= 0) {
                  udhaarStatusText = 'Paid';
                  udhaarStatusClass = 'bg-emerald-100 text-emerald-700';
                } else if (totalPaid > 0) {
                  udhaarStatusText = 'Partial Paid';
                  udhaarStatusClass = 'bg-amber-100 text-amber-700';
                } else {
                  udhaarStatusText = 'Pending';
                  udhaarStatusClass = 'bg-red-100 text-red-600';
                }
              }

              return (
                <div
                  key={`${sale.id}-${index}`}
                  className={`bg-white rounded-xl p-3 border ${sale.status === "void" ? "border-red-200 opacity-60" : "border-slate-200"} relative overflow-hidden`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p
                        className={`font-bold text-sm ${sale.status === "void" ? "text-red-900 line-through" : "text-slate-900"}`}
                      >
                        {mainItem?.name || "Items"}
                        {sale.items.length > 1 && (
                          <span className="text-[10px] text-slate-500 ml-1">
                            +{sale.items.length - 1} more
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2 items-center mt-1">
                        {sale.status === "void" ? (
                          <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                            VOIDED
                          </span>
                        ) : (
                          <span
                            className={`text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                              isUdhaar
                                ? (udhaarStatusClass || "bg-yellow-100 text-yellow-700")
                                : "bg-indigo-100 text-indigo-600"
                            }`}
                          >
                            {isUdhaar && udhaarStatusText ? `UDHAAR - ${udhaarStatusText.toUpperCase()}` : sale.paymentMode}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {format(sale.createdAt, "h:mm a")}
                        </span>
                      </div>
                      {customer && (
                        <p className="text-[10px] font-medium text-slate-600 mt-1.5">
                          Customer:{" "}
                          <span className="font-bold">{customer.name}</span>
                        </p>
                      )}
                      {sale.profitPaise ? (
                        <p className="text-[9px] font-bold text-emerald-600 mt-1">
                          Profit: {formatCurrency(sale.profitPaise)}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {mainItem?.inventoryItemId ? (
                          <>
                            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                              Inventory Linked
                            </span>
                            {mainItem.stockReducedQty ? (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">
                                Stock Reduced: {mainItem.stockReducedQty}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">
                            Manual Sale
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <p
                        className={`font-bold ${sale.status === "void" ? "text-slate-400 line-through" : "text-slate-900"}`}
                      >
                        {formatCurrency(sale.totalPaise)}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedSale(sale);
                        }}
                        className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-md px-3 py-2 hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedSale && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => {
            setSelectedSale(null);
            setVoidConfirmMode(false);
          }}
        >
          <div
            className="w-full bg-white rounded-t-2xl sm:rounded-xl p-6 sm:max-w-sm sm:w-[400px] animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-lg">Sale Action</h3>
              <button
                onClick={() => {
                  setSelectedSale(null);
                  setVoidConfirmMode(false);
                }}
                className="p-2 -mr-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-sm text-slate-500">Amount</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(selectedSale.totalPaise)}
                </span>
              </div>

              {!voidConfirmMode ? (
                <>
                  {selectedSale.status !== "void" && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/invoices/new", {
                          state: { fromSale: selectedSale },
                        })
                      }
                      className="w-full py-3.5 px-4 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
                    >
                      <NotebookText className="w-5 h-5" />
                      Bill Banao
                    </button>
                  )}

                  {selectedSale.status !== "void" && (
                    <button
                      type="button"
                      onClick={() => setVoidConfirmMode(true)}
                      className="w-full py-3.5 px-4 bg-white border-2 border-red-500 text-red-600 font-bold rounded-xl flex items-center justify-center hover:bg-red-50 active:bg-red-100 transition-colors"
                    >
                      Void Sale
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-4">
                  <h4 className="font-bold text-red-900">Void this sale?</h4>
                  <p className="text-sm text-red-700">
                    Ye sale cancel ho jayegi. Sales total se remove hogi. Agar
                    inventory linked hai to stock restore hoga.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={confirmVoidSale}
                      className="w-full rounded-xl bg-red-600 px-4 py-4 text-sm font-bold text-white active:bg-red-700"
                    >
                      Confirm Void
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoidConfirmMode(false)}
                      className="w-full rounded-xl bg-white border border-slate-200 px-4 py-4 text-sm font-bold text-slate-700 active:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
