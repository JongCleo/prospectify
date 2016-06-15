
var potato =
{
  "menu":
  {
    "id": "file",
    "value": "File",
    "popup":
    {
      "menuitem": [
        {"value": "New", "onclick": "CreateNewDoc()"},
        {"value": "Open", "onclick": "OpenDoc()"},
        {"value": "Close", "onclick": "CloseDoc()"}
      ]
    }
  }
}
console.log(potato.menu.popup.menuitem[0].value);
