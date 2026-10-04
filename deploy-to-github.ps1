# PowerShell Script to automatically connect and push VARTHAGAM Web to GitHub
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "    VARTHAGAM (வர்த்தகம்) - Direct GitHub Hosting Setup   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host ""

$repoUrl = Read-Host "Enter your GitHub Repository URL (e.g. https://github.com/username/varthagam.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "[!] Repository URL cannot be empty. Aborted." -ForegroundColor Red
    exit 1
}

# Ensure git is available in PATH
$env:PATH = "C:\Users\acer\tools\git\cmd;$env:PATH"

Write-Host "`n[*] Configuring Git remote 'origin'..." -ForegroundColor Green
git remote remove origin 2>$null
git remote add origin $repoUrl.Trim()

Write-Host "[*] Setting branch to 'main'..." -ForegroundColor Green
git branch -M main

Write-Host "[*] Adding latest changes and committing..." -ForegroundColor Green
git add .
git commit -m "feat: deploy VARTHAGAM web application to GitHub Pages" --allow-empty

Write-Host "`n[*] Pushing to GitHub (origin main)..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[✓] SUCCESS! Your code has been pushed to GitHub." -ForegroundColor Green
    Write-Host "`n----------------------------------------------------------"
    Write-Host "NEXT STEP TO ACTIVATE GITHUB PAGES HOSTING:" -ForegroundColor Cyan
    Write-Host "1. Open your repository on GitHub."
    Write-Host "2. Go to: Settings -> Pages"
    Write-Host "3. Under 'Build and deployment -> Source', select: 'GitHub Actions'"
    Write-Host "4. Your automated deployment workflow will build and publish your site in ~1 minute!"
    Write-Host "----------------------------------------------------------`n"
} else {
    Write-Host "`n[!] Push failed. Please check your GitHub repository URL and permissions." -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
