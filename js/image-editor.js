const canvas =
  document.getElementById("editorCanvas");

const ctx =
  canvas.getContext("2d", {
    willReadFrequently: true
  });


/* =====================================================
   ベース画像Canvas
===================================================== */

const baseCanvas =
  document.createElement("canvas");

const baseCtx =
  baseCanvas.getContext("2d", {
    willReadFrequently: true
  });


/* =====================================================
   DOM
===================================================== */

const message =
  document.getElementById(
    "editorMessage"
  );

const editorToolSelect =
  document.getElementById(
    "editorToolSelect"
  );

const toolPanels =
  document.querySelectorAll(
    ".tool-panel"
  );

const updateTextButton =
  document.getElementById(
    "updateTextButton"
  );

const toleranceInput =
  document.getElementById(
    "backgroundTolerance"
  );

const toleranceValue =
  document.getElementById(
    "toleranceValue"
  );


/* =====================================================
   状態
===================================================== */

let imageLoaded =
  false;

let objects = [];

let selectedObject =
  null;

let mode =
  "select";

let isPointerDown =
  false;

let startX = 0;
let startY = 0;

let lastX = 0;
let lastY = 0;

let objectMoved =
  false;

let cropSelection =
  null;

let shapePreview =
  null;


/* =====================================================
   Undo / Redo
===================================================== */

let history = [];

let historyIndex =
  -1;

let originalState =
  null;


/* =====================================================
   初期Canvas
===================================================== */

function drawEmptyCanvas() {

  canvas.width =
    900;

  canvas.height =
    600;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle =
    "#999999";

  ctx.font =
    "24px sans-serif";

  ctx.textAlign =
    "center";

  ctx.fillText(
    "画像を選択してください",
    canvas.width / 2,
    canvas.height / 2
  );

  ctx.textAlign =
    "left";

}

drawEmptyCanvas();


/* =====================================================
   メッセージ
===================================================== */

function setMessage(
  text,
  error = false
) {

  message.textContent =
    text;

  message.classList.toggle(
    "error",
    error
  );

}


/* =====================================================
   編集パネル切り替え
===================================================== */

function showToolPanel(
  toolName
) {

  toolPanels.forEach(
    panel => {

      panel.classList.remove(
        "active"
      );

    }
  );


  const panel =
    document.getElementById(
      `panel-${toolName}`
    );


  if (panel) {

    panel.classList.add(
      "active"
    );

  }


  if (
    toolName === "select" ||
    toolName === "text" ||
    toolName === "overlay"
  ) {

    mode =
      "select";

  }


  if (
    toolName === "shape"
  ) {

    mode =
      "shape";

  }


  if (
    toolName === "draw"
  ) {

    mode =
      "draw";

  }


  if (
    toolName === "crop"
  ) {

    mode =
      "crop";

  }


  if (
    toolName === "background"
  ) {

    mode =
      "background";

  }


  cropSelection =
    null;

  shapePreview =
    null;


  if (imageLoaded) {

    renderScene();

  }

}


editorToolSelect
  .addEventListener(
    "change",
    () => {

      showToolPanel(
        editorToolSelect.value
      );

    }
  );


showToolPanel(
  "select"
);


/* =====================================================
   Canvas座標変換
===================================================== */

function getCanvasPoint(
  event
) {

  const rect =
    canvas.getBoundingClientRect();


  return {

    x:
      (
        event.clientX -
        rect.left
      )
      *
      (
        canvas.width /
        rect.width
      ),

    y:
      (
        event.clientY -
        rect.top
      )
      *
      (
        canvas.height /
        rect.height
      )

  };

}


/* =====================================================
   フォント文字列
===================================================== */

function getFontString(
  object
) {

  return `${
    object.bold
      ? "bold "
      : ""
  }${object.size}px "${object.font}"`;

}


/* =====================================================
   オブジェクト複製
===================================================== */

function cloneObjects(
  source
) {

  return source.map(
    object => {

      return {
        ...object,
        image:
          object.image || null
      };

    }
  );

}


/* =====================================================
   履歴状態作成
===================================================== */

function createState() {

  return {

    width:
      baseCanvas.width,

    height:
      baseCanvas.height,

    imageData:
      baseCtx.getImageData(
        0,
        0,
        baseCanvas.width,
        baseCanvas.height
      ),

    objects:
      cloneObjects(
        objects
      )

  };

}


/* =====================================================
   状態復元
===================================================== */

