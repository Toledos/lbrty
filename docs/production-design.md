# Production design reference

Source: https://www.lbrty.nl/ — extracted with MiroMiro on 2026-11-10.

The brand summary inferred colors from frequency; implementation instead uses measured hero/header/contact values: background #1a2e36, text #f5f4e9, accent #e1ff00, divider #798d96. Muted text is lighter for readability.

Headings: Filson Pro 300, loaded through the existing production Adobe Fonts kit adc6gve; body: Yantramanav 300. Commercial font binaries are not copied. Adobe Fonts requires an active license and the preview/deployment domain configured in the owner's kit: https://helpx.adobe.com/fonts/using/add-fonts-website.html .

Assets are copied from the owner's production site. assets/production-assets.json records their source URLs. The production dotLottie archive is converted to the JSON format supported by the existing player. Existing case links and password dialog remain in place. Case content is outside this styling update: main already contains an unfinished Spruit template and links to four absent case pages.

Both stylesheet entry points now resolve to assets/style.css. Desktop uses the production text-based project list; smaller screens stack sections. No-JavaScript and reduced-motion content remains readable.

The largest animation image is optimized to a 1280px web rendition; logical animation dimensions remain unchanged.
