import React from "react";
import { useStore } from "../store/useStore";
import { getCustomerBalance, getOverdueCustomers } from "../store/selectors";
import {
  formatCurrency,
  generateWhatsAppLink,
  generateReminderMessage,
} from "../utils";
import { startOfDay, endOfDay } from "date-fns";
import { MessageCircle, Plus, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Udhaar = () => {
  const { customers, transactions, user } = useStore();
  const navigate = useNavigate();

  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();

  // Calculate today's collection
  const todaysPayments = transactions.filter(
    (t) =>
      t.status === "active" &&
      t.type === "payment" &&
      (!t.paymentMode || ["cash", "upi", "card"].includes(t.paymentMode)) &&
      t.createdAt >= todayStart &&
      t.createdAt <= todayEnd,
  );

  const collectedToday = todaysPayments.reduce((sum, t) => sum + t.amount, 0);

  // High Pending customers
  const highPendingCustomers = customers.filter(
    (c) => getCustomerBalance(c.id) > 1000,
  ); // 1000 Rs

  // Overdue customers
  const overdueCustomers = getOverdueCustomers();

  // Filter out any overlap so they only appear once
  const overdueIds = overdueCustomers.map((c) => c.id);

  // Total Overdue balances
  const totalOverdueAmount = overdueCustomers.reduce(
    (sum, c) => sum + getCustomerBalance(c.id),
    0,
  );

  // We want to combine them into a list
  const collectionList = Array.from(
    new Set([...overdueCustomers, ...highPendingCustomers]),
  );

  const allPendingCustomers = customers
    .map((c) => ({
      ...c,
      calculatedBalance: getCustomerBalance(c.id),
    }))
    .filter((c) => c.calculatedBalance > 0)
    .sort((a, b) => b.calculatedBalance - a.calculatedBalance);

  const totalPendingAmount = allPendingCustomers.reduce(
    (sum, c) => sum + c.calculatedBalance,
    0,
  );

  const sendReminder = (customer: any) => {
    if (!user) return;
    const msg = generateReminderMessage(
      customer.name,
      getCustomerBalance(customer.id),
      user.businessName,
      user.language,
      "short",
    );
    const link = generateWhatsAppLink(customer.phone, msg);
    window.open(link, "_blank");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-6 border-b border-slate-100/50 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-400">
            <Plus className="w-5 h-5 rotate-45" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Daily Summary</h1>
        </div>
        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
          Collection & Reminders
        </p>
        <p className="text-[10px] text-slate-500 mt-2 italic">
          Yahan aaj ki collection aur urgent reminders dikhte hain.
        </p>

        <div className="flex flex-col gap-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex flex-col justify-center">
              <p className="text-[9px] uppercase font-bold text-emerald-600 mb-1">
                Aaj ki Collection
              </p>
              <p className="text-lg font-bold text-emerald-900">
                {formatCurrency(collectedToday)}
              </p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 flex flex-col justify-center">
              <p className="text-[9px] uppercase font-bold text-indigo-600 mb-1">
                Total Pending
              </p>
              <p className="text-lg font-bold text-indigo-900">
                {formatCurrency(totalPendingAmount)}
              </p>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <p className="text-[9px] uppercase font-bold text-red-600 mb-1">
              Overdue Amount
            </p>
            <p className="text-lg font-bold text-red-900">
              {formatCurrency(totalOverdueAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-4 pb-24">
        {/* Urgent Actions Section */}
        <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Need Attention
        </h3>

        {collectionList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 flex flex-col items-center bg-white rounded-2xl border border-slate-100 p-6">
            <FileText className="w-10 h-10 mb-3 stroke-1 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No urgent reminders today.</p>
            <p className="text-[10px] text-slate-400 mt-1">Sab kuch control mein hai!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {collectionList.slice(0, 5).map((customer, index) => {
              const bal = getCustomerBalance(customer.id);
              if (bal <= 0) return null;
              return (
                <div
                  key={`attn-${customer.id}-${index}`}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="cursor-pointer"
                      >
                        <p className="font-bold text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                          {customer.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-sm">
                        {formatCurrency(bal)}
                      </p>
                      <span className="text-[8px] uppercase font-bold tracking-wider bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        {overdueIds.includes(customer.id) ? 'Overdue' : 'High Balance'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => sendReminder(customer)}
                      className="flex-1 flex gap-1.5 items-center justify-center py-2 rounded-xl bg-[#25D366]/10 text-[#128C7E] font-bold text-[11px] active:bg-[#25D366]/20 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Reminder
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/add-transaction/${customer.id}?type=payment`)
                      }
                      className="flex-1 flex gap-1.5 items-center justify-center py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-[11px] active:bg-indigo-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Payment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to action for full list */}
        <div className="mt-8 bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100">
          <h4 className="font-bold text-lg mb-2">View All Pending Udhaar</h4>
          <p className="text-indigo-100 text-xs mb-4 leading-relaxed">
            Yahan sirf urgent items hain. Sabhi customers aur filters dekhne ke liye Customers page par jayein.
          </p>
          <button 
            onClick={() => navigate('/customers?tab=customers&filter=due')}
            className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            View All Customers <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
