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

    const menuItems = [

      {
        id: "home",
        icon: "🏠",
        label: "トップ",
        rootPath: "index.html",
        toolPath: "../index.html"
      },

      {
        id: "counter",
        icon: "📝",
        label: "文字数カウント",
        rootPath:
          "tools/counter.html",
        toolPath:
          "counter.html"
      },

      {
        id: "calculator",
        icon: "🧮",
        label: "電卓",
        rootPath:
          "tools/calculator.html",
        toolPath:
          "calculator.html"
      },

      {
        id: "timer",
        icon: "⏱️",
        label:
          "タイマー・ストップウォッチ",
        rootPath:
          "tools/timer.html",
        toolPath:
          "timer.html"
      },

      {
        id:
          "test-data-generator",

        icon: "🗄️",

        label:
          "SQLテストデータ生成",

        rootPath:
          "tools/test-data-generator.html",

        toolPath:
          "test-data-generator.html"
      },

      {
        id:
          "table-generator",

        icon: "🧱",

        label:
          "CREATE TABLE文生成",

        rootPath:
          "tools/table-generator.html",

        toolPath:
          "table-generator.html"
      },
      {
  id: "image-editor",
  icon: "🖼️",
  label: "画像編集",
  rootPath: "tools/image-editor.html",
  toolPath: "image-editor.html"
}

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

    const menuHTML =
      menuItems
        .map(item => {

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

        })
        .join("");


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

  }
);