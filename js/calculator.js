const display = document.getElementById("display");

function appendValue(value) {
  display.value += value;
}

function clearDisplay() {
  display.value = "";
}

function deleteLast() {
  display.value = display.value.slice(0, -1);
}

function calculate() {

  if (display.value === "") {
    return;
  }

  try {

    let expression = display.value;

    expression =
      expression.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

    const result =
      Function('"use strict"; return (' + expression + ')')();

    display.value = result;

  } catch (error) {

    display.value = "エラー";

  }

}