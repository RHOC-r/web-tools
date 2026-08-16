document.addEventListener("DOMContentLoaded",()=>{
  const popular=document.querySelector(".popular-section .tool-grid");
  if(popular){
    const items=[
      ["timer","⏱️","タイマー・ストップウォッチ","カウントダウンとストップウォッチ。"],
      ["test-data-generator","🗄️","テーブルINSERT生成","SQLのテスト用INSERT文をまとめて生成。"],
      ["table-generator","🧱","CREATE TABLE生成","設定からCREATE TABLE文を生成。"],
      ["image-editor","🖼️","画像編集","文字入れ、切り抜き、合成など。"],
      ["video-editor","🎬","動画編集","カット、文字、速度、色調を編集。"],
      ["counter","📝","文字数カウント","文字数・行数をリアルタイム確認。"]
    ];
    popular.innerHTML=items.map(x=>`<a href="tools/${x[0]}.html" class="tool-card"><span class="tool-tag">人気</span><div class="tool-icon">${x[1]}</div><h2>${x[2]}</h2><p>${x[3]}</p></a>`).join("");
  }
  document.querySelectorAll(".category-section").forEach(section=>{const h=section.querySelector(".category-heading");if(h&&h.textContent.includes("新着・人気")&&!section.querySelector('a[href="tools/roulette.html"]'))section.querySelector(".tool-grid").insertAdjacentHTML("afterbegin",'<a href="tools/roulette.html" class="tool-card"><span class="tool-tag">新機能</span><div class="tool-icon">🎡</div><h2>ルーレット</h2><p>アニメーション付きで楽しく抽選できます。</p></a>');});
  document.querySelectorAll(".category-section:not(.popular-section)").forEach((section,index)=>{
    const heading=section.querySelector(":scope > .category-heading"),grid=section.querySelector(":scope > .tool-grid");
    if(!heading||!grid)return;
    const button=document.createElement("button");
    button.type="button";button.className="category-toggle";button.setAttribute("aria-expanded","false");
    button.setAttribute("aria-controls",`category-grid-${index}`);grid.id=`category-grid-${index}`;
    heading.replaceWith(button);button.append(heading,document.createRange().createContextualFragment('<span class="category-toggle-icon">⌄</span>'));
    section.classList.add("collapsible");
    button.addEventListener("click",()=>{const open=button.getAttribute("aria-expanded")==="true";button.setAttribute("aria-expanded",String(!open));section.classList.toggle("open",!open);});
  });
});
