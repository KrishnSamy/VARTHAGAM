/**
 * Local Deterministic Business Advisor Engine for Kadai Kanakku (Section 5.9).
 * Contains 40+ rule-based triggers analyzing sales, stock, expenses, margins, gas, and seasons
 * without paid AI or internet connectivity.
 * Language is warm, actionable, respectful (Grade 5 reading level in Tamil & English).
 */

export interface AdvisorContext {
  todaySalesPaise: number;
  todayCogsPaise: number;
  todayGrossProfitPaise: number;
  todayExpensesPaise: number;
  todayNetProfitPaise: number;
  todayWastagePaise: number;
  todayBillsCount: number;
  cashSalesPaise: number;
  upiSalesPaise: number;
  unconfirmedUpiCount: number;
  lowStockItems: Array<{ nameTa: string; nameEn: string; current: number; reorder: number; unit: string }>;
  gasCylindersAvgDays: number;
  currentGasDays: number;
  hasActiveGasAlert: boolean;
  topSellingItems: Array<{ nameTa: string; nameEn: string; soldQty: number; marginPct: number }>;
  slowSellingItems: Array<{ nameTa: string; nameEn: string; soldQty: number }>;
  wastagePercentage: number;
  subscriptionDaysRemaining: number;
  isSubscriptionExpired: boolean;
  currentMonth: number; // 0-11
  currentHour: number; // 0-23
  isRainingSeason?: boolean;
}

export interface AdvisorTip {
  id: string;
  category: 'pricing' | 'stock' | 'operations' | 'wastage' | 'gas' | 'season' | 'legal' | 'subscription' | 'closing';
  priority: 'high' | 'medium' | 'low';
  titleTa: string;
  titleEn: string;
  textTa: string;
  textEn: string;
  whyTa: string;
  whyEn: string;
  actionRoute?: string;
  actionLabelTa?: string;
  actionLabelEn?: string;
}

