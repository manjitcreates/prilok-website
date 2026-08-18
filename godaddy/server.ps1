# Simple PowerShell HTTP Web Server for PRILOK Website with Gzip Compression
Param(
    [int]$Port = 8080,
    [string]$Path = $PSScriptRoot
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " PRILOK LLC Web Server is LIVE at http://localhost:$Port/" -ForegroundColor Yellow
    Write-Host " Root Directory: $Path" -ForegroundColor Cyan
    Write-Host " Cache: Fresh (no-cache for instant live updates)" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
} catch {
    Write-Host "Failed to start server: $_" -ForegroundColor Red
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
    ".json" = "application/json"
    ".webp"  = "image/webp"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".docx"  = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ".pptx"  = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ".pdf"   = "application/pdf"
}

# Files that should be gzip compressed
$compressibleTypes = @('.html', '.css', '.js', '.json', '.svg', '.txt', '.xml', '.csv')

function Write-GzipResponse($response, $bytes) {
    $ms = New-Object System.IO.MemoryStream
    $gzip = New-Object System.IO.Compression.GzipStream($ms, [System.IO.Compression.CompressionMode]::Compress)
    $gzip.Write($bytes, 0, $bytes.Length)
    $gzip.Close()
    $compressed = $ms.ToArray()
    $ms.Close()
    
    $response.Headers.Add("Content-Encoding", "gzip")
    $response.ContentLength64 = $compressed.Length
    $response.OutputStream.Write($compressed, 0, $compressed.Length)
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }

        $filePath = Join-Path $Path ($urlPath.TrimStart('/').Replace('/', '\'))

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            if ($mimeTypes.ContainsKey($ext)) {
                $response.ContentType = $mimeTypes[$ext]
            } else {
                $response.ContentType = "application/octet-stream"
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Disable caching for instant live update during development/testing
            $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.Headers.Add("Pragma", "no-cache")
            $response.Headers.Add("Expires", "0")
            
            # Enable gzip compression for text-based files
            $acceptEncoding = $request.Headers["Accept-Encoding"]
            if ($acceptEncoding -and $acceptEncoding -like "*gzip*" -and $compressibleTypes -contains $ext) {
                Write-GzipResponse $response $bytes
            } else {
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        $response.Close()
    } catch {
        # Continue loop on aborted client connections
    }
}