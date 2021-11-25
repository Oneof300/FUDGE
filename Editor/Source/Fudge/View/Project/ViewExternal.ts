namespace Fudge {
  import ƒ = FudgeCore;
  import ƒui = FudgeUserInterface;

  /**
   * List the external resources
   * @author Jirka Dell'Oro-Friedl, HFU, 2020  
   */
  export class ViewExternal extends View {
    private tree: ƒui.Tree<DirectoryEntry>;

    constructor(_container: ComponentContainer, _state: JsonValue | undefined) {
      super(_container, _state);

      this.dom.addEventListener(EVENT_EDITOR.SET_PROJECT, this.hndEvent);
      this.dom.addEventListener(EVENT_EDITOR.UPDATE, this.hndEvent);
    }

    public setProject(): void {
      while (this.dom.lastChild && this.dom.removeChild(this.dom.lastChild));
      let path: string = new URL(".", ƒ.Project.baseURL).pathname;
      if (navigator.platform == "Win32" || navigator.platform == "Win64" ) {
        path = path.substr(1); // strip leading slash
      }
      let root: DirectoryEntry = DirectoryEntry.createRoot(path);
      this.tree = new ƒui.Tree<DirectoryEntry>(new ControllerTreeDirectory(), root);
      this.dom.appendChild(this.tree);
      this.tree.getItems()[0].expand(true);

      this.dom.title = "Drag & drop external image, audiofile etc. to the view Internal, to create a FUDGE-resource";
    }

    public getSelection(): DirectoryEntry[] {
      return this.tree.controller.selection;
    }
    
    public getDragDropSources(): DirectoryEntry[] {
      return this.tree.controller.dragDrop.sources;
    }

    private hndEvent = (_event: CustomEvent): void => {
      this.setProject();
    }
  }
}