function restoreState(
  state
) {

  baseCanvas.width =
    state.width;

  baseCanvas.height =
    state.height;

  canvas.width =
    state.width;

  canvas.height =
    state.height;


  baseCtx.clearRect(
    0,
    0,
    state.width,
    state.height
  );


  baseCtx.putImageData(
    state.imageData,
    0,
    0
  );


  objects =
    cloneObjects(
      state.objects
    );


  selectedObject =
    null;

  cropSelection =
    null;

  shapePreview =
    null;

  mode =
    "select";


  editorToolSelect.value =
    "select";

  showToolPanel(
    "select"
  );


  updateTextButton.disabled =
    true;


  renderScene();

}


/* =====================================================
   履歴保存
===================================================== */

function saveHistory() {

  if (!imageLoaded) {
    return;
  }


  history =
    history.slice(
      0,
      historyIndex + 1
    );


  history.push(
    createState()
  );


  historyIndex++;


  if (
    history.length > 50
  ) {

    history.shift();

    historyIndex =
      history.length - 1;

  }


  updateHistoryButtons();

}


/* =====================================================
   Undo
===================================================== */

function undo() {

  if (
    historyIndex <= 0
  ) {

    return;

  }


  historyIndex--;


  restoreState(
    history[
      historyIndex
    ]
  );


  updateHistoryButtons();


  setMessage(
    "1つ前の状態に戻しました。"
  );

}


/* =====================================================
   Redo
===================================================== */

function redo() {

  if (
    historyIndex >=
    history.length - 1
  ) {

    return;

  }


  historyIndex++;


  restoreState(
    history[
      historyIndex
    ]
  );


  updateHistoryButtons();


  setMessage(
    "操作をやり直しました。"
  );

}


/* =====================================================
   Undo / Redoボタン更新
===================================================== */

function updateHistoryButtons() {

  document
    .getElementById(
      "undoButton"
    )
    .disabled =
      historyIndex <= 0;


  document
    .getElementById(
      "redoButton"
    )
    .disabled =
      historyIndex >=
      history.length - 1;

}


/* =====================================================
   Undo / Redoイベント
===================================================== */

document
  .getElementById(
    "undoButton"
  )
  .addEventListener(
    "click",
    undo
  );


document
  .getElementById(
    "redoButton"
  )
  .addEventListener(
    "click",
    redo
  );


document.addEventListener(
  "keydown",
  event => {

    const ctrl =
      event.ctrlKey ||
      event.metaKey;


    if (!ctrl) {
      return;
    }


    if (
      event.key.toLowerCase() === "z" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      undo();

    }


    if (
      event.key.toLowerCase() === "y"
    ) {

      event.preventDefault();

      redo();

    }


    if (
      event.key.toLowerCase() === "z" &&
      event.shiftKey
    ) {

      event.preventDefault();

      redo();

    }

  }
);


/* =====================================================
   ベース画像読み込み
===================================================== */

document
  .getElementById(
    "baseImageInput"
  )
  .addEventListener(
    "change",
    event => {

      const file =
        event.target.files[0];


      if (!file) {
        return;
      }


      const image =
        new Image();


      const url =
        URL.createObjectURL(
          file
        );


      image.onload =
        () => {

          baseCanvas.width =
            image.naturalWidth;

          baseCanvas.height =
            image.naturalHeight;

          canvas.width =
            image.naturalWidth;

          canvas.height =
            image.naturalHeight;


          baseCtx.clearRect(
            0,
            0,
            baseCanvas.width,
            baseCanvas.height
          );


          baseCtx.drawImage(
            image,
            0,
            0
          );


          objects = [];

          selectedObject =
            null;

          cropSelection =
            null;

          shapePreview =
            null;

          imageLoaded =
            true;


          originalState =
            createState();


          history = [
            createState()
          ];


          historyIndex =
            0;


          editorToolSelect.value =
            "select";

          showToolPanel(
            "select"
          );


          updateHistoryButtons();


          renderScene();


          setMessage(
            "画像を読み込みました。"
          );


          URL.revokeObjectURL(
            url
          );

        };


      image.onerror =
        () => {

          URL.revokeObjectURL(
            url
          );


          setMessage(
            "画像を読み込めませんでした。",
            true
          );

        };


      image.src =
        url;

    }
  );


/* =====================================================
   オブジェクト描画
===================================================== */

function drawObject(
  targetCtx,
  object
) {

  targetCtx.save();


  if (
    object.type ===
    "text"
  ) {

    targetCtx.fillStyle =
      object.color;

    targetCtx.font =
      getFontString(
        object
      );

    targetCtx.textBaseline =
      "alphabetic";

    targetCtx.fillText(
      object.text,
      object.x,
      object.y
    );

  }


  if (
    object.type ===
    "image"
  ) {

    targetCtx.drawImage(
      object.image,

      object.x,
      object.y,

      object.width,
      object.height
    );

  }


  targetCtx.restore();

}


/* =====================================================
   オブジェクト範囲
===================================================== */

