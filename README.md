# Instagram Likes Cleaner

A small Tampermonkey userscript that removes Instagram likes in batches through the website's existing interface. It selects posts, scrolls for more, confirms the unlike action, then reloads the page to continue.

**JavaScript · Tampermonkey · MIT**

[Türkçe kullanım kılavuzu](README.tr.md) · [Changelog](CHANGELOG.md)

## What it does

- Targets batches of **100** likes, with scrolling to load more posts.
- Reloads **3 seconds** after a completed batch.
- Waits up to **10 seconds** for the selection screen and choices to appear before reloading.
- Provides **Start / Resume**, **Try one batch**, and **Stop** controls.
- Keeps progress and running state in the current tab's `sessionStorage` so it can resume after a reload.
- Detects several English and Turkish Instagram restriction messages and stops when they are found.

The panel uses Turkish labels, and the script recognizes English and Turkish action labels. The source's original title still says “100 / 200 Grup”; **version 1.2.0 always targets 100**. A smaller group can be submitted if fewer selectable posts are found.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your desktop browser.
2. In Chrome 138 or later, open Tampermonkey's extension settings and enable **Allow User Scripts**. If this option is unavailable, follow the [official permission instructions](https://www.tampermonkey.net/faq.php?q=Q209) for your browser.
3. Open [`Instagram_Begenileri_100luk_10sn.user.js`](Instagram_Begenileri_100luk_10sn.user.js) in this repository and click **Raw**. Tampermonkey should offer to install it.
4. If the installer does not open, use Tampermonkey's **Add a new script** option, replace the editor contents with the entire `.user.js` file, and save.
5. Disable any older Instagram unlike scripts before running this one.

No build step, npm packages, server, or API key is required.

## Use

1. Sign in to Instagram in your browser and open the [Likes activity page](https://www.instagram.com/your_activity/interactions/likes/). Open this URL directly or reload it if the panel does not appear after navigating inside Instagram.
2. Set any date filters you want in Instagram before starting. The script works on the posts shown by the page.
3. Click **Tek Grup Dene** to submit one group, then inspect the results after the page reloads.
4. Click **Başlat / Devam et** to continue automatically. Keep the tab open.
5. Click **Durdur** to stop further processing. An action already submitted to Instagram may still finish.

| Panel label | Meaning |
| --- | --- |
| Başlat / Devam et | Start / Resume |
| Tek Grup Dene | Try one batch |
| Durdur | Stop |
| işlem gönderildi | Unlike operations submitted; not an independently verified success count |

The script performs Instagram's confirmation step automatically. Review the selected date range and visible posts before starting.

## Limits and troubleshooting

- **No panel:** verify the script is enabled, userscripts are permitted, and the address is the Likes activity URL. Then reload the page.
- **Repeated reloads or an empty list:** click Stop. This version has no maximum reload count and does not reliably distinguish an empty list from a loading failure.
- **Instagram restriction message:** the script stops for the messages it recognizes. It does not bypass restrictions or guarantee that all restriction messages will be detected.
- **Interface changes or another language:** Instagram can change its layout or labels. The selectors may need updating; current compatibility has not been verified in a fresh live session for this release package.
- **Old “night” script active:** stop it and disable it in Tampermonkey before starting this script.

This tool changes the likes on your account. It has no undo or backup feature. It is an independent project and is not affiliated with Instagram or Meta.

## Privacy and implementation

The script uses DOM queries, simulated clicks, scrolling, page reloads, and tab session storage. Its source contains no external dependencies, analytics, custom network requests, credential prompts, or cookie-reading code. Instagram's own page handles the network activity caused by the clicks.

The userscript is restricted to `https://www.instagram.com/your_activity/interactions/likes*`, checks the exact pathname before proceeding, and runs with `@grant none`.

## Validation

The packaged script is unchanged from the recovered **v1.2.0** source. JavaScript syntax was checked with `node --check`; this is not a live Instagram compatibility test. See [validation details](docs/VALIDATION.md).

## Contributing

Bug reports and small improvements are welcome. Include your browser, Instagram interface language, the message shown in the panel, and steps to reproduce. Remove account details from screenshots and logs.

## License

[MIT](LICENSE)

## References

- [Tampermonkey: userscript execution permission](https://www.tampermonkey.net/faq.php?q=Q209)
- [Tampermonkey: installing userscripts](https://www.tampermonkey.net/faq.php?q=Q102)
