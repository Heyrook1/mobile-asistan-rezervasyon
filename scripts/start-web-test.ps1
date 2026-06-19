param(
  [int]$Port = 5500
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-DotEnv {
  param([string]$Path)
  $result = @{}
  if (-not (Test-Path $Path)) {
    return $result
  }

  $lines = Get-Content -Path $Path
  foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }

    $splitIndex = $trimmed.IndexOf("=")
    if ($splitIndex -lt 1) { continue }

    $key = $trimmed.Substring(0, $splitIndex).Trim()
    $value = $trimmed.Substring($splitIndex + 1).Trim()

    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $result[$key] = $value
  }
  return $result
}

function Escape-JsString {
  param([AllowNull()][string]$Value)
  if ($null -eq $Value) { return "" }
  return ($Value.Replace("\", "\\").Replace('"', '\"'))
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $root ".env"
$webTestPath = Join-Path $root "web-test"
$envJsPath = Join-Path $webTestPath "env.js"

$vars = Read-DotEnv -Path $envPath
$supabaseUrl = if ($vars.ContainsKey("SUPABASE_URL")) { $vars["SUPABASE_URL"] } else { "" }
$anonKey = if ($vars.ContainsKey("SUPABASE_ANON_KEY")) { $vars["SUPABASE_ANON_KEY"] } else { "" }

$envJsContent = @"
window.__ENV__ = {
  SUPABASE_URL: "$(Escape-JsString $supabaseUrl)",
  SUPABASE_ANON_KEY: "$(Escape-JsString $anonKey)"
};
"@

Set-Content -Path $envJsPath -Value $envJsContent -Encoding UTF8

if (-not $supabaseUrl -or -not $anonKey) {
  Write-Host "Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env"
  Write-Host "You can still enter values manually in the web tester UI."
} else {
  Write-Host "Loaded Supabase config from .env"
}

Push-Location $root
try {
  Write-Host "Starting web-test on http://localhost:$Port/web-test/"
  python -m http.server $Port
} finally {
  Pop-Location
}
