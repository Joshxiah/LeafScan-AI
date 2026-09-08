# ============================================================
# LeafScan AI - let your phone reach the dev servers
#
# The mobile app (on a real phone or emulator) talks to two
# servers running on this PC:
#
#   * 8081  - Metro / Expo bundler
#   * 4000  - the LeafScan AI backend API  <-- the one that gets blocked
#
# Windows Firewall blocks inbound LAN connections by default, so
# the phone sees "Network request failed" / "Cannot reach the
# server" even though the servers are up. This adds one allow rule
# per port, for every firewall profile.
#
# RUN THIS ONCE, AS ADMINISTRATOR:
#   1. Right-click this file  ->  "Run with PowerShell"       (then approve the UAC prompt), OR
#   2. Open an elevated PowerShell and run:
#        powershell -ExecutionPolicy Bypass -File scripts\allow-lan-dev.ps1
#
# To undo later:  scripts\allow-lan-dev.ps1 -Remove
# ============================================================

param([switch]$Remove)

$rules = @(
  @{ Name = 'LeafScan Metro 8081';   Port = 8081 },
  @{ Name = 'LeafScan Backend 4000'; Port = 4000 }
)

# --- self-elevate if not already admin ---
$isAdmin = ([Security.Principal.WindowsPrincipal] `
  [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)

if (-not $isAdmin) {
  Write-Host "Elevating..." -ForegroundColor Yellow
  $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
  if ($Remove) { $argList += '-Remove' }
  Start-Process powershell -Verb RunAs -ArgumentList $argList
  return
}

foreach ($r in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue

  if ($Remove) {
    if ($existing) {
      $existing | Remove-NetFirewallRule
      Write-Host ("Removed rule: {0}" -f $r.Name) -ForegroundColor Green
    } else {
      Write-Host ("No rule to remove: {0}" -f $r.Name) -ForegroundColor DarkGray
    }
    continue
  }

  if ($existing) {
    Write-Host ("Already allowed: {0} (TCP {1})" -f $r.Name, $r.Port) -ForegroundColor DarkGray
    continue
  }

  New-NetFirewallRule `
    -DisplayName $r.Name `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $r.Port `
    -Profile Any | Out-Null

  Write-Host ("Allowed: {0} (TCP {1})" -f $r.Name, $r.Port) -ForegroundColor Green
}

if (-not $Remove) {
  Write-Host ""
  Write-Host "Done. Now:" -ForegroundColor Cyan
  Write-Host "  1. Make sure the phone is on the SAME Wi-Fi as this PC (not guest / mobile data)."
  Write-Host "  2. Fully close and reopen the app (or shake -> Reload)."
  Write-Host "  3. If it still fails, your router may have 'AP isolation' / 'client isolation' on - turn it off."
}

Write-Host ""
Read-Host "Press Enter to close"
