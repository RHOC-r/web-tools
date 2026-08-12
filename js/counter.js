const textInput = document.getElementById("textInput");

const charCount = document.getElementById("charCount");
const noSpaceCount = document.getElementById("noSpaceCount");
const lineCount = document.getElementById("lineCount");
const wordCount = document.getElementById("wordCount");

textInput.addEventListener("input", () => {

  const text = textInput.value;

  // 全文字数
  charCount.textContent = text.length;

  // 空白・改行を除外
  noSpaceCount.textContent =
    text.replace(/\s/g, "").length;

  // 行数
  if (text.length === 0) {
    lineCount.textContent = 0;
  } else {
    lineCount.textContent =
      text.split("\n").length;
  }

  // 単語数
  const words =
    text.trim().split(/\s+/).filter(word => word !== "");

  wordCount.textContent =
    text.trim() === "" ? 0 : words.length;

});