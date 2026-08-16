document.addEventListener(
  "DOMContentLoaded",
  () => {

    const container =
      document.getElementById(
        "sidebar-container"
      );


    if (!container) {
      return;
    }


    /* =========================
       現在URL
    ========================= */

    const path =
      window.location.pathname;


    const isToolPage =
      path.includes("/tools/");


    /* =========================
       メニュー設定
    ========================= */

    const menuGroups = [
      { label: "人気", items: [
        ["timer", "⏱️", "タイマー・ストップウォッチ"],
        ["test-data-generator", "🗄️", "テーブルINSERT生成"],
        ["table-generator", "🧱", "CREATE TABLE生成"],
        ["image-editor", "🖼️", "画像編集"],
        ["video-editor", "🎬", "動画編集"],
        ["counter", "📝", "文字数カウント"]
      ]},
      { label: "日常ツール", items: [
        ["roulette", "🎡", "ルーレット"],
        ["bmi-calculator", "⚖️", "BMI計算"], ["loan-calculator", "🏦", "ローン返済計算"],
        ["random-picker", "🎯", "抽選・ランダム選択"], ["barcode-generator", "🏷️", "バーコード生成"],
        ["qr-reader", "📷", "QRコード読み取り"], ["password-generator", "🔑", "パスワード生成"],
        ["unit-converter", "📐", "単位変換"], ["color-converter", "🎨", "カラーコード変換"],
        ["date-calculator", "🗓️", "日付・年齢計算"],
        ["counter", "📝", "文字数カウント"], ["calculator", "🧮", "電卓"],
        ["timer", "⏱️", "タイマー・ストップウォッチ"], ["image-editor", "🖼️", "画像編集"],
        ["video-editor", "🎬", "動画編集"]
      ]},
      { label: "セキュリティ", items: [
        ["hash-generator", "#️⃣", "ハッシュ生成"],
        ["csp-builder", "🛡️", "CSP作成・診断"], ["certificate-checker", "📜", "証明書チェック"],
        ["regex-safety", "🧪", "正規表現安全性チェック"], ["actions-audit", "⚙️", "GitHub Actions監査"]
      ]},
      { label: "API・データ", items: [
        ["json-formatter", "🧩", "JSON整形"], ["csv-json-converter", "🔄", "CSV・JSON変換"],
        ["text-diff", "🆚", "文章比較"],
        ["data-magic", "✨", "データ自動判定・変換"], ["api-diff", "🔍", "APIレスポンス差分"],
        ["test-data-generator", "🗄️", "SQLテストデータ生成"], ["table-generator", "🧱", "CREATE TABLE文生成"]
      ]},
      { label: "開発・運用", items: [
        ["cron-calendar", "📅", "Cron実行カレンダー"], ["error-pack", "📦", "エラー共有パック"]
      ]}
    ];

    const menuItems = [

      {
        id: "home",
        icon: "🏠",
        label: "トップ",
        rootPath: "index.html",
        toolPath: "../index.html"
      },

      ...menuGroups.flatMap(group => group.items).filter((item, index, all) =>
        all.findIndex(other => other[0] === item[0]) === index
      ).map(([id, icon, label]) => ({ id, icon, label, rootPath: `tools/${id}.html`, toolPath: `${id}.html` }))

    ];


    /* =========================
       現在ページ判定
    ========================= */

    function getCurrentPageId() {

      let fileName =
        path.split("/").pop();


      /*
       * /web-tools/
       * のようなURL
       */

      if (!fileName) {

        fileName =
          "index.html";

      }


      if (
        fileName ===
        "index.html"
      ) {

        return "home";

      }


      const item =
        menuItems.find(
          menuItem => {

            return (
              menuItem
                .rootPath
                .endsWith(fileName)
              ||
              menuItem
                .toolPath
                .endsWith(fileName)
            );

          }
        );


      return item
        ? item.id
        : "";

    }


    const currentPageId =
      getCurrentPageId();


    /* =========================
       メニューHTML
    ========================= */

    const renderItem = item => {

          const href =
            isToolPage
              ? item.toolPath
              : item.rootPath;


          const activeClass =
            item.id ===
            currentPageId
              ? "active"
              : "";


          return `

            <a
              href="${href}"
              class="sidebar-link ${activeClass}"
            >

              <span
                class="sidebar-icon"
              >
                ${item.icon}
              </span>

              <span
                class="sidebar-label"
              >
                ${item.label}
              </span>

            </a>

          `;

        };

    const homeItem = menuItems[0];
    const menuHTML = renderItem(homeItem) + menuGroups.map((group, index) => {
      const items = group.items.map(([id]) => renderItem(menuItems.find(item => item.id === id))).join("");
      if (index === 0) return `<div class="sidebar-section-title popular-title">${group.label}</div>${items}`;
      const containsActive = group.items.some(([id]) => id === currentPageId);
      return `<button type="button" class="sidebar-section-toggle" aria-expanded="${containsActive}" aria-controls="sidebar-group-${index}"><span>${group.label}</span><span class="sidebar-chevron">⌄</span></button><div id="sidebar-group-${index}" class="sidebar-section-items ${containsActive ? "open" : ""}">${items}</div>`;
    }).join("");


    /* =========================
       トップへのリンク
    ========================= */

    const homePath =
      isToolPage
        ? "../index.html"
        : "index.html";


    /* =========================
       サイドバー生成
       
       初期状態はclosed
    ========================= */

    container.innerHTML = `

      <button
        id="mobileMenuButton"
        class="mobile-menu-button"
        type="button"
        aria-label="メニューを開く"
        aria-expanded="false"
      >

        ☰

        <span>
          メニュー
        </span>

      </button>


      <div
        id="sidebarOverlay"
        class="sidebar-overlay"
      ></div>


      <aside
        id="sidebar"
        class="sidebar closed"
        aria-hidden="true"
      >

        <div
          class="sidebar-header"
        >

          <a
            href="${homePath}"
            class="sidebar-logo"
          >
            Web便利ツール
          </a>


          <button
            id="sidebarCloseButton"
            class="sidebar-close-button"
            type="button"
            aria-label="メニューを閉じる"
          >
            ×
          </button>

        </div>


        <nav
          class="sidebar-nav"
        >

          ${menuHTML}

        </nav>

      </aside>

    `;


    /* =========================
       要素取得
    ========================= */

    const sidebar =
      document.getElementById(
        "sidebar"
      );


    const overlay =
      document.getElementById(
        "sidebarOverlay"
      );


    const menuButton =
      document.getElementById(
        "mobileMenuButton"
      );


    const closeButton =
      document.getElementById(
        "sidebarCloseButton"
      );


    /* =========================
       初期状態
       
       ページ遷移直後は
       必ず閉じる
    ========================= */

    sidebar.classList.remove(
      "open"
    );


    sidebar.classList.add(
      "closed"
    );


    overlay.classList.remove(
      "show"
    );


    document.body
      .classList
      .remove(
        "sidebar-open"
      );


    sidebar.setAttribute(
      "aria-hidden",
      "true"
    );


    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );


    /* =========================
       開く
    ========================= */

    function openSidebar() {

      sidebar.classList.remove(
        "closed"
      );


      /*
       * 次フレームでopenを付けることで
       * スライドアニメーションを安定させる
       */

      requestAnimationFrame(
        () => {

          sidebar.classList.add(
            "open"
          );

        }
      );


      overlay.classList.add(
        "show"
      );


      document.body
        .classList
        .add(
          "sidebar-open"
        );


      sidebar.setAttribute(
        "aria-hidden",
        "false"
      );


      menuButton.setAttribute(
        "aria-expanded",
        "true"
      );

    }


    /* =========================
       閉じる
    ========================= */

    function closeSidebar() {

      sidebar.classList.remove(
        "open"
      );


      sidebar.classList.add(
        "closed"
      );


      overlay.classList.remove(
        "show"
      );


      document.body
        .classList
        .remove(
          "sidebar-open"
        );


      sidebar.setAttribute(
        "aria-hidden",
        "true"
      );


      menuButton.setAttribute(
        "aria-expanded",
        "false"
      );

    }


    /* =========================
       イベント
    ========================= */

    menuButton.addEventListener(
      "click",
      openSidebar
    );


    closeButton.addEventListener(
      "click",
      closeSidebar
    );


    /*
     * サイドバー外の暗い部分を
     * クリックしても閉じる
     */

    overlay.addEventListener(
      "click",
      closeSidebar
    );


    /*
     * Escキーで閉じる
     */

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Escape"
        ) {

          closeSidebar();

        }

      }
    );


    /* =========================
       メニューリンク押下
       
       遷移前にも閉じておく
    ========================= */

    const sidebarLinks =
      sidebar.querySelectorAll(
        ".sidebar-link"
      );


    sidebarLinks.forEach(
      link => {

        link.addEventListener(
          "click",
          () => {

            closeSidebar();

          }
        );

      }
    );

    sidebar.querySelectorAll(".sidebar-section-toggle").forEach(button => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.getAttribute("aria-controls"));
        const open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!open));
        target.classList.toggle("open", !open);
      });
    });

    const searchScript = document.createElement("script");
    searchScript.src = (isToolPage ? "../js/site-search.js" : "js/site-search.js") + "?v=20260816-2";
    document.body.appendChild(searchScript);

  }
);
