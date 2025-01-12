import * as PIXI from "pixi.js";

const vertex = "in vec2 aPosition;\nout vec2 vTextureCoord;\n\nuniform vec4 uInputSize;\nuniform vec4 uOutputFrame;\nuniform vec4 uOutputTexture;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;\n    \n    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aPosition * (uOutputFrame.zw * uInputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";
const fragment = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec3 originalColor;
uniform vec3 newColor;
uniform float epsilon;

float colorDifference(vec4 c1, vec4 c2) {
    vec4 delta = c1 - c2;
    return length(delta);
}

void main(void) {
    vec4 currentColor = texture2D(uSampler, vTextureCoord);
    vec4 whiteColor = vec4(1.0);
    float difference = colorDifference(currentColor, whiteColor);

    if (difference > 0.05) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent black
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.5);
    }
}
`;

export class PixiRemoveBgColourFilter extends PIXI.Filter {
    constructor() {
        super({
            glProgram: new PIXI.GlProgram({
                vertex,
                fragment,
            }),
            resources: {
                // uniforms can go here
            },
        });
    }
}
