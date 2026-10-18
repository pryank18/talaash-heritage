# Social slide renderer

Put each post's slides in `render/queue/<post>/<n>.html` (1080x1350, body gets class `ready` when fonts and images have loaded) and push to `main`. The GitHub Action "Render social slides" renders any slide without an image to `site/media/ig/<post>-<n>.jpg`, commits it, and Cloudflare Pages serves it at `https://talaash-heritage.pages.dev/media/ig/<post>-<n>.jpg`. Results are in `render/status.json`. Folders starting with `_` are tests and are never posted. Never edit or delete an image that has already been posted.