function getObjectBounds(
  object
) {

  if (
    object.type ===
    "image"
  ) {

    return {

      x:
        object.x,

      y:
        object.y,

      width:
        object.width,

      height:
        object.height

    };

  }


  ctx.save();


  ctx.font =
    getFontString(
      object
    );


  const metrics =
    ctx.measureText(
      object.text
    );


  const width =
    metrics.width;


  ctx.restore();


  return {

    x:
      object.x,

    y:
      object.y -
      object.size,

    width:
      width,

    height:
      object.size *
      1.25

  };

}


/* =====================================================
   選択枠
===================================================== */

function drawSelection(
  object
) {

  if (!object) {
    return;
  }


  const bounds =
    getObjectBounds(
      object
    );


  ctx.save();


  ctx.strokeStyle =
    "#2563eb";

  ctx.lineWidth =
    Math.max(
      2,
      canvas.width / 500
    );

  ctx.setLineDash(
    [8, 6]
  );


  ctx.strokeRect(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height
  );


  ctx.restore();

}


/* =====================================================
   全体描画
===================================================== */

function renderScene() {

  if (!imageLoaded) {
    return;
  }


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.drawImage(
    baseCanvas,
    0,
    0
  );


  objects.forEach(
    object => {

      drawObject(
        ctx,
        object
      );

    }
  );


  if (
    selectedObject &&
    mode === "select"
  ) {

    drawSelection(
      selectedObject
    );

  }


  drawCropPreview();

  drawShapePreview();

}


/* =====================================================
   オブジェクト検索
===================================================== */

function findObject(
  x,
  y
) {

  for (
    let i =
      objects.length - 1;

    i >= 0;

    i--
  ) {

    const object =
      objects[i];


    const bounds =
      getObjectBounds(
        object
      );


    if (
      x >= bounds.x &&
      x <=
        bounds.x +
        bounds.width &&
      y >= bounds.y &&
      y <=
        bounds.y +
        bounds.height
    ) {

      return object;

    }

  }


  return null;

}


/* =====================================================
   選択テキストをフォームへ読み込む
===================================================== */

function loadSelectedTextToForm() {

  if (
    !selectedObject ||
    selectedObject.type !== "text"
  ) {

    updateTextButton.disabled =
      true;

    return;

  }


  document
    .getElementById(
      "textInput"
    )
    .value =
      selectedObject.text;


  document
    .getElementById(
      "fontFamily"
    )
    .value =
      selectedObject.font;


  document
    .getElementById(
      "textSize"
    )
    .value =
      Math.round(
        selectedObject.size
      );


  document
    .getElementById(
      "textColor"
    )
    .value =
      selectedObject.color;


  document
    .getElementById(
      "textBold"
    )
    .checked =
      selectedObject.bold;


  updateTextButton.disabled =
    false;

}


/* =====================================================
   テキスト追加
===================================================== */

document
  .getElementById(
    "addTextButton"
  )
  .addEventListener(
    "click",
    () => {

      if (!imageLoaded) {

        setMessage(
          "先に画像を選択してください。",
          true
        );

        return;

      }


      const text =
        document
          .getElementById(
            "textInput"
          )
          .value
          .trim();


      if (!text) {

        setMessage(
          "テキストを入力してください。",
          true
        );

        return;

      }


      const object = {

        type:
          "text",

        text:
          text,

        x:
          canvas.width *
          0.25,

        y:
          canvas.height *
          0.5,

        size:
          Number(
            document
              .getElementById(
                "textSize"
              )
              .value
          ),

        color:
          document
            .getElementById(
              "textColor"
            )
            .value,

        bold:
          document
            .getElementById(
              "textBold"
            )
            .checked,

        font:
          document
            .getElementById(
              "fontFamily"
            )
            .value

      };


      objects.push(
        object
      );


      selectedObject =
        object;


      mode =
        "select";


      renderScene();


      saveHistory();


      updateTextButton.disabled =
        false;


      setMessage(
        "テキストを追加しました。クリックして編集できます。"
      );

    }
  );


/* =====================================================
   選択中テキスト更新
===================================================== */

updateTextButton
  .addEventListener(
    "click",
    () => {

      if (
        !selectedObject ||
        selectedObject.type !==
          "text"
      ) {

        setMessage(
          "編集するテキストを選択してください。",
          true
        );

        return;

      }


      const newText =
        document
          .getElementById(
            "textInput"
          )
          .value
          .trim();


      if (!newText) {

        setMessage(
          "テキストを入力してください。",
          true
        );

        return;

      }


      selectedObject.text =
        newText;


      selectedObject.font =
        document
          .getElementById(
            "fontFamily"
          )
          .value;


      selectedObject.size =
        Number(
          document
            .getElementById(
              "textSize"
            )
            .value
        );


      selectedObject.color =
        document
          .getElementById(
            "textColor"
          )
          .value;


      selectedObject.bold =
        document
          .getElementById(
            "textBold"
          )
          .checked;


      renderScene();


      saveHistory();


      setMessage(
        "テキストを更新しました。"
      );

    }
  );


