import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChefHat,
  Volume2,
  ShieldAlert,
  XCircle,
  Sparkles,
  Receipt,
  QrCode,
  Banknote,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { db, OrderBill } from '../../db/db';
import { formatPaise } from '../../lib/money';
import { feedback } from '../../lib/feedback';
import { relay, RelayOrder } from '../../lib/relay';

export const OrdersQueueView: React.FC = () => {
  const { settings, language, t, refreshShopData, items, getNextTokenNumber } = useShop();

  const [orders, setOrders] = useState<OrderBill[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'kitchen' | 'served'>('pending');
  const prevPendingCountRef = useRef<number>(0);

  const loadOrders = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysOrders = await db.orders
      .where('dateKey')
      .equals(todayStr)
      .reverse()
      .sortBy('createdAt');
    setOrders(todaysOrders);

    const pendingNow = todaysOrders.filter(o => o.state === 'pending').length;
    if (pendingNow > prevPendingCountRef.current) {
      // New incoming order detected! Play loud penetrating chime
      feedback.playLoudOrderAlert();
    }
    prevPendingCountRef.current = pendingNow;
  };

  useEffect(() => {
    loadOrders();

    // Local interval to check for incoming orders (10s battery-friendly interval)
    const localPollInterval = setInterval(() => {
      loadOrders();
    }, 10000);

    // If Tier 1 Cloud Relay is active, subscribe to incoming cloud orders
    let unsubscribeRelay: (() => void) | undefined;
    if (settings && relay.isAvailable()) {
      unsubscribeRelay = relay.listenToOrders(settings.shopCode, async (relayOrders: RelayOrder[]) => {
        let hasNew = false;

        for (const ro of relayOrders) {
          if (!ro.id) continue;
          const exists = await db.orders.get(ro.id);

          if (!exists) {
            hasNew = true;
            let parsedItems: Array<{ id: string; qty: number }> = [];
            try {
              parsedItems = JSON.parse(ro.items || '[]');
            } catch (e) {}

            let recomputedTotalPaise = 0;
            let flaggedTampered = false;

            const orderLines = parsedItems.map(pi => {
              const localItem = items.find(i => i.id === pi.id);
              const pricePaise = localItem ? localItem.pricePaise : 0;
              const lineTotal = pricePaise * pi.qty;
              recomputedTotalPaise += lineTotal;

              return {
                itemId: pi.id,
                nameTa: localItem?.nameTa || 'பொருள்',
                nameEn: localItem?.nameEn || 'Item',
                pricePaise,
                qty: pi.qty,
                totalPaise: lineTotal,
              };
            });

            if (ro.totalPaise && ro.totalPaise !== recomputedTotalPaise) {
              flaggedTampered = true;
            }

            const todayStr = new Date().toISOString().split('T')[0];

            await db.orders.put({
              id: ro.id,
              tokenNumber: 'சரிபார்க்கிறது...',
              items: orderLines,
              totalPaise: recomputedTotalPaise,
              payMode: ro.payMode,
              state: ro.state,
              source: 'customer_phone',
              createdAt: ro.createdAt,
              dateKey: todayStr,
              customerUid: ro.customerUid,
              flaggedTampered,
            });
          }
        }

        if (hasNew) {
          feedback.playLoudOrderAlert();
          await loadOrders();
          await refreshShopData();
        }
      });
    }

    return () => {
      clearInterval(localPollInterval);
      if (unsubscribeRelay) unsubscribeRelay();
    };
  }, [settings?.shopCode, items]);

  // Shop Owner Approves and Generates the Official Bill & Token
  const approveAndGenerateBill = async (orderId: string) => {
    const nextToken = await getNextTokenNumber();
    const now = Date.now();

    await db.orders.update(orderId, {
      state: 'confirmed',
      tokenNumber: nextToken,
      confirmedAt: now,
    });

    if (settings && relay.isAvailable()) {
      await relay.updateOrderState(settings.shopCode, orderId, 'confirmed', nextToken);
    }

    feedback.playPaymentSuccessTone();
    feedback.vibrate([100, 50, 100]);
    await loadOrders();
    await refreshShopData();
  };

  // Reject fake or unpaid order
  const rejectOrder = async (orderId: string) => {
    if (!window.confirm(language === 'ta' ? 'இந்த ஆர்டரை நிராகரிக்க விரும்புகிறீர்களா?' : 'Reject this order?')) {
      return;
    }
    await db.orders.update(orderId, { state: 'cancelled' });
    if (settings && relay.isAvailable()) {
      await relay.updateOrderState(settings.shopCode, orderId, 'cancelled');
    }
    feedback.vibrate(80);
    await loadOrders();
    await refreshShopData();
  };

  const markServed = async (orderId: string) => {
    const now = Date.now();
    await db.orders.update(orderId, { state: 'served', servedAt: now });

    if (settings && relay.isAvailable()) {
      await relay.updateOrderState(settings.shopCode, orderId, 'served');
      await relay.deleteOrder(settings.shopCode, orderId);
    }

    feedback.vibrate(100);
    await loadOrders();
    await refreshShopData();
  };

  const pendingOrders = orders.filter(o => o.state === 'pending');
  const kitchenOrders = orders.filter(o => o.state === 'confirmed');
  const servedOrders = orders.filter(o => o.state === 'served').slice(0, 30);

  return (
    <div className="pb-32 max-w-4xl mx-auto px-2 sm:px-4">
      {/* Sound Chime Test & Audio Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3 mb-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-brand-700" />
          <h2 className="font-bold text-slate-800 text-base sm:text-lg">
            {t.ordersQueue}
          </h2>
        </div>
        <button
          onClick={() => feedback.playLoudOrderAlert()}
          className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 touch-target active:scale-95 transition"
        >
          <Volume2 className="w-4 h-4 text-amber-600" />
          <span>{language === 'ta' ? 'சவுண்ட் பாக்ஸ் ஒலி சோதனை' : 'Test Loud Soundbox'}</span>
        </button>
      </div>

      {/* Unconfirmed UPI Alert Banner */}
      {pendingOrders.some(o => o.payMode === 'upi') && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-700 text-white flex items-center gap-3 shadow-crimson-sm animate-pulse">
          <AlertTriangle className="w-7 h-7 flex-shrink-0 text-amber-200" />
          <div>
            <h4 className="font-black text-sm sm:text-base">
              {language === 'ta'
                ? 'வாடிக்கையாளர் ஜிபே / UPI பணம் சரிபார்க்கப்பட வேண்டும்!'
                : 'Pending Google Pay / UPI customer orders!'}
            </h4>
            <p className="text-xs text-amber-100">
              {language === 'ta'
                ? 'உங்கள் வங்கி செயலி அல்லது சவுண்ட்பாக்ஸில் பணம் வந்துள்ளதை உறுதிசெய்து பில் உருவாக்கவும்.'
                : 'Verify receipt on your GPay/bank soundbox, then tap "Approve & Generate Bill".'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition touch-target ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {language === 'ta' ? 'அனுமதி & பில்' : 'Pending Approval'} ({pendingOrders.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kitchen')}
          className={`py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition touch-target ${
            activeTab === 'kitchen'
              ? 'bg-brand-900 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>
            {language === 'ta' ? 'தயாரிப்பு (Kitchen)' : 'Kitchen'} ({kitchenOrders.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('served')}
          className={`py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition touch-target ${
            activeTab === 'served'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {language === 'ta' ? 'முடிந்தது' : 'Served'} ({servedOrders.length})
          </span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {/* TAB 1: PENDING APPROVAL (Shop Owner must verify and tap Approve & Generate Bill) */}
        {activeTab === 'pending' && (
          pendingOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-bold text-sm">
                {language === 'ta' ? 'சரிபார்க்க வேண்டிய ஆர்டர்கள் எதுவும் இல்லை' : 'No orders waiting for approval'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ta' ? 'வாடிக்கையாளர் கியோஸ்க்கில் ஆர்டர் போட்டதும் ஒலி எழும்' : 'Soundbox will ring when customers self-bill'}
              </p>
            </div>
          ) : (
            pendingOrders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 border-2 border-amber-400 shadow-md relative overflow-hidden animate-in fade-in"
              >
                {order.flaggedTampered && (
                  <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 mb-2 rounded-xl flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span>விலை திருத்தம் கண்டறியப்பட்டது! உள்ளூர் விலையில் கணக்கிடப்பட்டுள்ளது.</span>
                  </div>
                )}

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                      {order.source === 'kiosk' ? 'கியோஸ்க் சுய பில்' : 'வாடிக்கையாளர் போன்'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-500 mt-1 font-mono">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 ${
                        order.payMode === 'upi'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      {order.payMode === 'upi' ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                      <span>{order.payMode === 'upi' ? 'GOOGLE PAY / UPI' : 'ரொக்கம் (CASH)'}</span>
                    </span>
                    <div className="text-2xl font-black text-slate-950 mt-1 font-mono">
                      {formatPaise(order.totalPaise)}
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="bg-slate-50 rounded-2xl p-3 mb-4 space-y-1.5 border border-slate-200/80">
                  {order.items.map(item => (
                    <div key={item.itemId} className="flex justify-between text-sm">
                      <span className="font-bold text-slate-800">
                        {language === 'ta' ? item.nameTa : item.nameEn} <span className="text-brand-800 font-extrabold">x {item.qty}</span>
                      </span>
                      <span className="font-mono text-slate-600 font-bold">{formatPaise(item.totalPaise)}</span>
                    </div>
                  ))}
                </div>

                {/* Approval & Rejection Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => rejectOrder(order.id)}
                    className="w-1/3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 touch-target active:scale-95 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{language === 'ta' ? 'நிராகரி' : 'Reject'}</span>
                  </button>

                  <button
                    onClick={() => approveAndGenerateBill(order.id)}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 touch-target active:scale-95 transition"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>{language === 'ta' ? '✅ பில் உருவாக்குக & அனுமதி' : '✅ Approve & Generate Bill'}</span>
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {/* TAB 2: KITCHEN PREPARATION QUEUE */}
        {activeTab === 'kitchen' && (
          kitchenOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
              <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-bold text-sm">
                {language === 'ta' ? 'சமையலறை வரிசை காலியாக உள்ளது' : 'Kitchen queue is empty'}
              </p>
            </div>
          ) : (
            kitchenOrders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 border-2 border-brand-300 shadow-sm"
              >
                <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase">{language === 'ta' ? 'டோக்கன்' : 'Token'}</span>
                    <h3 className="text-3xl font-black text-brand-900 font-mono tracking-wider">
                      {order.tokenNumber}
                    </h3>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-900 font-black px-3 py-1 rounded-full font-mono">
                    {formatPaise(order.totalPaise)}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 mb-4 space-y-2 border border-slate-100">
                  {order.items.map(item => (
                    <div key={item.itemId} className="flex justify-between font-bold text-base text-slate-800">
                      <span>{language === 'ta' ? item.nameTa : item.nameEn}</span>
                      <span className="text-brand-800 text-lg font-black">x {item.qty}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => markServed(order.id)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-2xl shadow flex items-center justify-center gap-2 touch-target active:scale-95 transition"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>{t.markServed}</span>
                </button>
              </div>
            ))
          )
        )}

        {/* TAB 3: SERVED ORDERS */}
        {activeTab === 'served' && (
          servedOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
              <p className="text-slate-500 font-bold text-sm">
                {language === 'ta' ? 'இன்று முடிவடைந்த ஆர்டர்கள் இல்லை' : 'No served orders yet today'}
              </p>
            </div>
          ) : (
            servedOrders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 flex justify-between items-center opacity-85"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-slate-900 font-mono">{order.tokenNumber}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {order.items.map(i => `${i.nameTa} (${i.qty})`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-slate-900 font-mono">
                    {formatPaise(order.totalPaise)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{order.payMode}</p>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