export const ADVISOR_RULES: Array<{
  id: string;
  category: AdvisorTip['category'];
  priority: AdvisorTip['priority'];
  evaluate: (ctx: AdvisorContext) => boolean;
  generate: (ctx: AdvisorContext) => AdvisorTip;
}> = [
  // 1. Subscription Expiring Soon (1 Day)
  {
    id: 'sub-exp-1d',
    category: 'subscription',
    priority: 'high',
    evaluate: ctx => ctx.subscriptionDaysRemaining === 1 && !ctx.isSubscriptionExpired,
    generate: () => ({
      id: 'sub-exp-1d',
      category: 'subscription',
      priority: 'high',
      titleTa: '⚠️ சந்தா காலம் நாளை முடிகிறது!',
      titleEn: '⚠️ Subscription ends tomorrow!',
      textTa: 'கடை கணக்கு செயலி தடையின்றி இயங்க இன்றே சந்தாவை புதுப்பிக்கவும்.',
      textEn: 'Renew your subscription today so billing continues uninterrupted.',
      whyTa: 'உங்கள் கடை கணக்கு சந்தா நாளையுடன் முடிவடைகிறது.',
      whyEn: 'Your active subscription plan expires tomorrow.',
      actionRoute: 'subscription',
      actionLabelTa: 'சந்தா புதுப்பிக்க',
      actionLabelEn: 'Renew Plan'
    })
  },

  // 2. Subscription Expiring (3 Days)
  {
    id: 'sub-exp-3d',
    category: 'subscription',
    priority: 'high',
    evaluate: ctx => ctx.subscriptionDaysRemaining <= 3 && ctx.subscriptionDaysRemaining > 1,
    generate: ctx => ({
      id: 'sub-exp-3d',
      category: 'subscription',
      priority: 'high',
      titleTa: `⏳ சந்தா முடிய ${ctx.subscriptionDaysRemaining} நாட்கள் மட்டுமே உள்ளது`,
      titleEn: `⏳ Only ${ctx.subscriptionDaysRemaining} days left in subscription`,
      textTa: 'எளிய UPI QR மூலம் ரூ.99 செலுத்தி உடனடியாக 1 மாதத்திற்கு நீட்டிக்கவும்.',
      textEn: 'Pay ₹99 via UPI QR to extend your access for another full month.',
      whyTa: 'சந்தா காலக்கெடு நெருங்குவதால் நினைவூட்டல் அனுப்பப்படுகிறது.',
      whyEn: 'Proactive reminder before billing switches to read-only.',
      actionRoute: 'subscription',
      actionLabelTa: 'கட்டணம் செலுத்த',
      actionLabelEn: 'Pay Now'
    })
  },

  // 3. Subscription Expiring (7 Days)
  {
    id: 'sub-exp-7d',
    category: 'subscription',
    priority: 'medium',
    evaluate: ctx => ctx.subscriptionDaysRemaining <= 7 && ctx.subscriptionDaysRemaining > 3,
    generate: ctx => ({
      id: 'sub-exp-7d',
      category: 'subscription',
      priority: 'medium',
      titleTa: `📅 சந்தா நினைவூட்டல்: ${ctx.subscriptionDaysRemaining} நாட்கள் உள்ளது`,
      titleEn: `📅 Renewal notice: ${ctx.subscriptionDaysRemaining} days remaining`,
      textTa: 'இந்த மாதம் உங்கள் கடை கணக்கு சீராக பதிவாகியுள்ளது. அடுத்த மாதத்திற்கு முன்கூட்டியே புதுப்பிக்கலாம்.',
      textEn: 'Your shop accounts were smoothly tracked this month. You can renew early anytime.',
      whyTa: 'ஒரு வாரத்திற்கு முந்தைய முன்னெச்சரிக்கை அறிவிப்பு.',
      whyEn: 'Early 7-day advance heads-up.',
      actionRoute: 'subscription',
      actionLabelTa: 'விவரம் பார்க்க',
      actionLabelEn: 'View Details'
    })
  },

  // 4. Unconfirmed UPI orders at closing
  {
    id: 'unconfirmed-upi',
    category: 'closing',
    priority: 'high',
    evaluate: ctx => ctx.unconfirmedUpiCount > 0,
    generate: ctx => ({
      id: 'unconfirmed-upi',
      category: 'closing',
      priority: 'high',
      titleTa: `⚠️ ${ctx.unconfirmedUpiCount} UPI ஆர்டர்கள் உறுதிப்படுத்தப்படாமல் உள்ளன`,
      titleEn: `⚠️ ${ctx.unconfirmedUpiCount} unconfirmed UPI orders pending`,
      textTa: 'கடையை மூடும் முன் உங்கள் வங்கி செயலி அல்லது சவுண்ட்பாக்ஸில் பணம் வந்துள்ளதா என சரிபார்க்கவும்.',
      textEn: 'Check your banking app or soundbox to verify receipt before closing for the day.',
      whyTa: 'வாடிக்கையாளர் நான் பணம் செலுத்தினேன் என்று கூறிய ஆர்டர்கள் இன்னும் நீங்கள் உறுதி செய்யவில்லை.',
      whyEn: 'Customer tapped paid, but owner has not tapped confirm.',
      actionRoute: 'orders',
      actionLabelTa: 'ஆர்டர்களை சரிபார்க்க',
      actionLabelEn: 'Review Orders'
    })
  },

  // 5. Critical Low Stock Alert
  {
    id: 'critical-low-stock',
    category: 'stock',
    priority: 'high',
    evaluate: ctx => ctx.lowStockItems.length > 0,
    generate: ctx => ({
      id: 'critical-low-stock',
      category: 'stock',
      priority: 'high',
      titleTa: `🚨 ${ctx.lowStockItems.length} பொருட்கள் இருப்பு தீரும் நிலையில் உள்ளது!`,
      titleEn: `🚨 ${ctx.lowStockItems.length} raw materials below reorder level!`,
      textTa: `${ctx.lowStockItems.map(i => i.nameTa).join(', ')} இருப்பு குறைவாக உள்ளது. காலை வியாபாரத்திற்கு முன் இன்றே வாங்கவும்.`,
      textEn: `${ctx.lowStockItems.map(i => i.nameEn).join(', ')} low in stock. Restock before tomorrow morning rush.`,
      whyTa: 'பொருளின் இருப்பு நீங்கள் குறிப்பிட்ட குறைந்தபட்ச அளவை விட குறைந்துள்ளது.',
      whyEn: 'Current inventory dropped below your custom reorder threshold.',
      actionRoute: 'stock',
      actionLabelTa: 'சரக்கு பார்க்க',
      actionLabelEn: 'View Stock'
    })
  },

  // 6. Gas cylinder finishing too fast
  {
    id: 'gas-leak-check',
    category: 'gas',
    priority: 'high',
    evaluate: ctx => ctx.hasActiveGasAlert,
    generate: ctx => ({
      id: 'gas-leak-check',
      category: 'gas',
      priority: 'high',
      titleTa: '🔥 கேஸ் சிலிண்டர் வழக்கத்தை விட வேகமாக தீர்கிறது!',
      titleEn: '🔥 LPG cylinder lasting fewer days than usual!',
      textTa: 'உங்கள் முந்தைய சிலிண்டர் சராசரியை விட 20% குறைவான நாட்களில் தீர்ந்துள்ளது. பர்னர் மற்றும் டியூப் கசிவை உடனே சோதிக்கவும்.',
      textEn: 'Cylinder lasted 20% fewer days than your shop average. Inspect burners and hose for gas leaks.',
      whyTa: 'வழக்கமான ஆயுளை விட சிலிண்டர் சீக்கிரமாக காலியாகியுள்ளது.',
      whyEn: 'Consumption rate spiked significantly compared to historical average.',
      actionRoute: 'expenses',
      actionLabelTa: 'கேஸ் கணக்கு பார்க்க',
      actionLabelEn: 'Check Gas Log'
    })
  },

  // 7. Daily net loss alert (Kind, constructive guidance)
  {
    id: 'daily-net-loss',
    category: 'operations',
    priority: 'high',
    evaluate: ctx => ctx.todayBillsCount >= 5 && ctx.todayNetProfitPaise < 0,
    generate: () => ({
      id: 'daily-net-loss',
      category: 'operations',
      priority: 'high',
      titleTa: '💡 இன்று செலவு விற்பனையை விட அதிகமாகியுள்ளது',
      titleEn: '💡 Expenses exceeded sales today',
      textTa: 'கவலை வேண்டாம்! மொத்தமாக சரக்கு வாங்கிய நாட்களிலோ அல்லது மழை நாட்களிலோ இது இயல்பு. வரவிருக்கும் நாட்களில் சரக்கு பயன்பாட்டால் லாபம் கூடும்.',
      textEn: "Do not worry! This happens when buying bulk inventory or during slow rains. Normalizes as stock is sold.",
      whyTa: 'இன்றைய பதிவான செலவுகள் இன்றைய மொத்த விற்பனையை விட அதிகமாக உள்ளது.',
      whyEn: 'Today operating expenses/purchases were higher than total revenue.',
      actionRoute: 'reports',
      actionLabelTa: 'கணக்கு பார்க்க',
      actionLabelEn: 'View Reports'
    })
  },

  // 8. High wastage alert (>10%)
  {
    id: 'high-wastage-alert',
    category: 'wastage',
    priority: 'medium',
    evaluate: ctx => ctx.wastagePercentage > 10,
    generate: ctx => ({
      id: 'high-wastage-alert',
      category: 'wastage',
      priority: 'medium',
      titleTa: `📉 பொருட்கள் வீணாவது ${ctx.wastagePercentage}% ஆக உள்ளது`,
      titleEn: `📉 Wastage is at ${ctx.wastagePercentage}% today`,
      textTa: 'மாவு, பால் அல்லது வடை தயாரிப்பை 15% குறைத்து தயாரிக்கவும். தேவைக்கேற்ப அவ்வப்போது சுடுவது லாபத்தை உயர்த்தும்.',
      textEn: 'Reduce batch preparation by 15%. Frying snacks in smaller batches on demand saves money.',
      whyTa: 'கடை மூடல் பதிவின்படி தயாரிக்கப்பட்டதில் 10%-க்கும் அதிகமான பொருட்கள் விற்காமல் வீணாகியுள்ளது.',
      whyEn: 'Closing stock logs show over 10% spoiled or unsold leftovers.',
      actionRoute: 'stock',
      actionLabelTa: 'மிச்சம் பதிவு செய்',
      actionLabelEn: 'Log Leftovers'
    })
  },

  // 9. Morning Rush Preparation (6 AM - 8 AM)
  {
    id: 'morning-rush-prep',
    category: 'operations',
    priority: 'medium',
    evaluate: ctx => ctx.currentHour >= 6 && ctx.currentHour <= 8,
    generate: () => ({
      id: 'morning-rush-prep',
      category: 'operations',
      priority: 'medium',
      titleTa: '🌅 காலை நேர நெரிசல் நேரம் (Peak Hours)',
      titleEn: '🌅 Morning Rush Hour Ready',
      textTa: 'காலை 7 முதல் 9 மணி வரை டீ, இட்லி வியாபாரம் அதிகம் இருக்கும். சில்லறை காசுகள் மற்றும் பார்சல் பைகளை முன்கூட்டியே எடுத்து வைக்கவும்.',
      textEn: '7 to 9 AM is peak tea and tiffin time. Keep change coins and parcel covers handy.',
      whyTa: 'காலை நேர வியாபார வேளையை சுலபமாக்கும் குறிப்பு.',
      whyEn: 'Time-based guidance for morning footfall peak.',
      actionRoute: 'billing',
      actionLabelTa: 'பில்லிங் திறக்க',
      actionLabelEn: 'Open Billing'
    })
  },

  // 10. Evening Snack Rush Preparation (4 PM - 6 PM)
  {
    id: 'evening-snack-rush',
    category: 'operations',
    priority: 'medium',
    evaluate: ctx => ctx.currentHour >= 16 && ctx.currentHour <= 18,
    generate: () => ({
      id: 'evening-snack-rush',
      category: 'operations',
      priority: 'medium',
      titleTa: '☕ மாலை நேர டீ & பஜ்ஜி வியாபாரம்',
      titleEn: '☕ Evening Tea & Snack Rush',
      textTa: 'சூடான பஜ்ஜி, சமோசா, போண்டாக்களை முன்பக்க கண்ணாடி தட்டில் கண்ணில் படும்படி வைக்கவும். டீயுடன் சேர்த்து கேட்கும் வாடிக்கையாளர்கள் அதிகம்.',
      textEn: 'Keep hot bajjis, bondas in the front glass display. Customers ordering tea naturally add a snack.',
      whyTa: 'மாலை நேர பலகார வியாபாரத்தை ஊக்குவிக்கும் வழிகாட்டல்.',
      whyEn: 'Proven display merchandising practice for evening tea rush.'
    })
  },

  // 11. Rainy Season Snack Sales
  {
    id: 'rainy-season-snack',
    category: 'season',
    priority: 'medium',
    evaluate: ctx => (ctx.currentMonth >= 9 && ctx.currentMonth <= 11) || ctx.isRainingSeason === true, // Oct-Dec NE Monsoon
    generate: () => ({
      id: 'rainy-season-snack',
      category: 'season',
      priority: 'medium',
      titleTa: '🌧️ மழைக்கால வாய்ப்பு: சூடான பஜ்ஜி & சுக்கு காபி!',
      titleEn: '🌧️ Monsoon Trend: Hot Bajji & Sukku Coffee',
      textTa: 'மழை மற்றும் குளிர் நேரத்தில் காரசாரமான மிளகாய் பஜ்ஜி மற்றும் சுக்கு காபிக்கு நல்ல வரவேற்பு இருக்கும். கூடுதல் மாவு தயார் செய்யலாம்.',
      textEn: 'Monsoon cool weather drives demand for spicy chilli bajji and sukku coffee. Prepare extra batter.',
      whyTa: 'தமிழ்நாடு வடகிழக்கு பருவமழை காலத்திற்கான பருவகால யோசனை.',
      whyEn: 'Seasonal monsoon consumption behavior in Tamil Nadu.'
    })
  },

  // 12. Summer Refreshment (March - June)
  {
    id: 'summer-refreshment',
    category: 'season',
    priority: 'medium',
    evaluate: ctx => ctx.currentMonth >= 2 && ctx.currentMonth <= 5, // Mar-June
    generate: () => ({
      id: 'summer-refreshment',
      category: 'season',
      priority: 'medium',
      titleTa: '☀️ கோடைகால யோசனை: நீர்மோர் & எலுமிச்சை சாறு',
      titleEn: '☀️ Summer Tip: Buttermilk & Lemon Juice',
      textTa: 'வெயில் காலத்தில் சூடான பானங்களுடன் குளிர்ந்த நீர்மோர் அல்லது நன்னாரி சர்பத் வைத்தால் மதிய நேர வியாபாரம் கூடும்.',
      textEn: 'Offer cold spiced buttermilk or lemon juice to attract afternoon footfall during hot months.',
      whyTa: 'கோடை வெப்பத்தை முன்னிட்டு வாடிக்கையாளர் விருப்பத்திற்கேற்ப புதிய பொருள் யோசனை.',
      whyEn: 'Summer heat creates high margin demand for cold traditional drinks.'
    })
  },

  // 13. High Volume Low Margin Combo Suggestion
  {
    id: 'bundle-combo-tip',
    category: 'pricing',
    priority: 'medium',
    evaluate: ctx => ctx.topSellingItems.some(i => i.marginPct < 35),
    generate: ctx => {
      const lowMarginItem = ctx.topSellingItems.find(i => i.marginPct < 35);
      return {
        id: 'bundle-combo-tip',
        category: 'pricing',
        priority: 'medium',
        titleTa: `💡 காம்போ யோசனை: ${lowMarginItem?.nameTa || 'டீ'} + வடை`,
        titleEn: `💡 Combo Strategy: ${lowMarginItem?.nameEn || 'Tea'} + Vadai`,
        textTa: `${lowMarginItem?.nameTa || 'இந்த பொருள்'} அதிகம் விற்கிறது ஆனால் லாப சதவீதம் குறைவு. அதிக லாபம் தரும் வடை அல்லது பிஸ்கட்டுடன் இணைத்து விற்றால் லாபம் கூடும்.`,
        textEn: `${lowMarginItem?.nameEn || 'This item'} has high sales volume but lower margins. Bundle with high-margin vadai or biscuits.`,
        whyTa: 'அதிக விற்பனையாகும் பொருட்களின் லாப சதவீதத்தை கூட்டும் வணிக உத்தி.',
        whyEn: 'Cross-selling higher margin complementary items.'
      };
    }
  },

  // 14. Cash vs UPI Balance
  {
    id: 'cash-upi-balance',
    category: 'operations',
    priority: 'low',
    evaluate: ctx => ctx.todayBillsCount > 10 && (ctx.upiSalesPaise / (ctx.todaySalesPaise || 1)) > 0.7,
    generate: () => ({
      id: 'cash-upi-balance',
      category: 'operations',
      priority: 'low',
      titleTa: '📱 உங்கள் கடையில் 70% மேல் UPI டிஜிட்டல் விற்பனை',
      titleEn: '📱 Over 70% sales received via UPI',
      textTa: 'டிஜிட்டல் பண பரிவர்த்தனை அதிகம் நடப்பதால் சில்லறை தட்டுப்பாடு குறைகிறது. வங்கி இருப்பை கொண்டு ஆன்லைனில் சப்ளையர்களுக்கு செலுத்தலாம்.',
      textEn: 'High digital UPI adoption saves cash change hassle. Use bank balance to pay wholesale suppliers directly.',
      whyTa: 'இன்றைய விற்பனையில் UPI பரிவர்த்தனை விகிதம் அதிகமாக உள்ளது.',
      whyEn: 'Over 70% cashless collections detected.'
    })
  },

  // 15. FSSAI Compliance Guidance
  {
    id: 'fssai-guidance',
    category: 'legal',
    priority: 'low',
    evaluate: () => true, // General rotating advice
    generate: () => ({
      id: 'fssai-guidance',
      category: 'legal',
      priority: 'low',
      titleTa: '📋 FSSAI உணவு பாதுகாப்பு பதிவு நினைவூட்டல்',
      titleEn: '📋 FSSAI Food Safety Registration Notice',
      textTa: 'ஆண்டுக்கு ரூ.12 லட்சத்திற்குள் வியாபாரம் செய்யும் சிறு கடைகளுக்கு எளிய FSSAI பதிவு (ஆண்டுக்கு ரூ.100) போதுமானது. (பொதுவான வழிகாட்டல் மட்டுமே; அதிகாரப்பூர்வ துறையில் சரிபார்க்கவும்).',
      textEn: 'Stalls under ₹12 Lakhs annual turnover require only basic FSSAI Petty FBO registration (₹100/yr). (General info only; verify with official sources).',
      whyTa: 'அரசு சட்ட திட்டங்களை கடைபிடிக்க உதவும் விழிப்புணர்வு குறிப்பு.',
      whyEn: 'Statutory compliance reminder for food safety awareness.'
    })
  },

  // 16. GST Exemption Threshold Clarification
  {
    id: 'gst-threshold-info',
    category: 'legal',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'gst-threshold-info',
      category: 'legal',
      priority: 'low',
      titleTa: 'ℹ️ சிறு உணவகங்களுக்கான GST வரி வரம்பு',
      titleEn: 'ℹ️ Small Eatery GST Exemption Threshold',
      textTa: 'ஆண்டு மொத்த வருவாய் ரூ.20 லட்சத்திற்குள் உள்ள சிறு உணவகங்களுக்கு GST பதிவு கட்டாயமில்லை. தேவையற்ற வரி குழப்பங்கள் வேண்டாம்.',
      textEn: 'Food outlets with annual turnover under ₹20 Lakhs in Tamil Nadu are exempt from mandatory GST registration.',
      whyTa: 'சிறு வியாபாரிகளுக்கு தேவையற்ற வரி பயத்தை போக்கும் தகவல்.',
      whyEn: 'Clear threshold facts for roadside food carts.'
    })
  },

  // 17. Gas Stove Burner Maintenance
  {
    id: 'gas-burner-cleaning',
    category: 'gas',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'gas-burner-cleaning',
      category: 'gas',
      priority: 'low',
      titleTa: '🔧 நீல நிற சுடர் (Blue Flame) உள்ளதா?',
      titleEn: '🔧 Check for Clean Blue Flame',
      textTa: 'அடுப்பில் மஞ்சள் சுடர் எரிந்தால் பாத்திரம் கருப்பாகும் மற்றும் கேஸ் விரயமாகும். பர்னர் துவாரங்களை வாரத்திற்கு ஒருமுறை ஊசியால் சுத்தம் செய்யவும்.',
      textEn: 'Yellow flames waste LPG and soot pots. Clear burner holes with a pin weekly for efficient blue flame.',
      whyTa: 'எல்.பி.ஜி கேஸ் விரயத்தை தடுக்கும் நடைமுறை குறிப்பு.',
      whyEn: 'Efficient combustion saves gas consumption.'
    })
  },

  // 18. Daily Closing Habit
  {
    id: 'daily-closing-habit',
    category: 'closing',
    priority: 'medium',
    evaluate: ctx => ctx.currentHour >= 21,
    generate: () => ({
      id: 'daily-closing-habit',
      category: 'closing',
      priority: 'medium',
      titleTa: '🌙 இன்றைய கணக்கை 1 நிமிடத்தில் முடிக்கவும்',
      titleEn: '🌙 Finish daily closing in 60 seconds',
      textTa: 'கடையை பூட்டும் முன் மீதமான பால் மற்றும் பலகாரங்களை உள்ளிட்டு இன்றைய உண்மையான லாபத்தை கணக்கிடுங்கள்.',
      textEn: 'Before locking up, log your leftovers to view your verified net profit for the day.',
      whyTa: 'தினமும் கணக்கு முடிப்பது உங்கள் நிதி கட்டுப்பாட்டை பாதுகாக்கும்.',
      whyEn: 'Closing stock logs guarantee exact profit numbers.',
      actionRoute: 'stock',
      actionLabelTa: 'கடை மூட',
      actionLabelEn: 'Close Day'
    })
  },

  // 19. Friendly Customer Service
  {
    id: 'customer-courtesy',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'customer-courtesy',
      category: 'operations',
      priority: 'low',
      titleTa: '😊 ஒரு புன்னகை, ஒரு வாடிக்கையாளர்',
      titleEn: '😊 The Value of a Warm Smile',
      textTa: 'டீ கொடுக்கும் போது இன்முகத்துடன் கொடுப்பது வாடிக்கையாளர்களை நிரந்தர வாடிக்கையாளராக மாற்றும் மிகச்சிறந்த முதலீடு.',
      textEn: 'Serving with a warm smile is the single highest ROI investment to turn passersby into loyal regulars.',
      whyTa: 'தமிழ்நாடு டீக்கடைகளின் வெற்றி ரகசியம் மனிதநேய உபசரிப்பு.',
      whyEn: 'Customer retention hospitality tip.'
    })
  },

  // 20. Clean Drinking Water Quality
  {
    id: 'clean-water-hygiene',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'clean-water-hygiene',
      category: 'operations',
      priority: 'low',
      titleTa: '💧 சுத்தமான குடிநீர் & கண்ணாடி டம்ளர்',
      titleEn: '💧 Clean Drinking Water & Glasses',
      textTa: 'குடிநீர் கேன்களை எப்போதும் மூடி வைக்கவும். சுத்தமான டம்ளர்கள் வாடிக்கையாளர்களுக்கு உங்கள் உணவின் மீது நம்பிக்கையை தரும்.',
      textEn: 'Keep drinking water cans tightly covered. Clean glassware builds deep customer trust in hygiene.',
      whyTa: 'உணவக சுகாதாரம் வாடிக்கையாளர் வருகையை தீர்மானிக்கிறது.',
      whyEn: 'Foundational hygiene practice.'
    })
  },

  // 21. Milk Quality & Boiling Consistency
  {
    id: 'milk-boiling-tip',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'milk-boiling-tip',
      category: 'operations',
      priority: 'low',
      titleTa: '🥛 பாலின் பதம் தான் டீயின் சுவை',
      titleEn: '🥛 Milk Quality & Boiling Consistency',
      textTa: 'பாலை அதிக நேரம் கொதிக்க விட்டு சுண்ட வைக்காமல், சரியான பதத்தில் காய்ச்சினால் பாலின் அளவும் மிச்சமாகும், டீயின் சுவையும் சீராக இருக்கும்.',
      textEn: 'Do not over-boil milk down to reduction. Boiling at exact optimum maintains cup yield and consistent flavor.',
      whyTa: 'டீ தயாரிப்பில் அதிக செலவு பிடிக்கும் மூலப்பொருள் பால்.',
      whyEn: 'Milk represents ~60% of liquid ingredients cost in tea shops.'
    })
  },

  // 22. Sugar Quantity Control
  {
    id: 'sugar-portion-control',
    category: 'pricing',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'sugar-portion-control',
      category: 'pricing',
      priority: 'low',
      titleTa: '🥄 சர்க்கரை அளவும் ஆரோக்கியமும்',
      titleEn: '🥄 Portioning Sugar Correctly',
      textTa: 'நிலையான கரண்டியை பயன்படுத்தி சர்க்கரை போடுங்கள். சர்க்கரை அளவு கூடினால் சுவையும் மாறும், சர்க்கரை செலவும் தேவையின்றி கூடும்.',
      textEn: 'Use a standard measuring spoon for sugar. Over-sweetening spikes cost and distorts flavor balance.',
      whyTa: 'நிலையான அளவுகோல் விரயத்தை தடுக்கும்.',
      whyEn: 'Standard portioning controls ingredient variance.'
    })
  },

  // 23. Idly Batter Fermentation
  {
    id: 'idly-fermentation-tip',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'idly-fermentation-tip',
      category: 'operations',
      priority: 'low',
      titleTa: '⚪ பஞ்சு போன்ற இட்லிக்கு மாவு பதம்',
      titleEn: '⚪ Perfect Idly Batter Fermentation',
      textTa: 'மழை/குளிர் காலத்தில் மாவு புளிக்க அதிக நேரம் எடுக்கும். சிறிதளவு வெதுவெதுப்பான நீர் அல்லது வெந்தயத்தை சேர்த்தால் மாவு சரியான நேரத்தில் பொங்கி வரும்.',
      textEn: 'During cool weather batter ferments slower. Warm ambient storage or fenugreek ensures fluffy idlies.',
      whyTa: 'டிபன் கடைகளின் பிரதான அடையாளமான இட்லியின் தரம்.',
      whyEn: 'Fermentation temperature control guidance.'
    })
  },

  // 24. Chutney Shelf Life
  {
    id: 'chutney-freshness',
    category: 'wastage',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'chutney-freshness',
      category: 'wastage',
      priority: 'low',
      titleTa: '🥥 தேங்காய் சட்னி கெடாமல் இருக்க',
      titleEn: '🥥 Coconut Chutney Shelf-Life',
      textTa: 'வெயில் நாட்களில் தேங்காய் சட்னி சீக்கிரம் புளித்துவிடும். தேவையான அளவு மட்டும் தாளித்து வைக்கவும்; மிச்சத்தை நிழலான குளிர்ந்த இடத்தில் வைக்கவும்.',
      textEn: 'Coconut chutney spoils rapidly in heat. Temper in smaller batches and store reserve in cool shade.',
      whyTa: 'மதிய நேர சட்னி விரயத்தை தடுக்கும் குறிப்பு.',
      whyEn: 'Perishable condiment management.'
    })
  },

  // 25. Vadai Oil Temperature
  {
    id: 'vadai-oil-temp',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'vadai-oil-temp',
      category: 'operations',
      priority: 'low',
      titleTa: '🍩 வடை அதிக எண்ணெய் குடிக்காமல் இருக்க',
      titleEn: '🍩 Crisp Vadai Without Oil Soaking',
      textTa: 'எண்ணெய் சரியான சூடான பிறகே வடையை போடவும். குறைந்த சூட்டில் போட்டால் வடை எண்ணெயை உறிஞ்சி எண்ணெய் செலவை இருமடங்காக்கும்.',
      textEn: 'Drop vadai only when oil reaches proper high frying temperature to prevent oil soaking and excessive oil cost.',
      whyTa: 'சமையல் எண்ணெய் செலவை குறைக்கும் சமையல் உத்தி.',
      whyEn: 'Oil absorption physics directly impacts margins.'
    })
  },

  // 26. Used Frying Oil Safety
  {
    id: 'used-oil-safety',
    category: 'legal',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'used-oil-safety',
      category: 'legal',
      priority: 'low',
      titleTa: '🍳 எண்ணெயை அதிகமுறை மறுபயன்பாடு செய்யாதீர்',
      titleEn: '🍳 Avoid Repeated Oil Reheating (RUCO)',
      textTa: 'எண்ணெயை 3 முறைக்கு மேல் தொடர்ந்து சூடுபடுத்தினால் உணவின் தரம் குறையும். மீதமான எண்ணெயை சோப்பு தயாரிப்பவர்களிடம் விற்கலாம்.',
      textEn: 'Reheating frying oil beyond safe thresholds degrades flavor. FSSAI RUCO allows selling used oil to biodiesel makers.',
      whyTa: 'உணவு பாதுகாப்பு மற்றும் வாடிக்கையாளர் ஆரோக்கியம்.',
      whyEn: 'FSSAI RUCO initiative guidelines.'
    })
  },

  // 27. Paper Cup Quality vs Cost
  {
    id: 'paper-cup-quality',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'paper-cup-quality',
      category: 'operations',
      priority: 'low',
      titleTa: '☕ பேப்பர் கப் தரம் கசிவு இல்லாமல் இருக்கட்டும்',
      titleEn: '☕ Sturdy Leak-Proof Paper Cups',
      textTa: 'ரொம்ப மெலிதான கப்புகள் சூடான டீயில் கசிந்து வாடிக்கையாளர் கையை சுடலாம். 10 பைசா அதிகம் என்றாலும் தரமான கப் நற்பெயரை தரும்.',
      textEn: 'Very thin cups leak hot tea onto customer fingers. A sturdy cup builds a premium reputation for just 10 paise more.',
      whyTa: 'வாடிக்கையாளர் அனுபவம் மற்றும் பாதுகாப்பு.',
      whyEn: 'Packaging quality preserves customer comfort.'
    })
  },

  // 28. Wholesale Supplier Negotiations
  {
    id: 'wholesale-bargaining',
    category: 'pricing',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'wholesale-bargaining',
      category: 'pricing',
      priority: 'low',
      titleTa: '📦 மளிகை மண்டியிடம் வாராந்திர விலை பேரம்',
      titleEn: '📦 Wholesale Provision Negotiation',
      textTa: 'அரிசி, பருப்பு, சர்க்கரையை சில்லறையாக வாங்காமல் வாராந்திர மூட்டையாக மொத்த மண்டியிடம் பேசினால் 8% முதல் 12% வரை விலை குறையும்.',
      textEn: 'Buy rice, dal, and sugar in wholesale sacks weekly rather than daily retail packets to save 8-12% on input costs.',
      whyTa: 'மொத்த கொள்முதல் மூலம் மூலப்பொருள் செலவை குறைக்கும் வழி.',
      whyEn: 'Bulk purchasing discounts directly lower unit costs.'
    })
  },

  // 29. Banana Leaf Waste Reduction
  {
    id: 'banana-leaf-portion',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'banana-leaf-portion',
      category: 'operations',
      priority: 'low',
      titleTa: '🍃 வாழை இலை வெட்டும் முறை',
      titleEn: '🍃 Efficient Banana Leaf Cutting',
      textTa: 'முழு வாழை இலையை வீணாக்காமல் டிபன் அளவுக்கு ஏற்ப இரண்டாகவோ மூன்றாகவோ நறுக்கி பயன்படுத்தினால் இலை செலவு பாதியாக குறையும்.',
      textEn: 'Cut banana leaves precisely into 2 or 3 portion sizes matching idly plates to cut leaf expenses in half.',
      whyTa: 'டிபன் கடைகளின் அன்றாட செலவை கட்டுப்படுத்தும் எளிய முறை.',
      whyEn: 'Serving leaf waste reduction.'
    })
  },

  // 30. Google Drive Backup Reminder
  {
    id: 'gdrive-backup-nag',
    category: 'operations',
    priority: 'medium',
    evaluate: () => true,
    generate: () => ({
      id: 'gdrive-backup-nag',
      category: 'operations',
      priority: 'medium',
      titleTa: '💾 Google Drive பேக்கப் எடுத்துள்ளீர்களா?',
      titleEn: '💾 Have you backed up to Google Drive?',
      textTa: 'போன் தொலைந்தாலோ அல்லது பழுதானாலோ உங்கள் கணக்குகள் அழியாமல் இருக்க வாரத்திற்கு ஒருமுறை அமைப்புகளில் உள்ள Google Drive Backup எடுக்கவும்.',
      textEn: 'Take a quick Google Drive backup under Settings weekly so your business data is never lost if your phone breaks.',
      whyTa: 'கடை கணக்கு தகவல்களை பாதுகாக்கும் காப்புநகல் விழிப்புணர்வு.',
      whyEn: 'Prevents data loss on hardware damage.',
      actionRoute: 'settings',
      actionLabelTa: 'பேக்கப் எடுக்க',
      actionLabelEn: 'Backup Now'
    })
  },

  // 31. Owner Personal Withdrawal Discipline
  {
    id: 'owner-draw-discipline',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'owner-draw-discipline',
      category: 'operations',
      priority: 'low',
      titleTa: '💰 சொந்த செலவையும் கடை பணத்தையும் பிரிக்கவும்',
      titleEn: '💰 Separate Personal & Shop Money',
      textTa: 'வீட்டு செலவுக்கு கல்லாப் பெட்டியிலிருந்து பணம் எடுக்கும்போது அதை "முதலாளி சொந்த செலவு" என்று குறிக்கவும். அப்போது தான் உண்மை லாபம் தெரியும்.',
      textEn: 'When taking money home, log it under "Owner Withdrawal" rather than as a shop expense to know real business profit.',
      whyTa: 'வியாபார பணமும் தனிநபர் பணமும் கலப்பதை தடுக்கும் தத்துவம்.',
      whyEn: 'Proper bookkeeping distinction between profit draw and expenses.'
    })
  },

  // 32. Festival Days Advance Prep (Deepavali / Pongal)
  {
    id: 'festival-prep-alert',
    category: 'season',
    priority: 'medium',
    evaluate: () => true,
    generate: () => ({
      id: 'festival-prep-alert',
      category: 'season',
      priority: 'medium',
      titleTa: '🎉 பண்டிகை நாட்களில் பார்சல் வியாபாரம்',
      titleEn: '🎉 Festival Season Takeaway Demand',
      textTa: 'தீபாவளி, பொங்கல் மற்றும் திருவிழா நாட்களில் வீடுகளுக்கு எடுத்துச்செல்லும் பலகார பார்சல் அதிகம் நடக்கும். முன்கூட்டியே பார்சல் பெட்டிகள் வாங்கி வைக்கவும்.',
      textEn: 'Festivals bring heavy bulk snack parcel orders. Stock up on parcel boxes and containers in advance.',
      whyTa: 'பண்டிகை கால விற்பனை பெருக்கம்.',
      whyEn: 'Festival surge preparation.'
    })
  },

  // 33. Slow Seller Menu Trimming
  {
    id: 'trim-slow-sellers',
    category: 'pricing',
    priority: 'low',
    evaluate: ctx => ctx.slowSellingItems.length > 2,
    generate: ctx => ({
      id: 'trim-slow-sellers',
      category: 'pricing',
      priority: 'low',
      titleTa: '✂️ விற்பனை ஆகாத பொருட்களை மெனுவிலிருந்து குறைக்கலாம்',
      titleEn: '✂️ Consider Trimming Unsold Items',
      textTa: `${ctx.slowSellingItems.slice(0, 2).map(i => i.nameTa).join(', ')} கடந்த சில நாட்களாக விற்பனை குறைவாக உள்ளது. இதற்கு மூலப்பொருள் வாங்குவதை குறைக்கலாம்.`,
      textEn: `${ctx.slowSellingItems.slice(0, 2).map(i => i.nameEn).join(', ')} have sluggish sales. Avoid buying ingredients that might spoil.`,
      whyTa: 'விற்காத பொருட்களை குறைத்து விற்கும் பொருட்களில் கவனம் செலுத்துங்கள்.',
      whyEn: 'Inventory optimization on slow-moving items.'
    })
  },

  // 34. Counter Kiosk Display
  {
    id: 'kiosk-mode-counter',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'kiosk-mode-counter',
      category: 'operations',
      priority: 'low',
      titleTa: '📱 பழைய டேப்லெட் உள்ளதா? கவுண்டர் கியோஸ்க் ஆக்குங்கள்',
      titleEn: '📱 Have an old phone? Use Kiosk Mode',
      textTa: 'கல்லாவில் உள்ள பழைய போனை "கியோஸ்க் முறை"-யில் வைத்தால், வாடிக்கையாளர்களே தொட்டு ஆர்டர் செய்து UPI மூலம் எளிதாக செலுத்துவார்கள்.',
      textEn: 'Place an old phone on the counter in Kiosk Mode. Customers self-tap orders and scan UPI without cloud relay.',
      whyTa: 'கூட்டம் அதிகமான நேரங்களில் பில்லிங் வேகத்தை கூட்டும் முறை.',
      whyEn: 'Zero-cloud counter kiosk self-ordering mode.'
    })
  },

  // 35. UPI Fake Screenshot Awareness
  {
    id: 'upi-fraud-prevention',
    category: 'operations',
    priority: 'medium',
    evaluate: () => true,
    generate: () => ({
      id: 'upi-fraud-prevention',
      category: 'operations',
      priority: 'medium',
      titleTa: '🛡️ போலி UPI ஸ்கிரீன்ஷாட்களிடம் ஜாக்கிரதை!',
      titleEn: '🛡️ Guard Against Fake UPI Screenshots',
      textTa: 'வாடிக்கையாளர் மொபைலில் காட்டும் "பணம் செலுத்தப்பட்டது" படத்தை மட்டும் நம்பாதீர்கள். உங்கள் வங்கி எஸ்.எம்.எஸ் அல்லது சவுண்ட்பாக்ஸ் குரல் கேட்ட பிறகே பொருளை கொடுங்கள்.',
      textEn: 'Never trust a phone screen showing "Payment Successful". Confirm via your soundbox or bank notification before serving.',
      whyTa: 'சாலையோர உணவகங்களில் நடக்கும் போலி பணம் செலுத்தல் ஏமாற்றுதலை தடுக்கும் எச்சரிக்கை.',
      whyEn: 'Essential security check for roadside vendors.'
    })
  },

  // 36. Water Can Wastage Prevention
  {
    id: 'water-can-storage',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'water-can-storage',
      category: 'operations',
      priority: 'low',
      titleTa: '🚰 தண்ணீர் கேன் டிஸ்பென்சர் குழாய்',
      titleEn: '🚰 Clean Water Can Dispensers',
      textTa: 'தண்ணீர் கேன்களை தரையில் வைக்காமல் ஸ்டாண்டில் வையுங்கள். குழாய் மூலம் பிடித்தால் நீர் சிந்தாமல் கேன் செலவு மிச்சமாகும்.',
      textEn: 'Mount water cans on a stand with a tap dispenser to avoid spilling and waste.',
      whyTa: 'அன்றாட சிறிய செலவுகளை சேமிக்கும் வழி.',
      whyEn: 'Water conservation.'
    })
  },

  // 37. Tea Boiler Bulk Brewing vs Direct
  {
    id: 'tea-brewing-efficiency',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'tea-brewing-efficiency',
      category: 'operations',
      priority: 'low',
      titleTa: '☕ கூட்டம் இல்லாத நேரத்தில் டிகாக்ஷன் அளவு',
      titleEn: '☕ Off-Peak Decoction Management',
      textTa: 'மதிய நேரங்களில் மொத்தமாக டீ போட்டு வைக்காமல், தேவைப்படும்போது மட்டும் புதிதாக தயாரித்தால் டீயின் மணம் குறையாமல் இருக்கும்.',
      textEn: 'During 1-3 PM lull, brew smaller fresh decoctions so aroma stays vibrant without going stale.',
      whyTa: 'தேநீர் சுவை பராமரிப்பு.',
      whyEn: 'Decoction shelf life.'
    })
  },

  // 38. Electricity & Lighting (LED Bulbs)
  {
    id: 'led-lighting-savings',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'led-lighting-savings',
      category: 'operations',
      priority: 'low',
      titleTa: '💡 எல்.இ.டி (LED) பல்புகளுக்கு மாறுங்கள்',
      titleEn: '💡 Switch to Energy-Efficient LEDs',
      textTa: 'பழைய மஞ்சள் குண்டு பல்புகளுக்கு பதிலாக 9W LED பல்புகளை போட்டால் மின்சார கட்டணம் பாதியாக குறையும், வெளிச்சமும் பிரகாசமாக இருக்கும்.',
      textEn: 'Replace old incandescent yellow bulbs with 9W LEDs to slash your monthly EB bill while keeping food bright.',
      whyTa: 'கடை மின் கட்டணத்தை குறைக்கும் எளிய வழி.',
      whyEn: 'Electricity cost reduction.'
    })
  },

  // 39. Break-even Revenue Awareness
  {
    id: 'breakeven-awareness',
    category: 'pricing',
    priority: 'medium',
    evaluate: ctx => ctx.todayGrossProfitPaise > 0,
    generate: () => ({
      id: 'breakeven-awareness',
      category: 'pricing',
      priority: 'medium',
      titleTa: '🎯 தினசரி சமநிலை விற்பனை இலக்கு',
      titleEn: '🎯 Daily Break-Even Target',
      textTa: 'உங்கள் வாடகை, சம்பளம் போன்ற நிலையான செலவுகளை ஈடுகட்ட தினமும் குறைந்தது எத்தனை டீ / இட்லி விற்க வேண்டும் என்பதை கணக்கு பகுதியில் பாருங்கள்.',
      textEn: 'Check the Reports section to see the exact minimum cups/idlies needed daily to cover fixed rent and wages.',
      whyTa: 'நஷ்டமில்லாத வியாபாரத்திற்கு தினசரி இலக்கு அவசியம்.',
      whyEn: 'Fixed cost break-even milestone tracking.',
      actionRoute: 'reports',
      actionLabelTa: 'இலக்கு பார்க்க',
      actionLabelEn: 'View Target'
    })
  },

  // 40. Stall Cleanliness & Floor Sweep
  {
    id: 'stall-cleanliness-sweep',
    category: 'operations',
    priority: 'low',
    evaluate: () => true,
    generate: () => ({
      id: 'stall-cleanliness-sweep',
      category: 'operations',
      priority: 'low',
      titleTa: '🧹 கடையின் முன்புற தூய்மை',
      titleEn: '🧹 Keep Shop Front Clean',
      textTa: 'கடை வாசலில் பேப்பர் கப் மற்றும் எச்சில் இலைகள் கிடக்காமல் குப்பை தொட்டியை வெளியே வையுங்கள். சுத்தமான கடைக்கு பெண்கள் மற்றும் குடும்பங்கள் அதிகம் வருவார்கள்.',
      textEn: 'Keep a clean dustbin out front for cups and leaves. A clean shop exterior attracts families and repeat footfall.',
      whyTa: 'வாடிக்கையாளர் ஈர்ப்பு மற்றும் கடை நற்பெயர்.',
      whyEn: 'Stall cleanliness draws higher value family customers.'
    })
  }
];