/* =====================================================
   画像貼り付け
===================================================== */

document
  .getElementById(
    "overlayImageInput"
  )
  .addEventListener(
    "change",
    event => {

      if (!imageLoaded) {

        setMessage(
          "先に編集する画像を選択してください。",
          true
        );

        return;

      }


      const file =
        event.target.files[0];


      if (!file) {
        return;
      }


      const image =
        new Image();


      const url =
        URL.createObjectURL(
          file
        );


      image.onload =
        () => {

          const maxWidth =
            canvas.width *
            0.4;


          let width =
            image.naturalWidth;

          let height =
            image.naturalHeight;


          if (
            width >
            maxWidth
          ) {

            const ratio =
              maxWidth /
              width;


            width *=
              ratio;

            height *=
              ratio;

          }


          const object = {

            type:
              "image",

            image:
              image,

            width:
              width,

            height:
              height,

            x:
              (
                canvas.width -
                width
              ) / 2,

            y:
              (
                canvas.height -
                height
              ) / 2

          };


          objects.push(
            object
          );


          selectedObject =
            object;


          mode =
            "select";


          editorToolSelect.value =
            "select";


          showToolPanel(
            "select"
          );


          renderScene();


          saveHistory();


          setMessage(
            "画像を貼り付けました。ドラッグで移動できます。"
          );

        };


      image.src =
        url;

    }
  );


/* =====================================================
   選択・拡大縮小・削除
===================================================== */

function resizeSelected(
  scale
) {

  if (!selectedObject) {

    setMessage(
      "対象を選択してください。",
      true
    );

    return;

  }


  if (
    selectedObject.type ===
    "image"
  ) {

    selectedObject.width =
      Math.max(
        10,
        selectedObject.width *
        scale
      );


    selectedObject.height =
      Math.max(
        10,
        selectedObject.height *
        scale
      );

  }


  if (
    selectedObject.type ===
    "text"
  ) {

    selectedObject.size =
      Math.max(
        8,
        selectedObject.size *
        scale
      );


    loadSelectedTextToForm();

  }


  renderScene();


  saveHistory();

}


document
  .getElementById(
    "largerButton"
  )
  .addEventListener(
    "click",
    () => {

      resizeSelected(
        1.1
      );

    }
  );


document
  .getElementById(
    "smallerButton"
  )
  .addEventListener(
    "click",
    () => {

      resizeSelected(
        0.9
      );

    }
  );


document
  .getElementById(
    "deleteObjectButton"
  )
  .addEventListener(
    "click",
    () => {

      if (!selectedObject) {

        setMessage(
          "削除する対象を選択してください。",
          true
        );

        return;

      }


      objects =
        objects.filter(
          object =>
            object !==
            selectedObject
        );


      selectedObject =
        null;


      updateTextButton.disabled =
        true;


      renderScene();


      saveHistory();


      setMessage(
        "選択中のオブジェクトを削除しました。"
      );

    }
  );


/* =====================================================
   図形モード
===================================================== */

document
  .getElementById(
    "shapeButton"
  )
  .addEventListener(
    "click",
    () => {

      if (!imageLoaded) {

        setMessage(
          "先に画像を選択してください。",
          true
        );

        return;

      }


      mode =
        "shape";


      selectedObject =
        null;


      setMessage(
        "画像上をドラッグして図形を描いてください。"
      );


      renderScene();

    }
  );


/* =====================================================
   手書きモード
===================================================== */

document
  .getElementById(
    "drawButton"
  )
  .addEventListener(
    "click",
    () => {

      if (!imageLoaded) {

        setMessage(
          "先に画像を選択してください。",
          true
        );

        return;

      }


      mode =
        "draw";


      selectedObject =
        null;


      renderScene();


      setMessage(
        "画像上をドラッグして描画してください。"
      );

    }
  );


/* =====================================================
   切り抜きモード
===================================================== */

document
  .getElementById(
    "cropButton"
  )
  .addEventListener(
    "click",
    () => {

      if (!imageLoaded) {

        setMessage(
          "先に画像を選択してください。",
          true
        );

        return;

      }


      mode =
        "crop";


      cropSelection =
        null;


      selectedObject =
        null;


      document
        .getElementById(
          "applyCropButton"
        )
        .disabled =
          false;


      renderScene();


      setMessage(
        "切り抜く範囲をドラッグしてください。"
      );

    }
  );


