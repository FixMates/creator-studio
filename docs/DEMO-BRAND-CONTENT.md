# Demo Brand Content

## Showcase catalogue inventory

The current code contains 11 sample showcase identities. They are demonstration concepts, not verified registered businesses or real seller accounts.

| Demo identity | Category | Positioning |
|---|---|---|
| GiftzOwn Studio | Gifting | Personalised keepsakes, celebration gifts and handmade surprises |
| Thread & Form | Fashion | Everyday shirts, clean fits and versatile wardrobe staples |
| Varnam Saree House | Sarees & Ethnic Wear | Festive and everyday saree inspiration |
| Hour & Hand | Watches & Accessories | Everyday watches and accessories |
| Loop & Knot | Handmade & Craft | Crochet and handmade craft |
| The Sunday Habitat | Home & Living | Home decor and lifestyle |
| Glow Theory | Beauty & Personal Care | Beauty and personal care |
| Good Grain Pantry | Food & Beverages | Food and pantry inspiration |
| The Creator Desk | Digital Products | Digital creator tools and resources |
| Paper & Light Studio | Photography & Prints | Prints, frames and creative pieces |
| The UGC Room | UGC & Creator Services | Creator content and UGC services |

## Current brand assets

- Existing store names, taglines, emoji marks and Unsplash cover/product photography are retained in `lib/demo/showcase-stores.ts`.
- The current source defines static sample product copy and displayed prices. They are illustrative only and must not be interpreted as verified retailer prices or live stock.
- Homepage showcase cards route to `/preview/{storeId}` and homepage copy discloses that some featured storefronts are illustrative.

## Banner and identity backlog

Three unique campaign slides per store have not yet been implemented. Recommended direction for future work:

- GiftzOwn: personalised memories, celebration gifting, handmade keepsakes.
- Thread & Form: workday essentials, weekend rotation, everyday basics.
- Varnam: silk and festive, cotton and handloom, occasion details.
- Hour & Hand: minimal timepieces, daily accessories, gifting edit.
- Loop & Knot: crochet favourites, handmade decor, custom pieces.
- Sunday Habitat: warm interiors, thoughtful details, everyday home.
- Glow Theory: skincare basics, self-care edits, beauty essentials.
- Good Grain Pantry: pantry staples, small-batch finds, everyday nourishment.
- The Creator Desk: creator templates, workflow resources, digital tools.
- Paper & Light: wall art, personal prints, framing inspiration.
- The UGC Room: creator portfolios, product storytelling, brand content.

## Niche catalogue refresh

Each showcase now includes 15 fully populated illustrative product records across three collections, with a collection cover image, product image, name, description, price label, source, recommendation, display order, featured state, availability and redirect settings. Additional niche-specific entries were added for gifting, fashion, ethnic wear, watches, handmade craft, home, beauty, food, digital products, prints and UGC services.

Each demo identity now has a locally hosted SVG monogram in `public/demo-logos/`. Product imagery remains stock Unsplash photography and is illustrative rather than an exact listing image. Demo pricing and inventory are not verified against a retailer.

Do not generate fake retailer product images, fake testimonials, ratings, sales metrics or seller contact details. Do not use retailer logos as demo-store logos.
