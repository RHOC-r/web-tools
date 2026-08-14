const columnTableBody =
  document.getElementById("columnTableBody");

const sqlOutput =
  document.getElementById("sqlOutput");

const message =
  document.getElementById("message");

const outputInfo =
  document.getElementById("outputInfo");


let columnNumber = 0;


/* =========================
   カラム追加
========================= */

function addColumn(
  columnName = "",
  type = "STRING",
  example = "",
  count = 10
) {

  columnNumber++;

  const row =
    document.createElement("tr");


  row.innerHTML = `

    <td>

      <input
        type="text"
        class="column-name"
        placeholder="例：username"
        value="${escapeHTML(columnName)}"
        autocomplete="off"
      >

    </td>


    <td>

      <select class="column-type">

        <option value="">
          選択してください
        </option>

        <option value="INT">
          INT
        </option>

        <option value="BIGINT">
          BIGINT
        </option>

        <option value="DECIMAL">
          DECIMAL
        </option>

        <option value="STRING">
          STRING
        </option>

        <option value="TEXT">
          TEXT
        </option>

        <option value="DATE">
          DATE
        </option>

        <option value="DATETIME">
          DATETIME
        </option>

        <option value="BOOLEAN">
          BOOLEAN
        </option>

        <option value="UUID">
          UUID
        </option>

      </select>

    </td>


    <td>

      <input
        type="text"
        class="column-example"
        placeholder="例：user_001"
        value="${escapeHTML(example)}"
        autocomplete="off"
      >

    </td>


    <td>

      <input
        type="number"
        class="column-count"
        min="1"
        max="100000"
        value="${count}"
      >

    </td>


    <td>

      <button
        type="button"
        class="delete-column-button"
        onclick="removeColumn(this)"
      >
        削除
      </button>

    </td>

  `;


  columnTableBody.appendChild(row);


  row.querySelector(
    ".column-type"
  ).value = type;

}


/* =========================
   カラム削除
========================= */

function removeColumn(button) {

  const row =
    button.closest("tr");

  row.remove();

}


/* =========================
   SQL生成
========================= */

function generateSQL() {

  clearMessage();


  const tableNameInput =
    document.getElementById("tableName");

  const tableName =
    tableNameInput.value.trim()
      || "__TABLE_NAME__";


  const rows =
    columnTableBody.querySelectorAll("tr");


  if (rows.length === 0) {

    showError(
      "カラムを1つ以上追加してください。"
    );

    return;

  }


  const columns = [];

  let maximumCount = 0;


  for (
    let index = 0;
    index < rows.length;
    index++
  ) {

    const row =
      rows[index];


    const columnName =
      row
        .querySelector(".column-name")
        .value
        .trim();


    const type =
      row
        .querySelector(".column-type")
        .value;


    const example =
      row
        .querySelector(".column-example")
        .value
        .trim();


    const count =
      Number(
        row
          .querySelector(".column-count")
          .value
      );


    /* 型は必須 */

    if (!type) {

      showError(
        `${index + 1}行目の型を選択してください。`
      );

      return;

    }


    /* データ数も必須 */

    if (
      !Number.isInteger(count) ||
      count <= 0
    ) {

      showError(
        `${index + 1}行目のデータ数を正しく入力してください。`
      );

      return;

    }


    const finalColumnName =
      columnName ||
      `__COLUMN_${index + 1}__`;


    columns.push({

      name: finalColumnName,

      type: type,

      example: example,

      count: count

    });


    if (count > maximumCount) {
      maximumCount = count;
    }

  }


  const columnNames =
    columns
      .map(column => column.name)
      .join(", ");


  const values = [];


  for (
    let rowIndex = 0;
    rowIndex < maximumCount;
    rowIndex++
  ) {

    const rowValues =
      columns.map(column => {

        /*
         * カラムの指定件数を超えたら
         * NULLを出力
         */

        if (
          rowIndex >= column.count
        ) {

          return "NULL";

        }


        return generateValue(
          column.type,
          column.example,
          rowIndex
        );

      });


    values.push(
      `(${rowValues.join(", ")})`
    );

  }


  const sql =
`INSERT INTO ${tableName} (${columnNames}) VALUES
${values.join(",\n")};`;


  sqlOutput.value = sql;


  outputInfo.textContent =
    `${maximumCount.toLocaleString()}件のINSERT用テストデータを生成しました。`;


  showSuccess(
    "INSERT文を生成しました。"
  );

}