/* =====================================================
   背景削除
===================================================== */

toleranceInput
  .addEventListener(
    "input",
    () => {

      toleranceValue.textContent =
        toleranceInput.value;

    }
  );


document
  .getElementById(
    "backgroundRemoveButton"
  )
  .addEventListener(
    "click",
    () => {

      if (!imageLoaded) {

        setMessage(
          "先に画像を選択してください。",
          true
        );

        return;

      }


      mode =
        "background";


      selectedObject =
        null;


      renderScene();


      setMessage(
        "消したい背景部分をクリックしてください。"
      );

    }
  );


/* =====================================================
   Pointer Down
===================================================== */

canvas.addEventListener(
  "pointerdown",
  event => {

    if (!imageLoaded) {
      return;
    }


    event.preventDefault();


    const point =
      getCanvasPoint(
        event
      );


    startX =
      point.x;

    startY =
      point.y;

    lastX =
      point.x;

    lastY =
      point.y;

    isPointerDown =
      true;

    objectMoved =
      false;


    if (
      mode === "select"
    ) {

      selectedObject =
        findObject(
          point.x,
          point.y
        );


      if (
        selectedObject &&
        selectedObject.type ===
          "text"
      ) {

        editorToolSelect.value =
          "text";


        showToolPanel(
          "text"
        );


        loadSelectedTextToForm();

      } else {

        updateTextButton.disabled =
          true;

      }


      renderScene();

    }


    if (
      mode ===
      "background"
    ) {

      removeBackgroundAt(
        Math.floor(
          point.x
        ),

        Math.floor(
          point.y
        )
      );


      isPointerDown =
        false;

    }

  }
);


/* =====================================================
   Pointer Move
===================================================== */

canvas.addEventListener(
  "pointermove",
  event => {

    if (
      !imageLoaded ||
      !isPointerDown
    ) {

      return;

    }


    const point =
      getCanvasPoint(
        event
      );


    /* 選択移動 */

    if (
      mode === "select" &&
      selectedObject
    ) {

      const dx =
        point.x -
        lastX;


      const dy =
        point.y -
        lastY;


      selectedObject.x +=
        dx;


      selectedObject.y +=
        dy;


      lastX =
        point.x;

      lastY =
        point.y;


      objectMoved =
        true;


      renderScene();

    }


    /* 手書き */

    if (
      mode === "draw"
    ) {

      baseCtx.beginPath();


      baseCtx.moveTo(
        lastX,
        lastY
      );


      baseCtx.lineTo(
        point.x,
        point.y
      );


      baseCtx.strokeStyle =
        document
          .getElementById(
            "drawColor"
          )
          .value;


      baseCtx.lineWidth =
        Number(
          document
            .getElementById(
              "drawWidth"
            )
            .value
        );


      baseCtx.lineCap =
        "round";


      baseCtx.lineJoin =
        "round";


      baseCtx.stroke();


      lastX =
        point.x;

      lastY =
        point.y;


      renderScene();

    }


    /* 切り抜き */

    if (
      mode === "crop"
    ) {

      cropSelection = {

        x:
          Math.min(
            startX,
            point.x
          ),

        y:
          Math.min(
            startY,
            point.y
          ),

        width:
          Math.abs(
            point.x -
            startX
          ),

        height:
          Math.abs(
            point.y -
            startY
          )

      };


      renderScene();

    }


    /* 図形 */

    if (
      mode === "shape"
    ) {

      shapePreview = {

        x1:
          startX,

        y1:
          startY,

        x2:
          point.x,

        y2:
          point.y

      };


      renderScene();

    }

  }
);


/* =====================================================
   Pointer Up
===================================================== */

canvas.addEventListener(
  "pointerup",
  () => {

    if (!isPointerDown) {
      return;
    }


    isPointerDown =
      false;


    if (
      mode === "select" &&
      objectMoved
    ) {

      saveHistory();

    }


    if (
      mode === "draw"
    ) {

      saveHistory();

    }


    if (
      mode === "shape" &&
      shapePreview
    ) {

      commitShape(
        shapePreview
      );


      shapePreview =
        null;


      renderScene();


      saveHistory();

    }

  }
);


/* =====================================================
   図形プレビュー
===================================================== */

function drawShapePreview() {

  if (!shapePreview) {
    return;
  }


  ctx.save();


  ctx.globalAlpha =
    0.7;


  drawShapeToContext(
    ctx,
    shapePreview
  );


  ctx.restore();

}


/* =====================================================
   図形確定
===================================================== */

function commitShape(
  shape
) {

  drawShapeToContext(
    baseCtx,
    shape
  );

}


