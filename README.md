# Meli's launch page

One page with one job: collect names for the launch list. No prices, no ordering, no payment. It is plain HTML, one stylesheet (`styles.css`) and one script (`main.js`). There is nothing to build or install.

Live address: https://gesa21.github.io/frommelis/

## Where registrations go

1. **Google Form.** Once its details are pasted into `main.js` (steps below), every registration lands in the form's Responses tab.
2. **WhatsApp, as the fail-safe.** If the form details are still placeholders, or the form cannot be reached, the thank-you screen shows a large WhatsApp button. It opens a message to 07414 962803 with the visitor's name, email, phone and area already typed in. The visitor still has to tap send.
3. **The phone itself.** Every registration is also saved in that browser. Open https://gesa21.github.io/frommelis/#leads on the same phone to see everything typed on it, copy it, or send the whole list to yourself on WhatsApp. This only shows entries made on that phone.

Until step 1 is done, a registration only reaches you if the visitor taps the WhatsApp button, or if it was typed on your own phone.

## Connect the Google Form

1. Go to forms.google.com and start a blank form. Call it "Meli's launch list".
2. Add 4 questions, all "Short answer", in exactly this order: Full name, Email, Phone, Your area. Leave "Required" switched off. The page already insists on all 4 answers, and if a question were required in Google, one wrong entry number would make Google turn away every registration with no sign on the page.
3. Open Settings, then Responses. Set "Collect email addresses" to "Do not collect" and leave "Limit to 1 response" switched off. Both of those make Google ask people to sign in, which stops the page from sending.
4. Click "Publish" at the top right, and set responders to anyone with the link.
5. Click the three dots menu at the top right and choose "Get pre-filled link".
6. Type a word in each box, for example NAME, EMAIL, PHONE and AREA. Click "Get link", then "Copy link".
7. Paste the link into a note. It will look like this:
   `https://docs.google.com/forms/d/e/1FAIpQLSabc123/viewform?usp=pp_url&entry.111111111=NAME&entry.222222222=EMAIL&entry.333333333=PHONE&entry.444444444=AREA`
8. The long code between `/d/e/` and `/viewform` is the form ID. The number after each `entry.` is an entry ID, in the same order as your questions.
9. On GitHub, open `main.js` and click the pencil icon. Replace the placeholders, keeping the quotation marks:
   - line 6: `FORM_ID_HERE` becomes the form ID
   - line 7: `ENTRY_ID_HERE` becomes the Full name number
   - line 8: `ENTRY_ID_HERE` becomes the Email number
   - line 9: `ENTRY_ID_HERE` becomes the Phone number
   - line 10: `ENTRY_ID_HERE` becomes the Your area number
10. Click "Commit changes". GitHub can take up to 10 minutes to publish a change, so give it a little while, then open the page in a private browsing tab.
11. Register with your own details, then look in the form's Responses tab. If your entry is there, with each answer under the right question, it works. If the thank-you screen still shows the WhatsApp button, one of lines 6 to 10 still has a placeholder or a typo, or your phone is showing the old version of the page. If there is no WhatsApp button and nothing arrives in Responses, check that the form is published, that it does not ask people to sign in, and that the form ID came from the pre-filled link. If answers arrive under the wrong questions, the numbers on lines 7 to 10 are in the wrong order. If one answer is blank, that question's number has a typo. The page cannot detect a wrong entry number by itself, which is why this test matters.

## Going live on www.frommelis.co.uk

There is deliberately no `CNAME` file yet. On 13 September 2026 www.frommelis.co.uk had no DNS records, and as soon as GitHub sees a `CNAME` file it forwards gesa21.github.io/frommelis to the custom domain. With no DNS behind it, that would take the page and the printed QR code offline.

When you are ready:

1. In Cloudflare, on the frommelis.co.uk zone, add the same 2 records as the melicatering site: CNAME `www` to `gesa21.github.io`, and CNAME `frommelis.co.uk` to `gesa21.github.io`.
2. In this repo, click "Add file", then "Create new file". Name it `CNAME` and type `www.frommelis.co.uk` as its only line. Commit.
3. After 10 to 30 minutes, go to Settings, then Pages, and tick "Enforce HTTPS".

The printed QR code keeps working throughout, because GitHub forwards gesa21.github.io/frommelis to the new domain.

## Printed poster and QR code

`melis-a4-poster.pdf` is the A4 poster for the stall. `melis-qr.png` is the QR code on its own. Both point at the address that was checked live when they were made. To remake them for a different address, with Python, Pillow and ReportLab installed:

`python tools/make_assets.py print https://gesa21.github.io/frommelis/`

## The earlier menu site

The August menu site, with prices, the menu file and the allergens page, is saved on the `archive-menu-site` branch. Nothing was deleted.
