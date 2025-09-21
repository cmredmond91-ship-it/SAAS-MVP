# cleanup-pages.ps1

# Navigate into frontend/app
Set-Location "./frontend/app"

# Look for duplicate page.tsx files
$duplicates = Get-ChildItem -Recurse -Filter "page.tsx" | ForEach-Object {
    $_.FullName.Replace((Get-Location).Path + "\", "")
}

Write-Host "Found the following page.tsx files:"
$duplicates

# Remove the duplicate that's breaking build
if (Test-Path "./dashboard/seo/page.tsx") {
    Write-Host "Removing dashboard/seo/page.tsx (duplicate)"
    Remove-Item "./dashboard/seo/page.tsx" -Force
}
