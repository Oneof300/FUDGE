var TableControl;
(function (TableControl) {
    var ƒui = FudgeUserInterface;
    let controller = new TableControl.TableControlData();
    let table = new ƒui.Table(controller, Object.values(TableControl.assoc));
    document.body.appendChild(table);
})(TableControl || (TableControl = {}));
//# sourceMappingURL=Main.js.map