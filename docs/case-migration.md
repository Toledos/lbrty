# Case migration — 10 November 2026

Five production pages were accessed through the browser after the owner unlocked them: Spruit, Royal Flora Holland, Nefit Bosch, GITP and BNA. No login cookies or credentials were exported.

The existing Spruit template structure is retained: title/tagline/hero; an eight-column story and four-column facts sidebar; gallery; contact; previous/overview/next navigation. The pages use the shared site stylesheet and preserve the requested footer styling. The navigation wraps through all five cases in production order.

Source limitations: all five live cases contain Lorem ipsum. Those existing source paragraphs are retained under Uitdaging/Aanpak/Resultaat where available; they need editorial completion. RFH has one real goal paragraph and one Lorem ipsum paragraph. RFH and GITP each have an empty second image element, which is omitted. Empty production label “Heading” is omitted. No unsupported dates, tools, KPI values, outcomes or project claims are added. KPI placeholders from the old template are removed because the live source contains no metrics.

assets/case-assets.json records downloaded image sources. Images are locally stored as optimized WebP files; layout dimensions are explicit. Identical duplicate hero backgrounds are not copied twice. The case services reuse the site's matching four illustrations.

These pages were password protected on production. The repository and this static implementation are public, as was the original Spruit template. The existing homepage password dialog is unchanged and is not server-side access control. Migration is not a production deployment.
