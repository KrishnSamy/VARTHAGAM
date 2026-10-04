import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { CustomerSelfBillView } from '../customer/CustomerSelfBillView';
import { PinModal } from '../../components/PinModal';

interface Props {
  onExitKiosk: () => void;
}

export const CounterKioskView: React.FC<Props> = ({ onExitKiosk }) => {
  const { settings, language } = useShop();
  const [showPinModal, setShowPinModal] = useState(false);

  return (
    <div className="relative min-h-screen bg-slate-100">
      {/* Discreet Exit Lock Button in Corner (Requires PIN) */}
      <button
        onClick={() => setShowPinModal(true)}
        className="fixed top-3 right-3 z-50 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition touch-target opacity-40 hover:opacity-100"
        title="Exit Self-Billing Mode"
      >
        <Lock className="w-5 h-5" />
      </button>

      {/* Customer Interface */}
      <CustomerSelfBillView shopCode={settings?.shopCode || 'KK-LOCAL'} />

      {/* PIN Verification Modal */}
      <PinModal
        isOpen={showPinModal}
        titleTa="சுய பில்லிங் முறையிலிருந்து வெளியேற PIN"
        titleEn="Enter Owner PIN to Exit Self-Billing Mode"
        onSuccess={() => {
          setShowPinModal(false);
          onExitKiosk();
        }}
        onCancel={() => setShowPinModal(false)}
      />
    </div>
  );
};
