namespace Fudge {
    import ƒ = FudgeCore;
    import ƒui = FudgeUserInterface;
  
    /**
     * TODO: add
     * @authors Jonas Plotzky, HFU, 2022
     */
    export class PanelParticleSystem extends Panel {
      constructor(_container: ComponentContainer, _state: JsonValue | undefined) {
        super(_container, _state);
  

        this.goldenLayout.registerComponentConstructor(VIEW.PARTICLE_SYSTEM, ViewParticleSystem);
  
        const config: RowOrColumnItemConfig = {
            type: "column",
            content: [{
              type: "component",
              componentType: VIEW.PARTICLE_SYSTEM,
              componentState: _state,
              title: "Particle System"
            }]
          };
  
  
        this.goldenLayout.rootItem.layoutManager.addItemAtLocation(config, [
          { typeId: LayoutManager.LocationSelector.TypeId.Root }
        ]);
  
  
        this.setTitle("Particle System | " );
      }
  
      public getState(): { [key: string]: string } {
        // TODO: iterate over views and collect their states for reconstruction
        return {};
      }
    }
  }
  