/* =====================================================
   図形描画
===================================================== */

function drawShapeToContext(
  targetCtx,
  shape
) {

  const type =
    document
      .getElementById(
        "shapeType"
      )
      .value;


  const strokeColor =
    document
      .getElementById(
        "shapeColor"
      )
      .value;


  const lineWidth =
    Number(
      document
        .getElementById(
          "shapeWidth"
        )
        .value
    );


  const fill =
    document
      .getElementById(
        "shapeFill"
      )
      .checked;


  const fillColor =
    document
      .getElementById(
        "shapeFillColor"
      )
      .value;


  const x1 =
    shape.x1;

  const y1 =
    shape.y1;

  const x2 =
    shape.x2;

  const y2 =
    shape.y2;


  targetCtx.save();


  targetCtx.strokeStyle =
    strokeColor;

  targetCtx.fillStyle =
    fillColor;

  targetCtx.lineWidth =
    lineWidth;


  if (
    type ===
    "rectangle"
  ) {

    const x =
      Math.min(
        x1,
        x2
      );

    const y =
      Math.min(
        y1,
        y2
      );

    const width =
      Math.abs(
        x2 - x1
      );

    const height =
      Math.abs(
        y2 - y1
      );


    if (fill) {

      targetCtx.fillRect(
        x,
        y,
        width,
        height
      );

    }


    targetCtx.strokeRect(
      x,
      y,
      width,
      height
    );

  }


  if (
    type ===
    "circle"
  ) {

    const centerX =
      (
        x1 +
        x2
      ) / 2;


    const centerY =
      (
        y1 +
        y2
      ) / 2;


    const radiusX =
      Math.abs(
        x2 -
        x1
      ) / 2;


    const radiusY =
      Math.abs(
        y2 -
        y1
      ) / 2;


    targetCtx.beginPath();


    targetCtx.ellipse(
      centerX,
      centerY,
      radiusX,
      radiusY,
      0,
      0,
      Math.PI * 2
    );


    if (fill) {

      targetCtx.fill();

    }


    targetCtx.stroke();

  }


  if (
    type === "line"
  ) {

    targetCtx.beginPath();


    targetCtx.moveTo(
      x1,
      y1
    );


    targetCtx.lineTo(
      x2,
      y2
    );


    targetCtx.stroke();

  }


  targetCtx.restore();

}


/* =====================================================
   切り抜きプレビュー
===================================================== */

function drawCropPreview() {

  if (!cropSelection) {
    return;
  }


  ctx.save();


  ctx.fillStyle =
    "rgba(0,0,0,0.35)";


  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.save();


  ctx.beginPath();


  ctx.rect(
    cropSelection.x,
    cropSelection.y,
    cropSelection.width,
    cropSelection.height
  );


  ctx.clip();


  ctx.clearRect(
    cropSelection.x,
    cropSelection.y,
    cropSelection.width,
    cropSelection.height
  );


  ctx.drawImage(
    baseCanvas,
    0,
    0
  );


  objects.forEach(
    object => {

      drawObject(
        ctx,
        object
      );

    }
  );


  ctx.restore();


  ctx.strokeStyle =
    "#2563eb";

  ctx.lineWidth =
    3;

  ctx.setLineDash(
    [10, 8]
  );


  ctx.strokeRect(
    cropSelection.x,
    cropSelection.y,
    cropSelection.width,
    cropSelection.height
  );


  ctx.restore();

}


/* =====================================================
   合成Canvas作成
===================================================== */

function createCompositeCanvas() {

  const temp =
    document.createElement(
      "canvas"
    );


  temp.width =
    canvas.width;

  temp.height =
    canvas.height;


  const tempCtx =
    temp.getContext(
      "2d"
    );


  tempCtx.drawImage(
    baseCanvas,
    0,
    0
  );


  objects.forEach(
    object => {

      drawObject(
        tempCtx,
        object
      );

    }
  );


  return temp;

}


/* =====================================================
   オブジェクトを固定
===================================================== */

function flattenObjects() {

  if (
    objects.length === 0
  ) {

    return;

  }


  const composite =
    createCompositeCanvas();


  baseCtx.clearRect(
    0,
    0,
    baseCanvas.width,
    baseCanvas.height
  );


  baseCtx.drawImage(
    composite,
    0,
    0
  );


  objects = [];

  selectedObject =
    null;


  updateTextButton.disabled =
    true;

}


/* =====================================================
   切り抜き実行
===================================================== */

