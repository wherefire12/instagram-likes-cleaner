// ==UserScript==
// @name         Instagram Beğenileri Temizle - 100 / 200 Grup
// @namespace    local.ig-unlike-large
// @version      1.2.0
// @description  100 beğeni kaldırdıktan 3 saniye sonra yeniler; yeni beğeniler 10 saniyede gelmezse tekrar yeniler.
// @match        https://www.instagram.com/your_activity/interactions/likes*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

(async () => {
  "use strict";
  if (!/^\/your_activity\/interactions\/likes\/?$/.test(location.pathname)) return;
  if (document.getElementById("ig-unlike-large-panel")) return;

  const KEY = "ig-unlike-large-v1";
  const OTHER_KEY = "ig-unlike-night-v1";
  const CFG = {
    clickWaitMs: 120,
    scrollWaitMs: 1500,
    successReloadMs: 3000,
    missingChoicesMs: 10000,
    errorReloadMs: 10000
  };
  const WORD = {
    select: ["Select", "Seç"],
    cancel: ["Cancel", "İptal"],
    unlike: [
      "Unlike", "Beğenmekten Vazgeç",
      "Beğenmekten vazgeç", "Beğenmeyi kaldır"
    ]
  };
  const fresh = () => ({
    active: false, testOnce: false, sent: 0, batches: 0,
    totalReloads: 0, resumeAt: 0, lastError: ""
  });

  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(KEY)) || fresh(); }
  catch { saved = fresh(); }
  const state = Object.assign(fresh(), saved);
  // Eski 100/200 sürümünden kalan seçim ayarını daima 100'e sabitle.
  state.targetBatch = 100;
  delete state.reloads;
  let running = false;
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(state));
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const trim = value => (value || "").trim().replace(/\s+/g, " ");

  const panel = document.createElement("div");
  panel.id = "ig-unlike-large-panel";
  panel.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:2147483647;" +
    "background:#202124;color:white;padding:12px;border-radius:10px;" +
    "font:13px/1.4 Arial,sans-serif;max-width:290px;box-shadow:0 4px 18px #0008";
  const status = document.createElement("div");

  const start = document.createElement("button");
  const test = document.createElement("button");
  const stop = document.createElement("button");
  start.textContent = "Başlat / Devam et";
  test.textContent = "Tek Grup Dene";
  stop.textContent = "Durdur";
  for (const button of [start, test, stop]) {
    button.style.cssText =
      "margin:9px 5px 0 0;padding:6px 9px;cursor:pointer";
    panel.append(button);
  }
  panel.prepend(status);
  document.body.append(panel);

  function show(message) {
    status.textContent =
      state.sent + " işlem gönderildi; " +
      state.batches + " grup. Hedef " +
      state.targetBatch + ". " + message;
    start.disabled = state.active;
    test.disabled = state.active;
    stop.disabled = !state.active;
    console.log("[IG büyük grup]", message);
  }
  function otherIsActive() {
    try {
      return !!JSON.parse(
        sessionStorage.getItem(OTHER_KEY) || "{}"
      ).active;
    } catch {
      return false;
    }
  }
  function halt(message) {
    state.active = false;
    state.resumeAt = 0;
    state.lastError = message;
    save();
    show("Durdu: " + message);
  }
  async function until(fn, timeoutMs = 8000) {
    const deadline = Date.now() + timeoutMs;
    while (state.active && Date.now() < deadline) {
      const value = fn();
      if (value) return value;
      await sleep(200);
    }
    return null;
  }
  async function rest(ms) {
    const deadline = Date.now() + ms;
    while (state.active && Date.now() < deadline) {
      await sleep(500);
    }
  }

  const visible = el =>
    !!el?.isConnected &&
    el.getBoundingClientRect().width > 0 &&
    el.getBoundingClientRect().height > 0;
  const main = () => document.querySelector("main") || document;
  const grid = () =>
    main().querySelector(
      '[data-bloks-name="bk.components.Collection"]'
    ) || main();

  function ownText(el) {
    return trim([...el.childNodes]
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent)
      .join(" "));
  }
  function label(words) {
    return [...main().querySelectorAll(
      "span, button, div[role=button], div"
    )].find(el =>
      visible(el) &&
      (words.includes(ownText(el)) ||
       (el.children.length === 0 &&
        words.includes(trim(el.textContent))))
    ) || null;
  }
  function picked() {
    const scope = grid();
    return Math.max(
      scope.querySelectorAll(
        '[style*="circle-check__filled"]'
      ).length,
      scope.querySelectorAll(
        '[role="checkbox"][aria-checked="true"],' +
        '[aria-label="Toggle checkbox"][aria-checked="true"]'
      ).length
    );
  }
  function choices() {
    const scope = grid();
    const explicit = [...scope.querySelectorAll(
      '[aria-label="Toggle checkbox"],[role="checkbox"]'
    )].filter(el =>
      visible(el) &&
      el.getAttribute("aria-checked") !== "true"
    );
    if (explicit.length) return [...new Set(explicit)];

    return [...scope.querySelectorAll(
      'div[style*="mask-image"],div[style*="-webkit-mask"]'
    )].filter(el => {
      const mask =
        (el.getAttribute("style") || "") + " " +
        (el.style.maskImage || el.style.webkitMaskImage || "");
      return visible(el) &&
        /circle|check/i.test(mask) &&
        !mask.includes("circle-check__filled");
    });
  }
  async function selectMode(deadline) {
    const remaining = () => Math.max(0, deadline - Date.now());
    if (label(WORD.cancel)) return true;
    const select = await until(() => label(WORD.select), remaining());
    if (!select) return false;
    const target = select.closest(
      'button,[role="button"],div[style*="cursor: pointer"]'
    ) || select;
    target.click();
    if (await until(() => label(WORD.cancel), Math.min(2500, remaining()))) return true;
    if (target !== select) select.click();
    return !!(await until(() => label(WORD.cancel), Math.min(2500, remaining())));
  }
  async function loadChoices(deadline) {
    if (choices().length) return choices();
    while (state.active && Date.now() < deadline) {
      const scope = grid();
      const scroller =
        scope.scrollHeight > scope.clientHeight + 20
          ? scope : document.scrollingElement;
      scroller.scrollTop = scroller.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(Math.min(1400, Math.max(0, deadline - Date.now())));
      if (choices().length) return choices();
      scroller.scrollTop =
        Math.max(0, scroller.scrollTop - 400);
      await sleep(Math.min(400, Math.max(0, deadline - Date.now())));
    }
    return choices();
  }
  async function scrollForMore() {
    const scrollables = [
      ...document.querySelectorAll("div")
    ].filter(el => {
      const overflow = getComputedStyle(el).overflowY;
      return el.scrollHeight > el.clientHeight + 100 &&
        (overflow === "auto" || overflow === "scroll");
    });
    const scroller =
      scrollables.at(-1) || document.scrollingElement;
    scroller.scrollTop = Math.max(
      0,
      scroller.scrollHeight - scroller.clientHeight - 400
    );
    await sleep(300);
    scroller.scrollTop = scroller.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(CFG.scrollWaitMs);
  }
  async function chooseOne(icon) {
    const before = picked();
    icon.click();
    if (await until(() => picked() > before, 1700)) {
      return true;
    }
    const parent = icon.closest(
      '[role="button"],[tabindex="0"],' +
      'div[style*="cursor: pointer"]'
    );
    if (parent && parent !== icon) {
      parent.click();
      if (await until(() => picked() > before, 1700)) {
        return true;
      }
    }
    return false;
  }
  function confirmation(oldButtons) {
    const dialogs = [
      ...document.querySelectorAll('[role="dialog"]')
    ].filter(visible);
    const buttons = dialogs.length
      ? dialogs.flatMap(
          d => [...d.querySelectorAll("button")]
        )
      : [...document.querySelectorAll("button")]
          .filter(b => !oldButtons.has(b));
    const found = buttons.filter(b =>
      visible(b) &&
      WORD.unlike.includes(trim(b.innerText))
    );
    return found.length === 1 ? found[0] : null;
  }
  function messageInDialog() {
    return [
      ...document.querySelectorAll(
        '[role="dialog"],[role="alert"]'
      )
    ].filter(visible)
      .map(el => trim(el.innerText))
      .join(" ");
  }
  function isLimited() {
    return /try again later|temporarily blocked|restrict certain activity|please wait a few minutes|daha sonra tekrar dene|geçici olarak engellend|işlemlerini kısıtlıyoruz|çok hızlı/i
      .test(messageInDialog());
  }
  function hasGenericError() {
    return /something went wrong|bir sorun oluştu|bir hata oluştu/i
      .test(messageInDialog());
  }

  async function recover(reason, alreadyWaited = false) {
    if (!state.active) return;
    if (isLimited()) {
      halt(
        "Instagram işlem kısıtı gösterdi. Hesabı kontrol et."
      );
      return;
    }
    const delay = alreadyWaited ? 0 : CFG.errorReloadMs;
    state.totalReloads++;
    state.resumeAt = Date.now() + delay;
    state.lastError = reason;
    save();
    show(
      "Hata: " + reason + ". " +
      (delay ? "10 sn sonra" : "Şimdi") +
      " yenileyecek (" + state.totalReloads + ")."
    );

    await rest(delay);
    if (!state.active) return;
    location.reload();
  }

  async function run() {
    if (running || !state.active) return;
    running = true;
    try {
      if (state.resumeAt > Date.now()) {
        show("Kaldığı yerden devam etmek için bekliyor.");
        await rest(state.resumeAt - Date.now());
      }
      if (!state.active) return;
      state.resumeAt = 0;
      save();
      show("Çalışıyor; sekmeyi açık tut.");

      while (state.active) {
        const readyDeadline = Date.now() + CFG.missingChoicesMs;
        if (isLimited()) {
          halt(
            "Instagram işlem kısıtı gösterdi. Hesabı kontrol et."
          );
          return;
        }
        if (!await selectMode(readyDeadline)) {
          await recover("Seçim ekranı 10 sn içinde açılmadı.", true);
          return;
        }
        if (picked()) {
          await recover(
            "Önceki seçim ekranda takılı kaldı."
          );
          return;
        }
        if (!(await loadChoices(readyDeadline)).length) {
          if (!state.active) return;
          await recover(
            "Beğeniler veya seçim simgeleri 10 sn yüklenmedi.",
            true
          );
          return;
        }

        let count = 0;
        let emptyScrolls = 0;
        while (state.active &&
               count < state.targetBatch) {
          const item = choices()[0];
          if (!item) {
            show(
              "Seçilen: " + count + "/" +
              state.targetBatch +
              ". Yeni beğeniler için aşağı kaydırılıyor."
            );
            await scrollForMore();
            emptyScrolls =
              choices().length ? 0 : emptyScrolls + 1;
            if (emptyScrolls >= 4) break;
            continue;
          }
          if (!await chooseOne(item)) {
            if (!count) {
              halt(
                "Seçim işaretlenmedi. Ekranı kontrol et."
              );
              return;
            }
            show(
              "Instagram daha fazla seçim kabul etmedi; " +
              count + " seçili öğe işlenecek."
            );
            break;
          }
          count++;
          emptyScrolls = 0;
          if (count % 10 === 0) {
            show(
              "Seçilen: " + count + "/" +
              state.targetBatch + "."
            );
          }
          await sleep(CFG.clickWaitMs);
        }
        if (!count) return;

        const unlike =
          await until(() => label(WORD.unlike), 5000);
        if (!unlike) {
          await recover(
            "Beğenmekten Vazgeç düğmesi açılmadı."
          );
          return;
        }
        const oldButtons =
          new Set(document.querySelectorAll("button"));
        unlike.click();
        let confirm =
          await until(
            () => confirmation(oldButtons), 3500
          );
        if (!confirm) {
          const parent = unlike.closest(
            'button,[role="button"],' +
            'div[style*="cursor: pointer"]'
          );
          if (parent && parent !== unlike) parent.click();
          confirm = await until(
            () => confirmation(oldButtons), 6500
          );
        }
        if (!confirm) {
          await recover("Onay penceresi açılmadı.");
          return;
        }
        confirm.click();
        if (!await until(
          () => !visible(confirm), 20000
        ) || hasGenericError()) {
          await recover(
            "Kaldırma işleminden sonra sayfa hata verdi."
          );
          return;
        }
        if (isLimited()) {
          halt(
            "Instagram işlem kısıtı gösterdi. Hesabı kontrol et."
          );
          return;
        }

        state.sent += count;
        state.batches++;
        state.lastError = "";
        save();
        show(
          count +
          " beğeni için kaldırma işlemi gönderildi. 3 sn sonra yenilenecek."
        );

        await rest(CFG.successReloadMs);
        if (!state.active) return;
        if (state.testOnce) {
          halt(
            "Tek grup testi tamamlandı; sonuç için sayfa yenilendi."
          );
          location.reload();
          return;
        }
        state.totalReloads++;
        save();
        location.reload();
        return;
      }
    } catch (error) {
      console.warn(
        "[IG büyük grup] Beklenmeyen hata:", error
      );
      await recover(error.message || String(error));
    } finally {
      running = false;
    }
  }

  function begin(testOnce) {
    if (otherIsActive()) {
      show(
        "İlk gece betiği aktif. Önce onu Durdur " +
        "ve Tampermonkey'de devre dışı bırak."
      );
      return;
    }
    state.active = true;
    state.testOnce = testOnce;
    state.resumeAt = 0;
    state.lastError = "";
    save();
    void run();
  }
  start.onclick = () => begin(false);
  test.onclick = () => begin(true);
  stop.onclick = () => halt("Elle durduruldu.");

  show(state.active
    ? "Yenilemeden sonra devam ediyor."
    : (state.lastError ||
       "Hazır. Başlat düğmesine bas."));
  if (state.active) {
    if (otherIsActive()) {
      halt("İlk gece betiği de aktif. Onu durdur.");
    } else {
      void run();
    }
  }
})();
