document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("privacyInput");
  const output = document.getElementById("maskedOutput");
  const analyzeButton = document.getElementById("analyzeButton");
  const sampleButton = document.getElementById("sampleButton");
  const clearButton = document.getElementById("clearButton");
  const maskButton = document.getElementById("maskButton");
  const copyButton = document.getElementById("copyButton");
  const selectAllButton = document.getElementById("selectAllButton");
  const deselectAllButton = document.getElementById("deselectAllButton");
  const findingList = document.getElementById("findingList");
  const findingToolbar = document.getElementById("findingToolbar");
  const highlightPreview = document.getElementById("highlightPreview");
  const message = document.getElementById("privacyMessage");
  const inputCount = document.getElementById("inputCount");

  let findings = [];

  const rules = [
    { type: "email", label: "メールアドレス", risk: "high", replacement: "[メールアドレス]", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
    { type: "jwt", label: "JWTトークン", risk: "high", replacement: "[JWTトークン]", regex: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g },
    { type: "openai-key", label: "APIキー候補（OpenAI形式）", risk: "high", replacement: "[APIキー]", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/g },
    { type: "github-token", label: "GitHubトークン候補", risk: "high", replacement: "[GitHubトークン]", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g },
    { type: "aws-key", label: "AWSアクセスキー候補", risk: "high", replacement: "[AWSアクセスキー]", regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
    { type: "bearer", label: "Bearerトークン", risk: "high", replacement: "Bearer [トークン]", regex: /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}={0,2}/gi },
    { type: "private-key", label: "秘密鍵", risk: "high", replacement: "[秘密鍵を削除]", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
    { type: "phone", label: "電話番号候補", risk: "medium", replacement: "[電話番号]", regex: /(?:\+81[-\s]?(?:\d[-\s]?){9,10}|0\d{1,4}[-ー\s]?\d{1,4}[-ー\s]?\d{3,4})/g },
    { type: "postal", label: "郵便番号候補", risk: "medium", replacement: "〒[郵便番号]", regex: /(?:〒\s*)?\b\d{3}-?\d{4}\b/g },
    { type: "ipv4", label: "IPアドレス候補", risk: "low", replacement: "[IPアドレス]", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, validate: value => value.split(".").every(part => Number(part) <= 255) },
    { type: "windows-path", label: "ユーザー名を含むローカルパス", risk: "low", replacement: "C:\\Users\\[ユーザー]", regex: /C:\\Users\\[^\\\s"']+/gi },
    { type: "unix-home", label: "ユーザー名を含むホームパス", risk: "low", replacement: "/home/[ユーザー]", regex: /\/home\/[^\/\s"']+/g }
  ];

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function isValidCard(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19 || /^(\d)\1+$/.test(digits)) return false;
    let sum = 0;
    let doubleDigit = false;
    for (let index = digits.length - 1; index >= 0; index -= 1) {
      let digit = Number(digits[index]);
      if (doubleDigit) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      doubleDigit = !doubleDigit;
    }
    return sum % 10 === 0;
  }

  function addFinding(list, candidate) {
    if (!candidate.value || candidate.start < 0) return;
    list.push({ ...candidate, end: candidate.start + candidate.value.length });
  }

  function scanKeyValues(text, list) {
    const sensitiveKeys = "password|passwd|pwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|authorization";
    const jsonPattern = new RegExp(`(["']?(?:${sensitiveKeys})["']?\\s*[:=]\\s*["'])([^"'\\r\\n]{3,})(["'])`, "gi");
    let match;
    while ((match = jsonPattern.exec(text)) !== null) {
      const value = match[2];
      addFinding(list, { type: "sensitive-value", label: "秘密情報を示す項目の値", risk: "high", replacement: "[秘密情報]", value, start: match.index + match[0].indexOf(value) });
    }

    const sqlPattern = new RegExp(`\\b(${sensitiveKeys})\\b\\s*=\\s*(['"])([^'"\\r\\n]{3,})\\2`, "gi");
    while ((match = sqlPattern.exec(text)) !== null) {
      const value = match[3];
      addFinding(list, { type: "sql-sensitive", label: "SQL内の秘密情報候補", risk: "high", replacement: "[秘密情報]", value, start: match.index + match[0].indexOf(value) });
    }
  }

  function normalizeFindings(list) {
    const priority = { high: 3, medium: 2, low: 1 };
    return list
      .sort((a, b) => a.start - b.start || b.end - a.end || priority[b.risk] - priority[a.risk])
      .filter((item, index, source) => !source.slice(0, index).some(previous => item.start < previous.end && item.end > previous.start))
      .map((item, index) => ({ ...item, id: `finding-${index}`, selected: true }));
  }

  function analyze() {
    const text = input.value;
    message.textContent = "";
    output.value = "";
    copyButton.disabled = true;
    if (!text.trim()) {
      findings = [];
      render();
      setMessage("検査する内容を入力してください。", true);
      return;
    }

    const detected = [];
    rules.forEach(rule => {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(text)) !== null) {
        if (!rule.validate || rule.validate(match[0])) {
          addFinding(detected, { type: rule.type, label: rule.label, risk: rule.risk, replacement: rule.replacement, value: match[0], start: match.index });
        }
        if (match[0].length === 0) rule.regex.lastIndex += 1;
      }
    });

    const cardPattern = /\b(?:\d[ -]*?){13,19}\b/g;
    let cardMatch;
    while ((cardMatch = cardPattern.exec(text)) !== null) {
      if (isValidCard(cardMatch[0])) addFinding(detected, { type: "card", label: "カード番号候補", risk: "high", replacement: "[カード番号]", value: cardMatch[0], start: cardMatch.index });
    }
    scanKeyValues(text, detected);
    findings = normalizeFindings(detected);
    render();
    setMessage(findings.length ? `${findings.length}件の確認候補を検出しました。` : "検出対象の情報は見つかりませんでした。目視でも確認してください。");
  }

  function render() {
    const counts = { high: 0, medium: 0, low: 0 };
    findings.forEach(item => { counts[item.risk] += 1; });
    document.getElementById("highCount").textContent = counts.high;
    document.getElementById("mediumCount").textContent = counts.medium;
    document.getElementById("lowCount").textContent = counts.low;
    document.getElementById("findingTotal").textContent = `${findings.length}件`;
    findingToolbar.classList.toggle("visible", findings.length > 0);
    maskButton.disabled = findings.length === 0;

    if (!findings.length) {
      findingList.innerHTML = '<div class="privacy-empty">検出対象の情報はありません。内容を変更した場合は再度検査してください。</div>';
      highlightPreview.textContent = input.value || "検出した箇所がここに表示されます。";
      return;
    }

    findingList.innerHTML = findings.map(item => `
      <label class="finding-item">
        <input type="checkbox" data-id="${item.id}" ${item.selected ? "checked" : ""} aria-label="${escapeHtml(item.label)}をマスキング">
        <span><span class="finding-name">${escapeHtml(item.label)}</span><code class="finding-value">${escapeHtml(abbreviate(item.value))}</code></span>
        <span class="risk-badge risk-${item.risk}">${item.risk === "high" ? "高リスク" : item.risk === "medium" ? "注意" : "確認"}</span>
      </label>`).join("");
    findingList.querySelectorAll("input[type='checkbox']").forEach(checkbox => checkbox.addEventListener("change", () => {
      const item = findings.find(finding => finding.id === checkbox.dataset.id);
      if (item) item.selected = checkbox.checked;
    }));
    renderHighlights();
  }

  function abbreviate(value) {
    if (value.length <= 70) return value;
    return `${value.slice(0, 34)}…${value.slice(-20)}`;
  }

  function renderHighlights() {
    const text = input.value;
    let cursor = 0;
    let html = "";
    findings.forEach(item => {
      html += escapeHtml(text.slice(cursor, item.start));
      html += `<mark title="${escapeHtml(item.label)}">${escapeHtml(text.slice(item.start, item.end))}</mark>`;
      cursor = item.end;
    });
    html += escapeHtml(text.slice(cursor));
    highlightPreview.innerHTML = html;
  }

  function maskSelected() {
    const selected = findings.filter(item => item.selected).sort((a, b) => b.start - a.start);
    if (!selected.length) { setMessage("マスキングする項目を選択してください。", true); return; }
    let result = input.value;
    selected.forEach(item => { result = result.slice(0, item.start) + item.replacement + result.slice(item.end); });
    output.value = result;
    copyButton.disabled = false;
    setMessage(`${selected.length}件をマスキングしました。共有前に結果を確認してください。`);
  }

  function setMessage(text, error = false) {
    message.textContent = text;
    message.classList.toggle("error", error);
  }

  input.addEventListener("input", () => { inputCount.textContent = `${input.value.length.toLocaleString("ja-JP")}文字`; });
  analyzeButton.addEventListener("click", analyze);
  maskButton.addEventListener("click", maskSelected);
  clearButton.addEventListener("click", () => {
    input.value = ""; output.value = ""; findings = []; inputCount.textContent = "0文字"; copyButton.disabled = true; message.textContent = ""; render(); input.focus();
  });
  sampleButton.addEventListener("click", () => {
    input.value = `お問い合わせ担当: user@example.com\n電話: 090-1234-5678\n郵便番号: 100-0001\n接続元: 192.168.1.25\n\n{\n  "user": "demo",\n  "password": "demo-password-123",\n  "access_token": "token-value-abcdef123456"\n}\n\nAuthorization: Bearer abcdefghijklmnopqrstuvwxyz123456`;
    inputCount.textContent = `${input.value.length.toLocaleString("ja-JP")}文字`;
    analyze();
  });
  selectAllButton.addEventListener("click", () => { findings.forEach(item => { item.selected = true; }); render(); });
  deselectAllButton.addEventListener("click", () => { findings.forEach(item => { item.selected = false; }); render(); });
  copyButton.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(output.value); setMessage("マスキング結果をコピーしました。"); }
    catch { output.select(); document.execCommand("copy"); setMessage("マスキング結果をコピーしました。"); }
  });
});
