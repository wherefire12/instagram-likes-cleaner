# Validation

Package checked on **2026-10-21**.

| Check | Result |
| --- | --- |
| Userscript version | 1.2.0 |
| File | `Instagram_Begenileri_100luk_10sn.user.js` |
| JavaScript syntax | `node --check` passed with Node.js v24.19.0 |
| Source preservation | Packaged userscript matches the recovered source byte for byte |
| Fresh live Instagram test | Not performed for this package |

SHA-256 of the userscript:

```text
10cd541fc0e5eb275b5e785a694ccfaf682ad1a98f6981610afb35d7447c6725
```

## Check locally

```sh
node --check Instagram_Begenileri_100luk_10sn.user.js
```

No dependencies need to be installed for this syntax check. It does not validate Instagram's current DOM, server responses, or successful removal of likes.

For a manual compatibility check, open the Likes activity page, review the visible posts and date filters, and use **Tek Grup Dene**. After the reload, inspect the result before starting continuous processing.
