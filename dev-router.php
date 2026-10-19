<?php
declare(strict_types=1);

// Router for PHP's built-in server. Apache keeps using .htaccess instead.
$uri = urldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$blocked = str_starts_with($uri, '/_private')
    || $uri === '/dev-router.php'
    || str_contains($uri, 'auth.env');
if ($blocked) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    return true;
}

return false;
