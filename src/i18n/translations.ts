/**
 * Comprehensive Tamil & English Localization Dictionaries.
 * Tamil is the primary default language.
 * Phrased at Grade 5 reading level with cultural warmth for Tamil Nadu tea stalls & eateries.
 */

export type Language = 'ta' | 'en';

export const translations = {
  ta: {
    // App Header & Brand
    appName: 'வர்த்தகம்',
    appTagline: 'அல்ட்ரா-மாடர்ன் பில்லிங் & பிசினஸ் அட்வைசர்',
    shop: 'கடை',
    offlineMode: 'ஆஃப்லைன் முறை (இணையம் தேவையில்லை)',
    onlineMode: 'இணைக்கப்பட்டுள்ளது',

    // Nav Tabs
    tabBilling: 'பில்லிங்',
    tabOrders: 'ஆர்டர்கள்',
    tabMenu: 'பொருட்கள் & விலை',
    tabStock: 'சரக்கு',
    tabExpenses: 'செலவு',
    tabReports: 'கணக்கு / லாபம்',
    tabAdvisor: 'ஆலோசகர்',
    tabSettings: 'அமைப்புகள்',

    // Onboarding
    welcomeTitle: 'வணக்கம்! உங்கள் கடைக்கு வரவேற்கிறோம்',
    welcomeSubtitle: 'டீ கடை, இட்லி கடை, பஜ்ஜி கடைகளுக்கான எளிய கணக்கு புத்தகம்',
    selectShopType: 'உங்கள் கடை வகையை தேர்ந்தெடுக்கவும்',
    shopNameLabel: 'கடை பெயர்',
    shopNamePlaceholder: 'எ.கா: அண்ணாச்சி டீ ஸ்டால்',
    upiIdLabel: 'உங்கள் UPI ID (கூகுள் பே / போன்பே)',
    upiIdPlaceholder: 'பெயர்@வங்கி (எ.கா: murugan@okaxis)',
    upiHelp: 'வாடிக்கையாளர் இந்த QR-க்கு தான் பணம் செலுத்துவார்கள்',
    ownerPinLabel: 'ரகசிய PIN எண் (4 இலக்கங்கள்)',
    ownerPinHelp: 'லாபம் மற்றும் கணக்குகளை நீங்கள் மட்டும் பார்க்க உதவும்',
    confirmPinLabel: 'PIN எண்ணை மீண்டும் உள்ளிடவும்',
    startFreeTrial: 'இலவசமாக தொடங்கவும் (14 நாட்கள்)',
    creatingShop: 'கடை அமைக்கப்படுகிறது...',

    // Billing / Counter Sale
    counterSale: 'நேரடி கவுண்டர் விற்பனை',
    quickSaleTitle: 'விரைவு விற்பனை',
    cartEmpty: 'கூடையில் எதுவும் இல்லை. மேலே உள்ள பொருட்களை தொடவும்.',
    totalAmount: 'மொத்த தொகை',
    payModeCash: 'ரொக்கம் (Cash)',
    payModeUpi: 'யுபிஐ (UPI QR)',
    completeSale: 'விற்பனை முடிந்தது',
    clearCart: 'அழி',
    token: 'டோக்கன்',
    printBill: 'பில் அச்சிடு',

    // Orders Queue
    ordersQueue: 'சமையலறை & வாடிக்கையாளர் வரிசை',
    pendingConfirmations: 'உறுதிப்படுத்த வேண்டிய பணம்',
    noPendingOrders: 'காத்திருக்கும் ஆர்டர்கள் இல்லை',
    confirmPaymentReceived: 'பணம் வந்தது (உறுதிசெய்)',
    markServed: 'பொருள் கொடுத்தாச்சு (Served)',
    customerPaidUpi: 'UPI மூலம் செலுத்தியுள்ளார். உங்கள் வங்கியில் வந்துள்ளதா என பார்த்து உறுதிப்படுத்தவும்.',
    customerPaidCash: 'கவுண்டரில் ரொக்கமாக கொடுத்துள்ளார்.',

    // Customer Mode / Self-Billing
    welcomeCustomer: 'சுய பில்லிங் (Self-Billing)',
    scanToOrder: 'ஸ்கேன் செய்து நீங்களே ஆர்டர் செய்து பணம் செலுத்தலாம்',
    addToCart: 'சேர்',
    soldOut: 'இல்லை (Sold Out)',
    viewCart: 'ஆர்டர் கூடை பார்க்க',
    yourBill: 'உங்கள் பில் விவரம்',
    iHavePaid: 'நான் பணம் செலுத்தினேன்',
    waitingOwnerConfirm: 'கடைக்காரர் சரிபார்க்கிறார்... ஒரு நொடி பொறுக்கவும்.',
    paymentSuccess: 'பணம் பெறப்பட்டது! உங்கள் டோக்கன் தயாராகிறது.',
    pleasePayAtCounter: 'கவுண்டரில் பணம் செலுத்தி டோக்கன் பெறவும்.',
    openUpiApp: 'UPI செயலியை திறக்கவும் (GPay / PhonePe)',

    // Stock
    stockTitle: 'மூலப்பொருள் இருப்பு (Stock)',
    addMaterial: '+ புதிய பொருள் சேர்',
    materialName: 'பொருள் பெயர்',
    currentStock: 'தற்போதைய இருப்பு',
    reorderLevel: 'குறைந்தபட்ச இருப்பு',
    lowStockAlert: 'சரக்கு குறைவாக உள்ளது! உடனே வாங்கவும்.',
    quickPurchase: 'சரக்கு வாங்கிய கணக்கு பதிவு',
    purchaseQty: 'வாங்கிய அளவு',
    purchaseTotalCost: 'செலுத்திய தொகை (₹)',
    dailyClosing: 'இன்றைய கடை மூடல் (மிச்சம் & வீணானவை)',
    leftoverQty: 'இன்று மீதமான அளவு',
    supplierPhone: 'சப்ளையர் போன்',

    // Expenses
    expensesTitle: 'கடை செலவுகள்',
    addExpense: '+ புதிய செலவு சேர்',
    expenseCategory: 'செலவு வகை',
    expenseAmount: 'தொகை (₹)',
    expenseDate: 'தேதி',
    recurringExpense: 'மாதாந்திர / தொடர் செலவு (வாடகை, சம்பளம்)',
    ownerWithdrawal: 'முதலாளி சொந்த செலவுக்கு எடுத்தது (கடை செலவு அல்ல)',

    // Expense Categories
    catRawMaterials: 'மளிகை & பொருட்கள்',
    catGas: 'கேஸ் சிலிண்டர்',
    catElectricity: 'மின்சார கட்டணம் (EB)',
    catWaterCan: 'தண்ணீர் கேன்',
    catRent: 'கடை வாடகை',
    catSalary: 'வேலையாள் சம்பளம்',
    catTransport: 'போக்குவரத்து / ஆட்டோ',
    catPackaging: 'பேப்பர் கப் / பார்சல் பை',
    catRepairs: 'பழுது & பராமரிப்பு',
    catLicense: 'உரிமம் / FSSAI',
    catLoanEmi: 'கடன் வட்டி / EMI',
    catOwnerWithdrawal: 'முதலாளி சொந்த தேவைக்கு எடுத்தது',
    catOther: 'இதர செலவுகள்',

    // Reports / P&L
    reportsTitle: 'லாப நஷ்ட கணக்கு',
    todaySummary: 'இன்றைய கணக்கு',
    salesToday: 'இன்றைய விற்பனை',
    cogsToday: 'பொருட்கள் அடக்கவிலை',
    grossProfit: 'மொத்த லாபம் (Gross Profit)',
    operatingExpenses: 'கடை செலவுகள்',
    netProfit: 'நிகர லாபம் (Net Profit)',
    netLoss: 'நஷ்டம் (Net Loss)',
    lossExplanation: 'செலவுகள் விற்பனையை விட அதிகமாக உள்ளது.',
    profitCalendar: 'லாப நாள்காட்டி',
    cashVsUpi: 'ரொக்கம் vs UPI',
    exportPdf: 'PDF பதிவிறக்கு',
    exportExcel: 'Excel பதிவிறக்கு',
    shareWhatsapp: 'வாட்ஸ்அப்பில் அனுப்பு',
    enterPinToView: 'கணக்கு பார்க்க 4 இலக்க PIN உள்ளிடவும்',

    // Business Advisor
    advisorTitle: 'வணிக ஆலோசகர் (Business Advisor)',
    todaysTip: 'இன்றைய முக்கியமான யோசனை',
    insights: 'கடை ஆய்வு & ஆலோசனைகள்',
    forecastTitle: 'நாளைய கணிப்பு (தேவைப்படும் பொருட்கள்)',
    gasTrackerTitle: 'கேஸ் சிலிண்டர் பயன்பாடு',
    breakEvenTitle: 'தினசரி சமநிலை விற்பனை (Break-even)',

    // Subscription
    subscriptionTitle: 'கடை கணக்கு சந்தா',
    planDetails: 'மாதாந்திர சந்தா விவரம்',
    monthlyPrice: '₹99 / மாதம்',
    yearlyPrice: '₹999 / வருடம்',
    payViaUpi: 'எங்கள் UPI-க்கு பணம் செலுத்தவும்',
    enterUtr: 'பணம் செலுத்திய UTR / Transaction எண் உள்ளிடவும்',
    submitPayment: 'உறுதிசெய்து அனுப்பவும்',
    activateWithLink: 'செயலாக்க இணைப்பு மூலம் தொடங்கு',
    trialNotice: 'நீங்கள் 14 நாள் இலவச சோதனையில் உள்ளீர்கள்.',
    expiredNotice: 'சந்தா முடிந்தது. புதிய பில் போட முடியாது. பழைய கணக்குகளை பார்க்கலாம்.',

    // Settings
    settingsTitle: 'அமைப்புகள்',
    kioskMode: 'கவுண்டர் கியோஸ்க் முறை (வாடிக்கையாளர் பயன்பாட்டிற்கு பூட்டு)',
    backupTitle: 'Google Drive காப்புநகல் (Backup)',
    lastBackup: 'கடைசி பேக்கப்',
    backupNow: 'இப்போதே Backup எடு',
    restoreBackup: 'Backup-லிருந்து மீட்டெடு',
    qrSticker: 'கடை QR ஸ்டிக்கர் அச்சிடு (PDF)',
    languageToggle: 'English-க்கு மாற்றுக',
    pinReset: 'PIN எண் மாற்று',

    // Common Buttons & Messages
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    delete: 'நீக்கு',
    edit: 'திருத்து',
    confirm: 'உறுதிசெய்',
    back: 'பின்னால்',
    next: 'அடுத்து',
    loading: 'காத்திருக்கவும்...',
    success: 'வெற்றி!',
    error: 'பிழை ஏற்பட்டது',
  },

  en: {
    // App Header & Brand
    appName: 'VARTHAGAM',
    appTagline: 'Ultra-Modern Billing & Business Advisor',
    shop: 'Shop',
    offlineMode: 'Offline Mode (No Internet Needed)',
    onlineMode: 'Connected',

    // Nav Tabs
    tabBilling: 'Billing',
    tabOrders: 'Orders',
    tabMenu: 'Menu & Prices',
    tabStock: 'Stock',
    tabExpenses: 'Expenses',
    tabReports: 'P&L Reports',
    tabAdvisor: 'Advisor',
    tabSettings: 'Settings',

    // Onboarding
    welcomeTitle: 'Welcome! Setup your shop',
    welcomeSubtitle: 'Simple billing & profit manager for tea & food stalls',
    selectShopType: 'Select your stall category',
    shopNameLabel: 'Shop Name',
    shopNamePlaceholder: 'e.g. Annachi Tea Stall',
    upiIdLabel: 'Your UPI ID (GPay / PhonePe / Paytm)',
    upiIdPlaceholder: 'name@bank (e.g. murugan@okaxis)',
    upiHelp: 'Customers will scan and pay directly to this UPI ID',
    ownerPinLabel: 'Owner Secret PIN (4 digits)',
    ownerPinHelp: 'Protects your profit numbers and settings from staff',
    confirmPinLabel: 'Re-enter 4-digit PIN',
    startFreeTrial: 'Start Free 14-Day Trial',
    creatingShop: 'Setting up stall...',

    // Billing / Counter Sale
    counterSale: 'Counter Quick Sale',
    quickSaleTitle: 'Quick Sale',
    cartEmpty: 'Cart is empty. Tap items above to add.',
    totalAmount: 'Total Amount',
    payModeCash: 'Cash',
    payModeUpi: 'UPI QR',
    completeSale: 'Complete Sale',
    clearCart: 'Clear',
    token: 'Token',
    printBill: 'Print Bill',

    // Orders Queue
    ordersQueue: 'Kitchen & Customer Queue',
    pendingConfirmations: 'Pending Payment Confirmations',
    noPendingOrders: 'No pending orders',
    confirmPaymentReceived: 'Confirm Payment Received',
    markServed: 'Mark as Served',
    customerPaidUpi: 'Customer paid via UPI. Verify on your phone/soundbox before confirming.',
    customerPaidCash: 'Customer is paying cash at counter.',

    // Customer Mode / Self-Billing
    welcomeCustomer: 'Customer Self-Billing',
    scanToOrder: 'Scan, order and pay directly with your UPI app',
    addToCart: 'Add',
    soldOut: 'Sold Out',
    viewCart: 'View Order Cart',
    yourBill: 'Your Bill Summary',
    iHavePaid: 'I Have Paid',
    waitingOwnerConfirm: 'Shop owner is verifying your payment... Please hold on.',
    paymentSuccess: 'Payment confirmed! Preparing your token.',
    pleasePayAtCounter: 'Please pay at the counter and collect your token.',
    openUpiApp: 'Open UPI App (GPay / PhonePe / Paytm)',

    // Stock
    stockTitle: 'Raw Materials & Stock',
    addMaterial: '+ Add Material',
    materialName: 'Item Name',
    currentStock: 'Current Stock',
    reorderLevel: 'Reorder Level',
    lowStockAlert: 'Low Stock Alert! Time to buy.',
    quickPurchase: 'Log Purchase Entry',
    purchaseQty: 'Quantity Bought',
    purchaseTotalCost: 'Total Paid (₹)',
    dailyClosing: 'Daily Closing (Leftovers & Wastage)',
    leftoverQty: 'Quantity Leftover Today',
    supplierPhone: 'Supplier Contact',

    // Expenses
    expensesTitle: 'Shop Operating Expenses',
    addExpense: '+ Add Expense',
    expenseCategory: 'Expense Category',
    expenseAmount: 'Amount (₹)',
    expenseDate: 'Date',
    recurringExpense: 'Recurring Monthly Cost (Rent, Salary)',
    ownerWithdrawal: "Owner's Personal Withdrawal (Not an operating expense)",

    // Expense Categories
    catRawMaterials: 'Provisions & Ingredients',
    catGas: 'Commercial LPG Cylinder',
    catElectricity: 'Electricity Bill (EB)',
    catWaterCan: 'Water Cans',
    catRent: 'Stall Rent',
    catSalary: 'Helper / Master Salary',
    catTransport: 'Transport / Auto',
    catPackaging: 'Paper Cups & Packaging',
    catRepairs: 'Repairs & Maintenance',
    catLicense: 'License / FSSAI',
    catLoanEmi: 'Loan Interest / EMI',
    catOwnerWithdrawal: "Owner's Personal Withdrawal",
    catOther: 'Other Expenses',

    // Reports / P&L
    reportsTitle: 'Profit & Loss Statement',
    todaySummary: "Today's Ledger",
    salesToday: "Today's Sales",
    cogsToday: 'Cost of Goods (COGS)',
    grossProfit: 'Gross Profit',
    operatingExpenses: 'Operating Expenses',
    netProfit: 'Net Profit',
    netLoss: 'Net Loss',
    lossExplanation: 'Expenses exceeded revenue today.',
    profitCalendar: 'Profit Calendar',
    cashVsUpi: 'Cash vs UPI Mix',
    exportPdf: 'Download PDF',
    exportExcel: 'Download Excel',
    shareWhatsapp: 'Share via WhatsApp',
    enterPinToView: 'Enter 4-digit PIN to view profits',

    // Business Advisor
    advisorTitle: 'Business Advisor',
    todaysTip: "Today's Key Actionable Tip",
    insights: 'Analytics & Recommendations',
    forecastTitle: "Tomorrow's Prep Forecast",
    gasTrackerTitle: 'Gas Cylinder Efficiency Tracker',
    breakEvenTitle: 'Daily Break-Even Revenue',

    // Subscription
    subscriptionTitle: 'Kadai Kanakku Subscription',
    planDetails: 'Monthly Subscription Details',
    monthlyPrice: '₹99 / month',
    yearlyPrice: '₹999 / year',
    payViaUpi: 'Pay to our Admin UPI QR',
    enterUtr: 'Enter 12-digit UTR / Transaction ID',
    submitPayment: 'Submit Verification Request',
    activateWithLink: 'Activate via WhatsApp Link',
    trialNotice: 'You are on a 14-day free trial.',
    expiredNotice: 'Subscription ended. Read-only mode active. Renew to take new bills.',

    // Settings
    settingsTitle: 'Settings',
    kioskMode: 'Counter Kiosk Mode (Lock tablet for customer self-ordering)',
    backupTitle: 'Google Drive Backup',
    lastBackup: 'Last Backup',
    backupNow: 'Backup Now to Drive',
    restoreBackup: 'Restore from Drive Backup',
    qrSticker: 'Print Shop QR Sticker (PDF)',
    languageToggle: 'தமிழுக்கு மாற்றவும்',
    pinReset: 'Change Owner PIN',

    // Common Buttons & Messages
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    loading: 'Loading...',
    success: 'Success!',
    error: 'Error occurred',
  }
};