/* =========================
   値生成
========================= */

function generateValue(
  type,
  example,
  index
) {

  const number =
    index + 1;


  switch (type) {

    case "INT":

      return generateInteger(
        example,
        index
      );


    case "BIGINT":

      return generateInteger(
        example,
        index
      );


    case "DECIMAL":

      return generateDecimal(
        example,
        index
      );


    case "STRING":

      return quoteSQL(
        generateString(
          example,
          number
        )
      );


    case "TEXT":

      return quoteSQL(
        generateString(
          example,
          number
        )
      );


    case "DATE":

      return quoteSQL(
        generateDate(
          example,
          index
        )
      );


    case "DATETIME":

      return quoteSQL(
        generateDateTime(
          example,
          index
        )
      );


    case "BOOLEAN":

      return generateBoolean(
        example,
        index
      );


    case "UUID":

      return quoteSQL(
        generateUUID()
      );


    default:

      return "NULL";

  }

}


/* =========================
   INT / BIGINT
========================= */

function generateInteger(
  example,
  index
) {

  if (example === "") {

    return String(
      index + 1
    );

  }


  const value =
    Number(example);


  if (
    Number.isInteger(value)
  ) {

    return String(
      value + index
    );

  }


  /*
   * INTなのに文字列例が入力された場合は
   * 1,2,3...を生成
   */

  return String(
    index + 1
  );

}


/* =========================
   DECIMAL
========================= */

function generateDecimal(
  example,
  index
) {

  if (example === "") {

    return (
      index + 1
    ).toFixed(2);

  }


  const value =
    Number(example);


  if (
    Number.isNaN(value)
  ) {

    return (
      index + 1
    ).toFixed(2);

  }


  /*
   * 入力された小数点以下の
   * 桁数を維持
   */

  const decimalPart =
    example.split(".")[1];


  const decimalPlaces =
    decimalPart
      ? decimalPart.length
      : 2;


  return (
    value + index
  ).toFixed(
    decimalPlaces
  );

}


/* =========================
   STRING / TEXT
========================= */

function generateString(
  example,
  number
) {

  if (example === "") {

    return `test_${number}`;

  }


  /*
   * 文字列内の最後の数字を取得
   *
   * user_001
   * ↓
   * user_001
   * user_002
   *
   * test001@mail.com
   * ↓
   * test001@mail.com
   * test002@mail.com
   */

  const match =
    example.match(
      /(\d+)(?!.*\d)/
    );


  if (!match) {

    /*
     * 数字が存在しない場合
     *
     * user
     * ↓
     * user_1
     * user_2
     */

    return `${example}_${number}`;

  }


  const originalNumber =
    match[1];


  const startNumber =
    Number(originalNumber);


  const newNumber =
    String(
      startNumber + number - 1
    ).padStart(
      originalNumber.length,
      "0"
    );


  const startPosition =
    match.index;


  const endPosition =
    startPosition +
    originalNumber.length;


  return (
    example.substring(
      0,
      startPosition
    )
    +
    newNumber
    +
    example.substring(
      endPosition
    )
  );

}


/* =========================
   DATE
========================= */

function generateDate(
  example,
  index
) {

  let date;


  if (example === "") {

    /*
     * 例が空なら固定基準日から生成
     */

    date =
      new Date(
        2026,
        0,
        1
      );

  } else {

    date =
      parseDate(example);


    if (!date) {

      date =
        new Date(
          2026,
          0,
          1
        );

    }

  }


  date.setDate(
    date.getDate() + index
  );


  return formatDate(date);

}


/* =========================
   DATETIME
========================= */

