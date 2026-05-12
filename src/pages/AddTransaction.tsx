import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { getCustomerBalance } from "../store/selectors";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeft, Package } from "lucide-react";
import { BottomActionBar } from "../components/layout/BottomActionBar";

import {
  validateQuantityByUnit,
  isDecimalAllowedForUnit,
} from "../utils/quantity";
import {
  validateMoneyAmount,
  sanitizeMoneyInput,
  handleMoneyKeyDown,
} from "../utils/money";

export const AddTransaction = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [searchParams] = useSearchParams();
  const {
    customers,
    inventory,
    transactions,
    addTransaction,
    adjustStock,
    user,
    addSale,
  } = useStore();

  const initialType = searchParams.get("type") || "udhaar";

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    type: initialType as "udhaar" | "payment",
    paymentMode: "cash" as "cash" | "upi" | "card",
    dueDate: "",
  });

  const [udhaarMode, setUdhaarMode] = useState<"manual" | "inventory">(
    "manual",
  );
  const [paymentModeRef, setPaymentModeRef] = useState<"general" | "udhaar">(
    "general",
  );
  const [selectedUdhaarId, setSelectedUdhaarId] = useState<string>("");
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [inventoryQty, setInventoryQty] = useState<string>("1");

  const [errorText, setErrorText] = useState("");

  // If customerId is provided, we strictly add to that customer.
  // We need to support 'select' as customerId placeholder.
  let initialCustomer =
    customerId && customerId !== "select"
      ? customerId
      : searchParams.get("customerId") || "";
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);

  const isUdhaar = formData.type === "udhaar";
  const isInventoryMode = isUdhaar && udhaarMode === "inventory";
  const selectedItem = inventory.find((i) => i.id === selectedInventoryId);

  const pendingUdhaars = transactions
    .filter(
      (t) =>
        t.customerId === selectedCustomer &&
        (t.type === "udhaar" || t.type === "sale_credit") &&
        t.status !== "void",
    )
    .map((t) => {
      const linkedPayments = transactions.filter(
        (p) =>
          p.type === "payment" &&
          p.status !== "void" &&
          p.linkedUdhaarTransactionId === t.id,
      );
      const totalLinkedPayment = linkedPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      return { ...t, pendingAmount: t.amount - totalLinkedPayment };
    })
    .filter((t) => t.pendingAmount > 0)
    .sort((a, b) => b.createdAt - a.createdAt);

  const selectedUdhaarEntry =
    selectedUdhaarId === "general"
      ? null
      : pendingUdhaars.find((t) => t.id === selectedUdhaarId);
  const currentCustomerBalance = selectedCustomer
    ? getCustomerBalance(selectedCustomer)
    : 0;

  useEffect(() => {
    if (!isUdhaar && paymentModeRef === "udhaar" && selectedUdhaarId) {
      if (selectedUdhaarEntry) {
        setFormData((prev) => ({
          ...prev,
          amount: (selectedUdhaarEntry.pendingAmount / 100).toFixed(2),
          description: `Payment against: ${selectedUdhaarEntry.description || "Udhaar"}`,
        }));
      } else if (selectedUdhaarId === "general" && currentCustomerBalance > 0) {
        setFormData((prev) => ({
          ...prev,
          amount: (currentCustomerBalance / 100).toFixed(2),
          description: `Payment against: General pending balance`,
        }));
      }
    }
    // Only fire off on selectedUdhaarId or mode change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUdhaarId, paymentModeRef, isUdhaar]);

  // Auto-calculate amount when inventory item or qty changes
  useEffect(() => {
    if (isInventoryMode && selectedItem) {
      const qty = parseFloat(inventoryQty) || 0;
      if (qty > 0) {
        const totalAmount = (selectedItem.sellingPricePaise / 100) * qty;
        setFormData((prev) => ({
          ...prev,
          amount: totalAmount.toFixed(2),
          description: `Inventory Udhaar: ${selectedItem.name} x ${qty}`,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          amount: "",
        }));
      }
    }
  }, [selectedInventoryId, inventoryQty, isInventoryMode, selectedItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!selectedCustomer) {
      setErrorText("Please select a customer.");
      return;
    }

    // Amount is received as Rupee decimal, convert to paise
    const parsedAmount = parseFloat(formData.amount);

    // Robust validation
    const amountVal = validateMoneyAmount(formData.amount, { required: true });
    if (!amountVal.valid) {
      setErrorText(amountVal.error || "Invalid amount");
      return;
    }

    if (isInventoryMode) {
      if (!selectedInventoryId || !selectedItem) {
        setErrorText("Please select an inventory item.");
        return;
      }
      const qty = parseFloat(inventoryQty);

      const qtyValidation = validateQuantityByUnit(qty, selectedItem.unit);
      if (!qtyValidation.valid) {
        setErrorText(qtyValidation.error || "Invalid quantity");
        return;
      }

      if (qty > selectedItem.stockQty) {
        setErrorText(`Stock available nahi hai. Sirf ${selectedItem.stockQty} ${selectedItem.unit} available hai.`);
        return;
      }
    }

    if (!isUdhaar && paymentModeRef === "udhaar") {
      if (!selectedUdhaarId || !selectedUdhaarEntry) {
        setErrorText(
          "Please select an udhaar entry or switch to General Payment.",
        );
        return;
      }
    }

    const amountInPaise = Math.round(parsedAmount * 100);
    const generateId = () => Math.random().toString(36).substring(2, 15);

    // For payment against udhaar, extract reference inventory id if it was an inventory udhaar
    const paymentLinkedInventoryId =
      !isUdhaar &&
      paymentModeRef === "udhaar" &&
      selectedUdhaarEntry?.inventoryItemId
        ? selectedUdhaarEntry.inventoryItemId
        : undefined;

    let saleId: string | undefined;
    const txId = generateId();

    if (isInventoryMode && selectedInventoryId && selectedItem) {
      saleId = generateId();
      const qty = parseFloat(inventoryQty);

      let profitPaise: number | undefined = undefined;
      const unitPricePaise = Math.round(amountInPaise / qty);
      if (selectedItem.purchasePricePaise) {
        profitPaise = amountInPaise - selectedItem.purchasePricePaise * qty;
      }

      addSale({
        id: saleId,
        userId: user?.id || "unknown",
        customerId: selectedCustomer,
        items: [
          {
            id: generateId(),
            inventoryItemId: selectedInventoryId,
            name: selectedItem.name,
            quantity: qty,
            unitPricePaise: unitPricePaise,
            costPricePaise: selectedItem.purchasePricePaise,
            lineTotalPaise: amountInPaise,
            profitPaise: profitPaise,
            stockReducedQty: qty,
          },
        ],
        subtotalPaise: amountInPaise,
        discountPaise: 0,
        totalPaise: amountInPaise,
        profitPaise: profitPaise,
        paymentMode: "udhaar",
        linkedTransactionId: txId,
      });
    }

    addTransaction({
      id: txId,
      userId: user?.id || "unknown",
      customerId: selectedCustomer,
      type: isInventoryMode ? "sale_credit" : formData.type,
      amount: amountInPaise,
      description:
        formData.description ||
        (isUdhaar
          ? isInventoryMode
            ? "Inventory se Udhaar"
            : "Given Udhaar"
          : "Received Payment"),
      paymentMode: isUdhaar ? undefined : formData.paymentMode,
      inventoryItemId: isInventoryMode
        ? selectedInventoryId
        : paymentLinkedInventoryId,
      stockReducedQty: isInventoryMode ? parseFloat(inventoryQty) : undefined,
      linkedUdhaarTransactionId:
        !isUdhaar &&
        paymentModeRef === "udhaar" &&
        selectedUdhaarId !== "general"
          ? selectedUdhaarId
          : undefined,
      linkedSaleId: saleId,
      dueDate: isUdhaar && formData.dueDate ? formData.dueDate : undefined,
    });

    navigate(-1);
  };

  return (
    <div className="w-full min-h-full pb-36 bg-white">
      <div className="flex items-center space-x-4 px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10 bg-white">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {isUdhaar ? "Give Udhaar" : "Receive Payment"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full px-6 py-6 mt-2"
      >
        <div className="space-y-5">
          {errorText && (
            <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold p-3 rounded-lg mb-2">
              {errorText}
            </div>
          )}

          {/* Mode Switch (if Udhaar) */}
          {isUdhaar && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setUdhaarMode("manual")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${udhaarMode === "manual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Manual Udhaar
              </button>
              <button
                type="button"
                onClick={() => setUdhaarMode("inventory")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${udhaarMode === "inventory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Package className="w-3.5 h-3.5" />
                Inventory se Udhaar
              </button>
            </div>
          )}

          {/* Customer Selection (if not pre-populated) */}
          {!initialCustomer && (
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                Select Customer
              </label>
              <select
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                required
              >
                <option value="" disabled>
                  Choose a customer...
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Reference Selection (if Payment) */}
          {!isUdhaar && selectedCustomer && (
            <div className="space-y-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mt-4">
              <label className="text-xs font-bold text-emerald-900 mb-1.5 block uppercase tracking-wider">
                Payment kis udhaar ke against hai? (Optional)
              </label>
              <div className="flex gap-2 p-1 bg-white rounded-xl border border-emerald-200">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentModeRef("general");
                    setSelectedUdhaarId("");
                  }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors ${paymentModeRef === "general" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  General Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModeRef("udhaar")}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors ${paymentModeRef === "udhaar" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Udhaar Entry Select Karo
                </button>
              </div>

              {paymentModeRef === "udhaar" && (
                <div>
                  <select
                    className="flex h-12 w-full rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-2"
                    value={selectedUdhaarId}
                    onChange={(e) => setSelectedUdhaarId(e.target.value)}
                    required={paymentModeRef === "udhaar"}
                  >
                    <option value="" disabled>
                      Select pending udhaar...
                    </option>
                    {pendingUdhaars.map((tu) => (
                      <option key={tu.id} value={tu.id}>
                        {tu.description || "Udhaar"} — ₹
                        {(tu.pendingAmount / 100).toFixed(2)} pending
                      </option>
                    ))}
                    {currentCustomerBalance > 0 && (
                      <option value="general">
                        General pending balance — ₹
                        {(currentCustomerBalance / 100).toFixed(2)} pending
                      </option>
                    )}
                    {pendingUdhaars.length === 0 &&
                      currentCustomerBalance <= 0 && (
                        <option value="" disabled>
                          No pending udhaar found
                        </option>
                      )}
                  </select>
                  <p className="text-[10px] text-emerald-700 font-medium leading-relaxed mt-2">
                    Payment lene par stock change nahi hota. Ye sirf kis udhaar
                    ke against paisa aaya hai, woh track karne ke liye hai.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Inventory Selection */}
          {isInventoryMode && (
            <div className="space-y-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div>
                <label className="text-xs font-bold text-indigo-900 mb-1.5 block uppercase tracking-wider">
                  Item Select Karo
                </label>
                <select
                  className="flex h-12 w-full rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedInventoryId}
                  onChange={(e) => setSelectedInventoryId(e.target.value)}
                  required={isInventoryMode}
                >
                  <option value="" disabled>
                    Choose an item...
                  </option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (-₹{(item.sellingPricePaise / 100).toFixed(2)}
                      )
                    </option>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-indigo-900 mb-1.5 block uppercase tracking-wider">
                      Available Stock
                    </label>
                    <div className="h-12 bg-white border border-indigo-100 rounded-xl flex items-center px-4 font-bold text-slate-700">
                      {selectedItem.stockQty} {selectedItem.unit}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-indigo-900 mb-1.5 block uppercase tracking-wider">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min={
                        isDecimalAllowedForUnit(selectedItem.unit)
                          ? "0.001"
                          : "1"
                      }
                      max={selectedItem.stockQty}
                      step={
                        isDecimalAllowedForUnit(selectedItem.unit)
                          ? "0.001"
                          : "1"
                      }
                      inputMode={
                        isDecimalAllowedForUnit(selectedItem.unit)
                          ? "decimal"
                          : "numeric"
                      }
                      className="h-12 bg-white border-indigo-200 font-bold"
                      value={inventoryQty}
                      onChange={(e) => setInventoryQty(e.target.value)}
                      required={isInventoryMode}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isDecimalAllowedForUnit(selectedItem.unit)
                        ? "Decimal allowed"
                        : "Whole number only"}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-indigo-600 font-medium leading-relaxed">
                Inventory se udhaar dene par stock auto kam hoga aur customer ke
                pending balance mein amount add hoga.
              </p>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
              {isInventoryMode ? "Total Udhaar (₹)" : "Amount (₹)"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-500 font-bold">₹</span>
              </div>
              <Input
                required
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className={`pl-8 text-2xl font-bold h-14 border-slate-200 ${isInventoryMode ? "bg-slate-100 text-slate-500" : "bg-slate-50"}`}
                placeholder="0.00"
                value={formData.amount}
                onKeyDown={handleMoneyKeyDown}
                onChange={(e) => {
                  setErrorText("");
                  setFormData((p) => ({
                    ...p,
                    amount: sanitizeMoneyInput(e.target.value),
                  }));
                }}
                readOnly={isInventoryMode}
              />
            </div>
          </div>

          {/* Description Input */}
          <div className={isInventoryMode ? "hidden" : "block"}>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
              Item Details / Notes
            </label>
            <Input
              className="h-12 bg-slate-50 border-slate-200 font-medium"
              placeholder={
                isUdhaar ? "e.g. 5kg sugar, 2 rice" : "e.g. Cleared bill"
              }
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>

          {/* Due Date Input */}
          {isUdhaar && (
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                Payment kab tak lena hai? (Optional)
              </label>
              <Input
                type="date"
                className="h-12 bg-slate-50 border-slate-200 font-medium"
                value={formData.dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, dueDate: e.target.value }))
                }
              />
            </div>
          )}

          {/* Payment mode (if Payment) */}
          {!isUdhaar && (
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["cash", "upi", "card"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, paymentMode: mode as any }))
                    }
                    className={`py-3 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-colors active:scale-95 ${
                      formData.paymentMode === mode
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pb-8">
          <Button
            type="submit"
            className={`w-full text-sm uppercase tracking-widest font-bold h-14 shadow-sm active:scale-95 transition-transform ${isUdhaar ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
          >
            {isUdhaar ? "Save Udhaar" : "Save Payment"}
          </Button>
        </div>
      </form>
    </div>
  );
};