document
  .getElementById(
    "applyCropButton"
  )
  .addEventListener(
    "click",
    () => {

      if (
        !cropSelection ||
        cropSelection.width <
          2 ||
        cropSelection.height <
          2
      ) {

        setMessage(
          "切り抜く範囲を選択してください。",
          true
        );

        return;

      }


      const composite =
        createCompositeCanvas();


      const x =
        Math.max(
          0,
          Math.round(
            cropSelection.x
          )
        );


      const y =
        Math.max(
          0,
          Math.round(
            cropSelection.y
          )
        );


      const width =
        Math.min(
          composite.width - x,
          Math.round(
            cropSelection.width
          )
        );


      const height =
        Math.min(
          composite.height - y,
          Math.round(
            cropSelection.height
          )
        );


      const temp =
        document.createElement(
          "canvas"
        );


      temp.width =
        width;

      temp.height =
        height;


      temp
        .getContext(
          "2d"
        )
        .drawImage(
          composite,

          x,
          y,
          width,
          height,

          0,
          0,
          width,
          height
        );


      baseCanvas.width =
        width;

      baseCanvas.height =
        height;

      canvas.width =
        width;

      canvas.height =
        height;


      baseCtx.drawImage(
        temp,
        0,
        0
      );


      objects = [];

      selectedObject =
        null;

      cropSelection =
        null;


      editorToolSelect.value =
        "select";


      showToolPanel(
        "select"
      );


      saveHistory();


      setMessage(
        "画像を切り抜きました。"
      );

    }
  );


/* =====================================================
   背景削除処理
===================================================== */

function removeBackgroundAt(
  x,
  y
) {

  flattenObjects();


  const imageData =
    baseCtx.getImageData(
      0,
      0,
      baseCanvas.width,
      baseCanvas.height
    );


  const data =
    imageData.data;


  const width =
    baseCanvas.width;

  const height =
    baseCanvas.height;


  if (
    x < 0 ||
    y < 0 ||
    x >= width ||
    y >= height
  ) {

    return;

  }


  const startIndex =
    (
      y *
      width +
      x
    ) * 4;


  const targetR =
    data[
      startIndex
    ];

  const targetG =
    data[
      startIndex + 1
    ];

  const targetB =
    data[
      startIndex + 2
    ];


  const tolerance =
    Number(
      toleranceInput.value
    );


  const visited =
    new Uint8Array(
      width *
      height
    );


  const stack = [
    x,
    y
  ];


  function similar(
    r,
    g,
    b
  ) {

    const dr =
      r - targetR;

    const dg =
      g - targetG;

    const db =
      b - targetB;


    return (
      Math.sqrt(
        dr * dr +
        dg * dg +
        db * db
      )
      <= tolerance
    );

  }


  while (
    stack.length >
    0
  ) {

    const currentY =
      stack.pop();

    const currentX =
      stack.pop();


    if (
      currentX < 0 ||
      currentY < 0 ||
      currentX >= width ||
      currentY >= height
    ) {

      continue;

    }


    const pixelIndex =
      currentY *
      width +
      currentX;


    if (
      visited[
        pixelIndex
      ]
    ) {

      continue;

    }


    visited[
      pixelIndex
    ] = 1;


    const index =
      pixelIndex * 4;


    if (
      !similar(
        data[index],
        data[index + 1],
        data[index + 2]
      )
    ) {

      continue;

    }


    data[
      index + 3
    ] = 0;


    stack.push(
      currentX + 1,
      currentY,

      currentX - 1,
      currentY,

      currentX,
      currentY + 1,

      currentX,
      currentY - 1
    );

  }


  baseCtx.putImageData(
    imageData,
    0,
    0
  );


  renderScene();


  saveHistory();


  setMessage(
    "背景を透明化しました。"
  );

}


/* =====================================================
   フィルター
===================================================== */

document
  .getElementById(
    "applyFilterButton"
  )
  .addEventListener(
    "click",
    () => {

      if (!imageLoaded) {

        setMessage(
          "先に画像を選択してください。",
          true
        );

        return;

      }


      flattenObjects();


      const brightness =
        document
          .getElementById(
            "brightness"
          )
          .value;


      const contrast =
        document
          .getElementById(
            "contrast"
          )
          .value;


      const saturation =
        document
          .getElementById(
            "saturation"
          )
          .value;


      const grayscale =
        document
          .getElementById(
            "grayscale"
          )
          .checked
          ? 100
          : 0;


      const temp =
        document.createElement(
          "canvas"
        );


      temp.width =
        baseCanvas.width;

      temp.height =
        baseCanvas.height;


      temp
        .getContext(
          "2d"
        )
        .drawImage(
          baseCanvas,
          0,
          0
        );


      baseCtx.clearRect(
        0,
        0,
        baseCanvas.width,
        baseCanvas.height
      );


      baseCtx.save();


      baseCtx.filter =
        `brightness(${brightness}%)
         contrast(${contrast}%)
         saturate(${saturation}%)
         grayscale(${grayscale}%)`;


      baseCtx.drawImage(
        temp,
        0,
        0
      );


      baseCtx.restore();


      renderScene();


      saveHistory();


      setMessage(
        "画像調整を適用しました。"
      );

    }
  );


