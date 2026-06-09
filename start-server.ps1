$log = "C:\Users\KSA\AppData\Local\Temp\opencode\server.log"
$err = "C:\Users\KSA\AppData\Local\Temp\opencode\server.err"
$p = Start-Process -NoNewWindow -FilePath "node" -ArgumentList "$PSScriptRoot\node_modules\next\dist\bin\next","dev" -WorkingDirectory $PSScriptRoot -PassThru -RedirectStandardOutput $log -RedirectStandardError $err
$p.Id | Out-File -FilePath "$PSScriptRoot\.server-pid" -Encoding ascii
