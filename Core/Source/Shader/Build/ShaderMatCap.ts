namespace FudgeCore {
/** Code generated by CompileShaders.mjs using the information in CompileShaders.json */

export abstract class ShaderMatCap extends Shader {
  public static readonly iSubclass: number = Shader.registerSubclass(ShaderMatCap);

  public static getCoat(): typeof Coat { return CoatMatCap; }

  public static getVertexShaderSource(): string { 
return `#version 300 es
/**
* Matcap (Material Capture) shading. The texture provided by the coat is used as a matcap material. 
* Implementation based on https://www.clicktorelease.com/blog/creating-spherical-environment-mapping-shader/
* @authors Simon Storl-Schulke, HFU, 2019 | Jirka Dell'Oro-Friedl, HFU, 2019
*/
in vec3 a_vctPosition;
in vec3 a_vctNormalFace;

uniform mat4 u_mtxProjection;

out vec2 texcoords_smooth;
flat out vec2 texcoords_flat;

void main() {
    texcoords_smooth = normalize(mat3(u_mtxProjection) * a_vctNormalFace).xy * 0.5 - 0.5;
    texcoords_flat = texcoords_smooth;
    gl_Position = u_mtxProjection * vec4(a_vctPosition, 1.0);
}
`; }

  public static getFragmentShaderSource(): string { 
return `#version 300 es
/**
* Matcap (Material Capture) shading. The texture provided by the coat is used as a matcap material. 
* Implementation based on https://www.clicktorelease.com/blog/creating-spherical-environment-mapping-shader/
* @authors Simon Storl-Schulke, HFU, 2019 | Jirka Dell'Oro-Friedl, HFU, 2019
*/
precision mediump float;

uniform vec4 u_tint_color;
uniform int shade_smooth;
uniform sampler2D u_texture;

in vec2 texcoords_smooth;
flat in vec2 texcoords_flat;

out vec4 vctFrag;

void main() {

    if (shade_smooth > 0) {
      vctFrag = u_tint_color * texture(u_texture, texcoords_smooth) * 2.0;
    } else {
      vctFrag = u_tint_color * texture(u_texture, texcoords_flat) * 2.0;
    }
}
`; }
}
}