/**
 * Evaluates all 40+ rules against the current shop context and returns sorted actionable tips.
 * High priority items are placed first.
 */
export function evaluateAdvisorRules(ctx: AdvisorContext): AdvisorTip[] {
  const matchedTips: AdvisorTip[] = [];

  for (const rule of ADVISOR_RULES) {
    try {
      if (rule.evaluate(ctx)) {
        matchedTips.push(rule.generate(ctx));
      }
    } catch (e) {
      // Ignore evaluation errors
    }
  }

  // Sort by priority: high -> medium -> low
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  return matchedTips.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
}

/**
 * Returns a single highlighted "Today's Tip" for the dashboard card.
 */
export function getTodaysHighlightedTip(ctx: AdvisorContext): AdvisorTip {
  const tips = evaluateAdvisorRules(ctx);
  // Pick the top priority tip, or a rotating daily tip based on day of year
  if (tips.length > 0 && tips[0].priority === 'high') {
    return tips[0];
  }
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const rotatingIndex = dayOfYear % tips.length;
  return tips[rotatingIndex] || tips[0];
}

export interface ItemPerformance {
  itemId: string;
  nameTa: string;
  nameEn: string;
  emoji: string;
  soldQty: number;
  revenuePaise: number;
  pricePaise: number;
  marginPct: number;
}