function generateDateTime(
  example,
  index
) {

  let date;


  if (example === "") {

    date =
      new Date(
        2026,
        0,
        1,
        0,
        0,
        0
      );

  } else {

    const normalized =
      example.replace(
        " ",
        "T"
      );


    date =
      new Date(normalized);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      date =
        new Date(
          2026,
          0,
          1,
          0,
          0,
          0
        );

    }

  }


  /*
   * 1件ごとに1秒進める
   */

  date.setSeconds(
    date.getSeconds() + index
  );


  return (
    formatDate(date)
    +
    " "
    +
    String(
      date.getHours()
    ).padStart(2, "0")
    +
    ":"
    +
    String(
      date.getMinutes()
    ).padStart(2, "0")
    +
    ":"
    +
    String(
      date.getSeconds()
    ).padStart(2, "0")
  );

}


/* =========================
   BOOLEAN
========================= */

function generateBoolean(
  example,
  index
) {

  if (example !== "") {

    const normalized =
      example
        .toLowerCase()
        .trim();


    if (
      normalized === "true" ||
      normalized === "1"
    ) {

      return (
        index % 2 === 0
          ? "TRUE"
          : "FALSE"
      );

    }


    if (
      normalized === "false" ||
      normalized === "0"
    ) {

      return (
        index % 2 === 0
          ? "FALSE"
          : "TRUE"
      );

    }

  }


  return (
    index % 2 === 0
      ? "TRUE"
      : "FALSE"
  );

}


/* =========================
   UUID
========================= */

function generateUUID() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();

  }


  return (
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
  ).replace(
    /[xy]/g,
    function(character) {

      const random =
        Math.random() * 16 | 0;


      const value =
        character === "x"
          ? random
          : (
              random & 0x3 |
              0x8
            );


      return value.toString(16);

    }
  );

}


/* =========================
   日付処理
========================= */

function parseDate(value) {

  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );


  if (!match) {
    return null;
  }


  const year =
    Number(match[1]);

  const month =
    Number(match[2]) - 1;

  const day =
    Number(match[3]);


  const date =
    new Date(
      year,
      month,
      day
    );


  /*
   * 2026-99-99などを除外
   */

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {

    return null;

  }


  return date;

}


function formatDate(date) {

  return (
    date.getFullYear()
    +
    "-"
    +
    String(
      date.getMonth() + 1
    ).padStart(2, "0")
    +
    "-"
    +
    String(
      date.getDate()
    ).padStart(2, "0")
  );

}


/* =========================
   SQL文字列
========================= */

function quoteSQL(value) {

  /*
   * ' を '' に変換
   *
   * O'Brien
   * ↓
   * O''Brien
   */

  const escaped =
    String(value)
      .replace(
        /'/g,
        "''"
      );


  return `'${escaped}'`;

}


/* =========================
   コピー
========================= */

async function copySQL() {

  if (sqlOutput.value.trim() === "") {
    showError("コピーするSQLがありません。");
    return;
  }

  try {

    await navigator.clipboard.writeText(
      sqlOutput.value
    );

    showCopyMessage();

  } catch (error) {

    // Clipboard APIが使用できない場合
    sqlOutput.select();

    document.execCommand("copy");

    showCopyMessage();

  }

}


function showCopyMessage() {

  message.textContent = "コピーしました。";

  message.className = "message success";

  // 3秒後にメッセージを消す
  setTimeout(() => {

    if (message.textContent === "コピーしました。") {

      message.textContent = "";
      message.className = "message";

    }

  }, 3000);

}


/* =========================
   メッセージ
========================= */

function showError(text) {

  message.textContent = text;

  message.className =
    "message error";

}


function showSuccess(text) {

  message.textContent = text;

  message.className =
    "message success";

}


function clearMessage() {

  message.textContent = "";

  message.className =
    "message";

}


/* =========================
   HTMLエスケープ
========================= */

function escapeHTML(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================
   初期カラム
========================= */

addColumn(
  "id",
  "INT",
  "1",
  10
);

addColumn(
  "name",
  "STRING",
  "test_1",
  10
);

addColumn(
  "created_at",
  "DATETIME",
  "2026-01-01 00:00:00",
  10
);