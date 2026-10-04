# 🌐 VARTHAGAM (வர்த்தகம்) - GitHub-ல் நேரடியாக Web App ஹோஸ்ட் செய்யும் வழிகாட்டி (Deploy Guide)

இந்த ஃபோல்டரில் உள்ள **VARTHAGAM Web Application**-ஐ மிக எளிதாக ₹0 செலவில் GitHub Pages வழியாக ஆன்லைனில் ஹோஸ்ட் செய்யலாம்.

---

## ⚡ முறை 1: 1-Click Script மூலம் GitHub-ல் ஏற்றுவது (மிகவும் சுலபம்)

1. [GitHub](https://github.com/new)-ல் சென்று புதிய Repository ஒன்றை உருவாக்கவும் (எ.கா: `varthagam` அல்லது `varthagam-web`).
   - Repository-யை **Public** என வைக்கவும்.
   - Initialize with README எதையும் டிக் செய்ய வேண்டாம் (Empty Repo).
2. உங்கள் Repository URL-ஐ காப்பி செய்யவும்:
   `https://github.com/<உங்கள்-username>/varthagam.git`
3. இந்த ஃபோல்டரில் உள்ள **`deploy-to-github.bat`** ஃபைலை டபுள் கிளிக் செய்யவும் அல்லது PowerShell-ல் இயக்கவும்:
   ```powershell
   .\deploy-to-github.ps1
   ```
4. உங்கள் GitHub Repo URL-ஐ பேஸ்ட் செய்து `Enter` அழுத்தவும்.
5. கோப்புகள் அனைத்தும் தானாகவே GitHub-க்கு Push செய்யப்படும்!

---

## 🛠️ முறை 2: கமாண்ட் லைன் மூலம் ஏற்றுவது (Manual Git Commands)

PowerShell அல்லது Terminal திறந்து இந்த ஃபோல்டரில் பின்வரும் கமாண்டுகளை இயக்கவும்:

```powershell
# 1. உங்கள் GitHub Repository-ஐ இணைக்கவும்
git remote add origin https://github.com/<உங்கள்-username>/varthagam.git

# 2. Main branch-க்கு மாற்றி push செய்யவும்
git branch -M main
git push -u origin main
```

---

## 🚀 GitHub Pages-ஐ இயக்குவது எப்படி? (Enable GitHub Pages)

Push செய்த பிறகு, உங்கள் GitHub Repository பக்கத்தில்:

1. **Settings** டேப் கிளிக் செய்யவும்.
2. இடது மெனுவில் **Pages** கிளிக் செய்யவும்.
3. **Build and deployment -> Source** என்பதில் **"GitHub Actions"** என்பதைத் தேர்ந்தெடுக்கவும்.
4. இப்போது **Actions** டேப்பில் சென்றால், நாம் சேர்த்துள்ள `.github/workflows/deploy.yml` தானாகவே இயங்கி **1 நிமிடத்தில்** உங்கள் செயலியை லைவ் செய்துவிடும்!
5. உங்கள் செயலி நேரலையாக இயங்கும் முகவரி:
   👉 **`https://<உங்கள்-username>.github.io/varthagam/`**

---

## 🔑 முக்கிய URL வழிகள் (Hosted Web Routes)

* 🏪 **கடை பில்லிங் & ஆலோசகர் (Store POS & Business Advisor):**
  `https://<உங்கள்-username>.github.io/varthagam/`
* 📱 **வாடிக்கையாளர் சுய பில்லிங் (Customer Self-Billing Kiosk):**
  `https://<உங்கள்-username>.github.io/varthagam/s/<SHOP_CODE>`
* 👑 **சூப்பர் அட்மின் பேனல் (Super Admin Management):**
  `https://<உங்கள்-username>.github.io/varthagam/admin`
  *(இங்கிருந்து புதிய கடைகளுக்கு License Token மற்றும் Owner Unique Key உருவாக்கலாம்).*

---

## 💡 கூடுதல் பயன்கள்
* **PWA Installable:** இந்த இணையதளத்தை வாடிக்கையாளர்கள் மற்றும் கடைக்காரர்கள் தங்கள் போனில் Chrome வழியாக "Add to Home screen" செய்து செயலியாகப் பயன்படுத்தலாம்.
* **100% இலவசம்:** GitHub Pages ₹0 செலவு கொண்டது; ஹோஸ்டிங் அல்லது சர்வர் கட்டணம் எதுவும் கிடையாது.