export interface DayPerformance {
  dateKey: string;
  dayNameTa: string;
  dayNameEn: string;
  displayDate: string;
  revenuePaise: number;
  expensesPaise: number;
  profitPaise: number;
  isProfit: boolean;
  ordersCount: number;
}

export interface BusinessAdvisorAnalysis {
  highestSoldItem: ItemPerformance;
  lowestSoldItem: ItemPerformance;
  allItemsRanked: ItemPerformance[];
  highestSalesDay: DayPerformance;
  lowestSalesDay: DayPerformance;
  mostProfitableDay: DayPerformance;
  lossOrLowestProfitDay: DayPerformance;
  dailyPerformance: DayPerformance[];
}

const TAMIL_DAY_NAMES = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
const ENGLISH_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Analyzes store performance across:
 * 1. Which item sold higher vs lower (Best Seller vs Slow Mover)
 * 2. Which day sales were higher vs lower (Peak vs Slow Day)
 * 3. Which day got more profit vs loss (Highest Profit vs Loss Day)
 */
export function analyzeBusinessPerformance(
  orders: any[] = [],
  expenses: any[] = [],
  items: any[] = []
): BusinessAdvisorAnalysis {
  // 1. ITEMS ANALYSIS
  const itemMap = new Map<string, ItemPerformance>();

  // Initialize with existing menu items
  (items || []).forEach(item => {
    itemMap.set(item.id, {
      itemId: item.id,
      nameTa: item.nameTa,
      nameEn: item.nameEn,
      emoji: item.emoji || '🍽️',
      soldQty: 0,
      revenuePaise: 0,
      pricePaise: item.pricePaise || 1000,
      marginPct: 50,
    });
  });

  // Aggregate confirmed & served orders
  (orders || [])
    .filter(o => o.state === 'confirmed' || o.state === 'served')
    .forEach(order => {
      (order.items || []).forEach((line: any) => {
        const existing = itemMap.get(line.itemId);
        if (existing) {
          existing.soldQty += line.qty || 1;
          existing.revenuePaise += line.totalPaise || (existing.pricePaise * (line.qty || 1));
        } else {
          itemMap.set(line.itemId, {
            itemId: line.itemId,
            nameTa: line.nameTa || 'பொருள்',
            nameEn: line.nameEn || 'Item',
            emoji: '🍽️',
            soldQty: line.qty || 1,
            revenuePaise: line.totalPaise || 1000,
            pricePaise: line.pricePaise || 1000,
            marginPct: 50,
          });
        }
      });
    });

  let rankedItems = Array.from(itemMap.values()).sort((a, b) => b.soldQty - a.soldQty);

  // If no items have sales yet, provide realistic Tamil Nadu tea stall demonstration baseline
  if (rankedItems.length === 0 || rankedItems.every(i => i.soldQty === 0)) {
    rankedItems = [
      {
        itemId: 'item_tea',
        nameTa: 'டீ (Tea)',
        nameEn: 'Cardamom Tea',
        emoji: '☕',
        soldQty: 145,
        revenuePaise: 174000, // ₹1,740
        pricePaise: 1200,
        marginPct: 58,
      },
      {
        itemId: 'item_coffee',
        nameTa: 'பில்டர் காபி (Filter Coffee)',
        nameEn: 'Filter Coffee',
        emoji: '☕',
        soldQty: 68,
        revenuePaise: 102000, // ₹1,020
        pricePaise: 1500,
        marginPct: 52,
      },
      {
        itemId: 'item_vadai',
        nameTa: 'மெது வடை (Medhu Vadai)',
        nameEn: 'Medhu Vadai',
        emoji: '🍩',
        soldQty: 54,
        revenuePaise: 54000, // ₹540
        pricePaise: 1000,
        marginPct: 48,
      },
      {
        itemId: 'item_samosa',
        nameTa: 'வெங்காய சமோசா (Onion Samosa)',
        nameEn: 'Onion Samosa',
        emoji: '🥟',
        soldQty: 9,
        revenuePaise: 9000, // ₹90
        pricePaise: 1000,
        marginPct: 35,
      },
    ];
  }

  const highestSoldItem = rankedItems[0];
  const lowestSoldItem = rankedItems[rankedItems.length - 1];

  // 2. DAILY SALES & PROFIT / LOSS ANALYSIS
  const dayMap = new Map<string, { revenuePaise: number; expensesPaise: number; count: number }>();

  (orders || [])
    .filter(o => o.state === 'confirmed' || o.state === 'served')
    .forEach(order => {
      const dKey = order.dateKey || new Date(order.createdAt).toISOString().split('T')[0];
      const entry = dayMap.get(dKey) || { revenuePaise: 0, expensesPaise: 0, count: 0 };
      entry.revenuePaise += order.totalPaise || 0;
      entry.count += 1;
      dayMap.set(dKey, entry);
    });

  (expenses || []).forEach(exp => {
    const dKey = exp.dateKey || new Date(exp.createdAt).toISOString().split('T')[0];
    const entry = dayMap.get(dKey) || { revenuePaise: 0, expensesPaise: 0, count: 0 };
    entry.expensesPaise += exp.amountPaise || 0;
    dayMap.set(dKey, entry);
  });

  let dailyList: DayPerformance[] = Array.from(dayMap.entries()).map(([dateKey, val]) => {
    const dateObj = new Date(dateKey);
    const dayOfWeek = isNaN(dateObj.getDay()) ? 0 : dateObj.getDay();
    const effectiveExpenses = val.expensesPaise > 0 ? val.expensesPaise : Math.round(val.revenuePaise * 0.45);
    const profitPaise = val.revenuePaise - effectiveExpenses;

    return {
      dateKey,
      dayNameTa: TAMIL_DAY_NAMES[dayOfWeek],
      dayNameEn: ENGLISH_DAY_NAMES[dayOfWeek],
      displayDate: dateKey.length >= 10 ? dateKey.substring(5) : dateKey,
      revenuePaise: val.revenuePaise,
      expensesPaise: effectiveExpenses,
      profitPaise,
      isProfit: profitPaise >= 0,
      ordersCount: val.count,
    };
  });

  // If fewer than 4 recorded days, provide realistic 7-day tea stall operational cycle
  if (dailyList.length < 4) {
    const today = new Date();
    const mockWeek = [
      { dayOffset: 6, dayOfWeek: 0, rev: 485000, exp: 145000, count: 88 }, // Sunday (Peak sales)
      { dayOffset: 5, dayOfWeek: 1, rev: 330000, exp: 120000, count: 62 }, // Monday
      { dayOffset: 4, dayOfWeek: 2, rev: 195000, exp: 110000, count: 38 }, // Tuesday (Lowest sales)
      { dayOffset: 3, dayOfWeek: 3, rev: 345000, exp: 135000, count: 65 }, // Wednesday
      { dayOffset: 2, dayOfWeek: 4, rev: 250000, exp: 380000, count: 48 }, // Thursday (LPG Cylinder refill ₹993 hike -> LOSS day)
      { dayOffset: 1, dayOfWeek: 5, rev: 420000, exp: 130000, count: 78 }, // Friday (Highest profit day)
      { dayOffset: 0, dayOfWeek: 6, rev: 460000, exp: 150000, count: 82 }, // Saturday
    ];

    dailyList = mockWeek.map(m => {
      const d = new Date(today);
      d.setDate(today.getDate() - m.dayOffset);
      const dKey = d.toISOString().split('T')[0];
      const profitPaise = m.rev - m.exp;

      return {
        dateKey: dKey,
        dayNameTa: TAMIL_DAY_NAMES[m.dayOfWeek],
        dayNameEn: ENGLISH_DAY_NAMES[m.dayOfWeek],
        displayDate: dKey.substring(5),
        revenuePaise: m.rev,
        expensesPaise: m.exp,
        profitPaise,
        isProfit: profitPaise >= 0,
        ordersCount: m.count,
      };
    });
  }

  // Sort by date ascending for display
  dailyList.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  // Highest & Lowest Sales Day
  const sortedBySales = [...dailyList].sort((a, b) => b.revenuePaise - a.revenuePaise);
  const highestSalesDay = sortedBySales[0];
  const lowestSalesDay = sortedBySales[sortedBySales.length - 1];

  // Most Profitable & Loss / Lowest Profit Day
  const sortedByProfit = [...dailyList].sort((a, b) => b.profitPaise - a.profitPaise);
  const mostProfitableDay = sortedByProfit[0];
  const lossOrLowestProfitDay = sortedByProfit[sortedByProfit.length - 1];

  return {
    highestSoldItem,
    lowestSoldItem,
    allItemsRanked: rankedItems,
    highestSalesDay,
    lowestSalesDay,
    mostProfitableDay,
    lossOrLowestProfitDay,
    dailyPerformance: dailyList,
  };
}
