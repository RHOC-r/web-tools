const columnTableBody =
  document.getElementById("columnTableBody");

const sqlOutput =
  document.getElementById("sqlOutput");

const message =
  document.getElementById("message");


/* =========================
   カラム追加
========================= */

function addColumn(
  columnName = "",
  type = "",
  size = ""
) {

  const row =
    document.createElement("tr");


  row.innerHTML = `

    <td>

      <input
        type="text"
        class="column-name"
        placeholder="例：user_id"
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

        <option value="TINYINT">
          TINYINT
        </option>

        <option value="SMALLINT">
          SMALLINT
        </option>

        <option value="DECIMAL">
          DECIMAL
        </option>

        <option value="FLOAT">
          FLOAT
        </option>

        <option value="DOUBLE">
          DOUBLE
        </option>

        <option value="VARCHAR">
          VARCHAR
        </option>

        <option value="CHAR">
          CHAR
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

        <option value="TIMESTAMP">
          TIMESTAMP
        </option>

        <option value="TIME">
          TIME
        </option>

        <option value="BOOLEAN">
          BOOLEAN
        </option>

        <option value="JSON">
          JSON
        </option>

      </select>

    </td>


    <td>

      <input
        type="text"
        class="column-size"
        placeholder="例：255 / 10,2"
      >

    </td>


    <td class="checkbox-cell">

      <input
        type="checkbox"
        class="column-primary"
        title="PRIMARY KEY"
      >

    </td>


    <td class="checkbox-cell">

      <input
        type="checkbox"
        class="column-not-null"
        title="NOT NULL"
      >

    </td>


    <td class="checkbox-cell">

      <input
        type="checkbox"
        class="column-unique"
        title="UNIQUE"
      >

    </td>


    <td class="checkbox-cell">

      <input
        type="checkbox"
        class="column-auto-increment"
        title="AUTO_INCREMENT"
      >

    </td>


    <td>

      <input
        type="text"
        class="column-default"
        placeholder="例：0 / CURRENT_TIMESTAMP"
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
    ".column-name"
  ).value = columnName;


  row.querySelector(
    ".column-type"
  ).value = type;


  row.querySelector(
    ".column-size"
  ).value = size;

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
   CREATE TABLE生成
========================= */

function generateSQL() {

  clearMessage();


  const inputTableName =
    document
      .getElementById("tableName")
      .value
      .trim();


  const tableName =
    inputTableName ||
    "__TABLE_NAME__";


  const rows =
    columnTableBody.querySelectorAll("tr");


  if (rows.length === 0) {

    showError(
      "カラムを1つ以上追加してください。"
    );

    return;

  }


  const definitions = [];


  for (
    let index = 0;
    index < rows.length;
    index++
  ) {

    const row =
      rows[index];


    const inputColumnName =
      row
        .querySelector(".column-name")
        .value
        .trim();


    const type =
      row
        .querySelector(".column-type")
        .value;


    const size =
      row
        .querySelector(".column-size")
        .value
        .trim();


    const primary =
      row
        .querySelector(".column-primary")
        .checked;


    const notNull =
      row
        .querySelector(".column-not-null")
        .checked;


    const unique =
      row
        .querySelector(".column-unique")
        .checked;


    const autoIncrement =
      row
        .querySelector(
          ".column-auto-increment"
        )
        .checked;


    const defaultValue =
      row
        .querySelector(".column-default")
        .value
        .trim();


    /*
     * データ型だけ必須
     */

    if (!type) {

      showError(
        `${index + 1}行目のデータ型を選択してください。`
      );

      return;

    }


    const columnName =
      inputColumnName ||
      `__COLUMN_${index + 1}__`;


    let definition =
      `${columnName} ${type}`;


    /*
     * サイズ
     */

    if (size) {

      definition +=
        `(${size})`;

    }


    /*
     * 制約
     */

    if (primary) {

      definition +=
        " PRIMARY KEY";

    }


    if (notNull) {

      definition +=
        " NOT NULL";

    }


    if (unique) {

      definition +=
        " UNIQUE";

    }


    if (autoIncrement) {

      definition +=
        " AUTO_INCREMENT";

    }


    /*
     * DEFAULT
     */

    if (defaultValue) {

      definition +=
        " DEFAULT " +
        formatDefaultValue(
          defaultValue,
          type
        );

    }


    definitions.push(
      "  " + definition
    );

  }


  const sql =
`CREATE TABLE ${tableName} (
${definitions.join(",\n")}
);`;


  sqlOutput.value = sql;


  showSuccess(
    "CREATE TABLE文を生成しました。"
  );

}


/* =========================
   DEFAULT値
========================= */

function formatDefaultValue(
  value,
  type
) {

  const upper =
    value.toUpperCase();


  /*
   * SQLキーワードはそのまま
   */

  const keywords = [

    "NULL",
    "CURRENT_TIMESTAMP",
    "CURRENT_DATE",
    "CURRENT_TIME",
    "TRUE",
    "FALSE"

  ];


  if (
    keywords.includes(upper)
  ) {

    return upper;

  }


  /*
   * 数値型
   */

  const numericTypes = [

    "INT",
    "BIGINT",
    "TINYINT",
    "SMALLINT",
    "DECIMAL",
    "FLOAT",
    "DOUBLE"

  ];


  if (
    numericTypes.includes(type) &&
    !Number.isNaN(Number(value))
  ) {

    return value;

  }


  /*
   * すでにクォートされている場合
   */

  if (
    value.startsWith("'") &&
    value.endsWith("'")
  ) {

    return value;

  }


  /*
   * 文字列
   */

  const escaped =
    value.replace(
      /'/g,
      "''"
    );


  return `'${escaped}'`;

}


/* =========================
   コピー
========================= */

async function copySQL() {

  if (
    sqlOutput.value.trim() === ""
  ) {

    showError(
      "コピーするSQLがありません。"
    );

    return;

  }


  try {

    await navigator.clipboard.writeText(
      sqlOutput.value
    );


    showCopyMessage();


  } catch (error) {


    sqlOutput.select();


    document.execCommand(
      "copy"
    );


    showCopyMessage();

  }

}


/* =========================
   コピー完了
========================= */

function showCopyMessage() {

  message.textContent =
    "コピーしました。";


  message.className =
    "message success";


  setTimeout(() => {

    if (
      message.textContent ===
      "コピーしました。"
    ) {

      clearMessage();

    }

  }, 3000);

}


/* =========================
   メッセージ
========================= */

function showError(text) {

  message.textContent =
    text;


  message.className =
    "message error";

}


function showSuccess(text) {

  message.textContent =
    text;


  message.className =
    "message success";

}


function clearMessage() {

  message.textContent =
    "";


  message.className =
    "message";

}


/* =========================
   初期表示
========================= */

addColumn(
  "id",
  "BIGINT",
  ""
);

addColumn(
  "name",
  "VARCHAR",
  "100"
);

addColumn(
  "created_at",
  "DATETIME",
  ""
);