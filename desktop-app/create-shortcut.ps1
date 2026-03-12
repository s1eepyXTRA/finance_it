$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut("$env:USERPROFILE\Desktop\FinanceIT Tracker.lnk")
$sc.TargetPath = "$PSScriptRoot\dist\win-unpacked\FinanceIT Tracker.exe"
$sc.WorkingDirectory = "$PSScriptRoot\dist\win-unpacked"
$sc.Description = "FinanceIT Tracker"
$sc.Save()
Write-Host "Shortcut created on Desktop"