/* =====================================================
   回転
===================================================== */

document
  .getElementById(
    "rotateLeftButton"
  )
  .addEventListener(
    "click",
    () => {

      rotateCanvas(
        -90
      );

    }
  );


document
  .getElementById(
    "rotateRightButton"
  )
  .addEventListener(
    "click",
    () => {

      rotateCanvas(
        90
      );

    }
  );


function rotateCanvas(
  degrees
) {

  if (!imageLoaded) {
    return;
  }


  const composite =
    createCompositeCanvas();


  const temp =
    document.createElement(
      "canvas"
    );


  temp.width =
    composite.height;

  temp.height =
    composite.width;


  const tempCtx =
    temp.getContext(
      "2d"
    );


  tempCtx.translate(
    temp.width / 2,
    temp.height / 2
  );


  tempCtx.rotate(
    degrees *
    Math.PI /
    180
  );


  tempCtx.drawImage(
    composite,

    -composite.width /
      2,

    -composite.height /
      2
  );


  baseCanvas.width =
    temp.width;

  baseCanvas.height =
    temp.height;

  canvas.width =
    temp.width;

  canvas.height =
    temp.height;


  baseCtx.drawImage(
    temp,
    0,
    0
  );


  objects = [];

  selectedObject =
    null;


  renderScene();


  saveHistory();


  setMessage(
    "画像を回転しました。"
  );

}


/* =====================================================
   反転
===================================================== */

document
  .getElementById(
    "flipHorizontalButton"
  )
  .addEventListener(
    "click",
    () => {

      flipCanvas(
        true
      );

    }
  );


document
  .getElementById(
    "flipVerticalButton"
  )
  .addEventListener(
    "click",
    () => {

      flipCanvas(
        false
      );

    }
  );


function flipCanvas(
  horizontal
) {

  if (!imageLoaded) {
    return;
  }


  const composite =
    createCompositeCanvas();


  baseCtx.clearRect(
    0,
    0,
    baseCanvas.width,
    baseCanvas.height
  );


  baseCtx.save();


  if (horizontal) {

    baseCtx.translate(
      baseCanvas.width,
      0
    );


    baseCtx.scale(
      -1,
      1
    );

  } else {

    baseCtx.translate(
      0,
      baseCanvas.height
    );


    baseCtx.scale(
      1,
      -1
    );

  }


  baseCtx.drawImage(
    composite,
    0,
    0
  );


  baseCtx.restore();


  objects = [];

  selectedObject =
    null;


  renderScene();


  saveHistory();


  setMessage(
    "画像を反転しました。"
  );

}


/* =====================================================
   保存
===================================================== */

document
  .getElementById(
    "saveButton"
  )
  .addEventListener(
    "click",
    () => {

      if (!imageLoaded) {

        setMessage(
          "画像がありません。",
          true
        );

        return;

      }


      const composite =
        createCompositeCanvas();


      const format =
        document
          .getElementById(
            "saveFormat"
          )
          .value;


      let mime =
        "image/png";

      let extension =
        "png";

      let outputCanvas =
        composite;


      if (
        format === "jpeg"
      ) {

        mime =
          "image/jpeg";

        extension =
          "jpg";


        const jpegCanvas =
          document.createElement(
            "canvas"
          );


        jpegCanvas.width =
          composite.width;

        jpegCanvas.height =
          composite.height;


        const jpegCtx =
          jpegCanvas.getContext(
            "2d"
          );


        jpegCtx.fillStyle =
          "#ffffff";


        jpegCtx.fillRect(
          0,
          0,
          jpegCanvas.width,
          jpegCanvas.height
        );


        jpegCtx.drawImage(
          composite,
          0,
          0
        );


        outputCanvas =
          jpegCanvas;

      }


      const link =
        document.createElement(
          "a"
        );


      link.download =
        `edited-image.${extension}`;


      link.href =
        outputCanvas.toDataURL(
          mime,
          0.92
        );


      link.click();


      setMessage(
        "画像を保存しました。"
      );

    }
  );


/* =====================================================
   リセット
===================================================== */

document
  .getElementById(
    "resetButton"
  )
  .addEventListener(
    "click",
    () => {

      if (
        !originalState
      ) {

        return;

      }


      restoreState(
        originalState
      );


      history = [
        createState()
      ];


      historyIndex =
        0;


      updateHistoryButtons();


      setMessage(
        "編集内容をリセットしました。"
      );

    }
  );