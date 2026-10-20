<?php
declare(strict_types=1);

// Router for PHP's built-in server. Apache keeps using .htaccess instead.
$uri = urldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$blocked = str_starts_with($uri, '/_private')
    || $uri === '/dev-router.php'
    || str_contains($uri, 'auth.env');
if ($blocked || str_contains($uri, '..')) {
    http_response_code($blocked ? 404 : 400);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'Not found';
    return true;
}

$ext = strtolower(pathinfo($uri, PATHINFO_EXTENSION));
$types = [
    'js' => 'application/javascript; charset=utf-8',
    'css' => 'text/css; charset=utf-8',
    'html' => 'text/html; charset=utf-8',
];
if (isset($types[$ext])) {
    $file = __DIR__ . $uri;
    if (is_file($file)) {
        header('Content-Type: ' . $types[$ext]);
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');
        readfile($file);
        return true;
    }
}

return false;
