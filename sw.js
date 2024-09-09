self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.origin === 'https://storage.googleapis.com' && url.pathname.startsWith('/cdn/')) {
        const newPathname = url.pathname.replace('/cdn/', '/');
        const newUrl = `https://1.cdn6.workers.dev${newPathname}`;

        const modifiedRequest = new Request(newUrl, {
            method: event.request.method,
            headers: event.request.headers,
            mode: event.request.mode,
            credentials: event.request.credentials,
            redirect: event.request.redirect,
            referrer: event.request.referrer,
            body: event.request.body,
            bodyUsed: event.request.bodyUsed,
        });

        event.respondWith(
            fetch(modifiedRequest).then((response) => {
                if (!response.ok) {
                    return response;
                }

                // Ensure the response supports range requests
                const headers = new Headers(response.headers);
                if (headers.has('Content-Range')) {
                    headers.set('Accept-Ranges', 'bytes');
                }

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers
                });
            }).catch(() => {
                return new Response('Service Unavailable', { status: 503 });
            })
        );
    }
});
