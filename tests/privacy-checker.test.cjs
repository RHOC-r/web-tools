const assert = require("node:assert");

function createElement() {
  return {
    value: "",
    textContent: "",
    innerHTML: "",
    disabled: false,
    dataset: {},
    handlers: {},
    classList: { toggle() {} },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    querySelectorAll() { return []; },
    focus() {},
    select() {}
  };
}

const ids = [
  "privacyInput", "maskedOutput", "analyzeButton", "sampleButton", "clearButton",
  "maskButton", "copyButton", "selectAllButton", "deselectAllButton", "findingList",
  "findingToolbar", "highlightPreview", "privacyMessage", "inputCount", "highCount",
  "mediumCount", "lowCount", "findingTotal"
];
const elements = Object.fromEntries(ids.map(id => [id, createElement()]));
let ready;

global.document = {
  addEventListener(type, handler) { if (type === "DOMContentLoaded") ready = handler; },
  getElementById(id) { return elements[id]; },
  execCommand() { return true; }
};
global.navigator = { clipboard: { writeText: async () => {} } };

require("../js/privacy-checker.js");
ready();
elements.sampleButton.handlers.click();

assert(Number(elements.highCount.textContent) >= 3, "高リスク情報を検出できること");
assert(Number(elements.mediumCount.textContent) >= 2, "電話番号と郵便番号を検出できること");
assert(Number(elements.lowCount.textContent) >= 1, "IPアドレスを検出できること");

elements.maskButton.handlers.click();
assert(!elements.maskedOutput.value.includes("user@example.com"), "メールアドレスが残らないこと");
assert(!elements.maskedOutput.value.includes("090-1234-5678"), "電話番号が残らないこと");
assert(!elements.maskedOutput.value.includes("demo-password-123"), "パスワード値が残らないこと");
assert(elements.maskedOutput.value.includes("[メールアドレス]"), "置換ラベルが含まれること");

console.log("privacy-checker tests passed");
