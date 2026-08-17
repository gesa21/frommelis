# Meli's website

The live site for Meli's, frozen home-cooked meals in Twickenham. Everything on the page renders from one file, `menu.json`. Edit that file and the site updates itself.

## The Thursday routine

1. Go to github.com/gesa21/frommelis, click `menu.json`, then click the pencil icon to edit.
2. Change `week_label` to this week, for example "Menu for w/c 14 September".
3. Change `orders_close` to this Saturday at noon, written like `2026-09-12T12:00`. The countdown reads it as UK time.
4. Change `delivery_date` to this Sunday, written like `2026-09-13`.
5. Swap the 4 rotating mains: change their `name`, `description` and `allergens`. Leave `lasagne` and `sunday-ragu` alone, they are permanent.
6. Update the second pizza, the pudding and the bake the same way.
7. Check every dish has `"sold_out": false` to start the week. Flip one to `true` during the week when a dish runs out.
8. If a box price or its contents change, edit it under `boxes`.
9. Scroll down and click "Commit changes".
10. Wait 2 minutes, then check the site on your phone.

## Prices

Every dish has a `price`. If you delete a price (put `null` in its place), the card shows "price on Thursday's menu" instead of a number. `kids_portion_price` near the top is the single price shown for kids portions of adult mains.

## Stripe links

Each box in `menu.json` has a `stripe_url` that currently says `STRIPE_LINK_HERE`. Create the 2 payment links in Stripe (1 per box), then paste each link over the placeholder text, keeping the quotation marks. Until you do, the order buttons send people to WhatsApp instead, so the site still takes orders either way. In Stripe, add a custom field to each payment link called "Your dish choices" so people can type their picks at checkout.

## Photos

Save photos into the `photos` folder with these exact names and they appear on the site automatically, no other changes needed:

- `photos/hero.webp` for the big dish photo at the top.
- `photos/olsi.webp` for the story section.
- Dish photos: save as for example `photos/lasagne.webp`, then put `photos/lasagne.webp` in that dish's `photo` field in `menu.json`.

WebP files are smaller and faster. On your laptop, Squoosh (squoosh.app) converts any photo to WebP in the browser for free.

## Weekly caps

If you ever want the "slots left" counter back, set `slots_left` and `slots_total` to numbers in `menu.json`, for example 12 and 30. Set both to `null` to hide the counter again.

## Delivery areas

The list of areas lives in the "Where do you deliver" answer in `index.html`. Edit it there.

## Going live on frommelis.co.uk

In Cloudflare, on the frommelis.co.uk zone, add these 2 records, the same way as the melicatering site:

1. Type CNAME, name `www`, target `gesa21.github.io`.
2. Type CNAME, name `frommelis.co.uk`, target `gesa21.github.io`.

Then in GitHub, in this repo, go to Settings, then Pages, and tick "Enforce HTTPS" once it becomes tickable. The site is also reachable at gesa21.github.io/frommelis while DNS settles.

## Countdown test

To see what the closed state looks like before Saturday, open the site with `?close=2020-01-01T12:00` on the end of the address. To watch the countdown against any date, use `?close=` with that date. The live site always uses the real date from `menu.json`.
