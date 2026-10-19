# SMOLTECH

Ukrainian catalog site for SMOLTECH Technika Zgrzewalnicza (resistance-welding machines). Imported from [smolka77/smoltechnew](https://github.com/smolka77/smoltechnew) `main` at `fec2860`.

The public pages are static HTML. PHP handles the contact form (`wyslij.php`) and the admin panel under `panel/`.

## Run locally

```bash
php -S 0.0.0.0:43123 -t .
```

Open http://127.0.0.1:43123/

The Apache rules in `.htaccess` (canonical host, trailing slashes, legacy redirects) apply on the production server. PHP’s built-in server does not read that file, so preview links stay on this machine.

Panel secrets such as `_private/auth.env` are gitignored. Start from `_private/hasla.env.przyklad` if you need the panel locally.
