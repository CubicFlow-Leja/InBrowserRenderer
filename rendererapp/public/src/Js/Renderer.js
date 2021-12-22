//opengl
let VertShaderText =
    [
        'precision mediump float;',
        '',
        'attribute vec3 vertPosition;',
        'attribute vec3 vertColor;',
        'attribute vec2 texCoord;',
        '',
        'varying vec3 fragColor;',
        'varying vec2 UV;',
        '',
        'uniform mat4 mWorld;',
        'uniform mat4 mView;',
        'uniform mat4 mProj;',
        '',
        'void main()',
        '{',
        'UV=texCoord;',
        'fragColor=vertColor;',
        'gl_Position=mProj*mView*mWorld*vec4(vertPosition,1.0);',
        '}'

    ].join('\n');


let FragShaderText =
    [
        'precision mediump float;',
        '',
        'varying vec3 fragColor;',
        'varying vec2 UV;',
        'uniform sampler2D MainTex;',
        '',
        'void main()',
        '{',
        'vec4 texCol=texture2D(MainTex,UV);',
        'if(texCol.r+texCol.g+texCol.b<2.0) discard;',
        'gl_FragColor=texCol*vec4(fragColor,1.0);',
        '}'

    ].join('\n');





//init i webgl
function Initialization() {
    //fetchanje webgl contexta 
    let canvas = document.getElementById('RendererId');
    let gl = canvas.getContext('Webgl');



    //radi compactibility issues-a
    if (!gl)
        gl = canvas.getContext('experimental-webgl');

    if (!gl)
        alert('Browser does not support WebGl');

    //dimenzije
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    //defaults
    gl.clearColor(0, 0, 0, 1.0);

    //clearing
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //culling i depth
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    //  gl.cullFace(gl.BACK);


    //shaderi
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    //setanje koda
    gl.shaderSource(vertexShader, VertShaderText);
    gl.shaderSource(fragmentShader, FragShaderText);

    //compile
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    //validiranje
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("invalid vert shader");
        return;
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("invalid frag shader");
        return;
    }

    //setupanje pipeline-a
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    //validiranje link-ing stage-a
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error Linking Program')
        return;
    }

    //finalna debug only validacija, sporo af , makni iz builda
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('Error validating program');
        return;
    }





    //create-anje buffera
    var VerticesData =
        [ // X, Y, Z           R, G, B         u  v
            // Top
            -1.0, 1.0, -1.0, 1, 1, 1, 0, 0,
            -1.0, 1.0, 1.0, 1, 0, 1, 0, 1,
            1.0, 1.0, 1.0, 1, 1, 1, 1, 1,
            1.0, 1.0, -1.0, 0.5, 1, 1, 1, 0,

            // Left
            -1.0, 1.0, 1.0, 1, 1, 1, 0, 0,
            -1.0, -1.0, 1.0, 0, 1, 0.5, 1, 0,
            -1.0, -1.0, -1.0, 1, 1, 1, 1, 1,
            -1.0, 1.0, -1.0, 1, 1, 1, 0, 1,

            // Right
            1.0, 1.0, 1.0, 1, 1, 1, 1, 1,
            1.0, -1.0, 1.0, 1, 1, 0, 0, 1,
            1.0, -1.0, -1.0, 1, 1, 1, 0, 0,
            1.0, 1.0, -1.0, 1, 1, 1, 1, 0,

            // Front
            1.0, 1.0, 1.0, 1, 0.5, 1, 1, 1,
            1.0, -1.0, 1.0, 1, 0, 1, 1, 0,
            -1.0, -1.0, 1.0, 1, 0.5, 1, 0, 0,
            -1.0, 1.0, 1.0, 0.5, 1, 1, 0, 1,

            // Back
            1.0, 1.0, -1.0, 1, 1, 1, 0, 0,
            1.0, -1.0, -1.0, 0, 1, 0.5, 0, 1,
            -1.0, -1.0, -1.0, 1, 1, 1, 1, 1,
            -1.0, 1.0, -1.0, 1, 0.5, 1, 1, 0,

            // Bottom
            -1.0, -1.0, -1.0, 1, 1, 1, 1, 1,
            -1.0, -1.0, 1.0, 1, 0, 0.5, 1, 0,
            1.0, -1.0, 1.0, 0.5, 1, 1, 0, 0,
            1.0, -1.0, -1.0, 0.5, 0, 1, 0, 1,
        ];

    var Indices =
        [
            // Top
            0, 1, 2,
            0, 2, 3,

            // Left
            5, 4, 6,
            6, 4, 7,

            // Right
            8, 9, 10,
            8, 10, 11,

            // Front
            13, 12, 14,
            15, 14, 12,

            // Back
            16, 17, 18,
            16, 18, 19,

            // Bottom
            21, 20, 22,
            22, 20, 23
        ];



    //kreiranje buffera
    let triangleVertexBuffer = gl.createBuffer();
    //setanje kao aktivni
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
    //punjenje buffera(zadnji aktivni)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(VerticesData), gl.STATIC_DRAW);


    //kreiranje triangle buffera ,gornji je vertex
    let IndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Indices), gl.STATIC_DRAW);

    //nac lokaciju atributa
    let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    //triba mu rec di je to unutar array-a i kakav je data
    gl.vertexAttribPointer(
        positionAttribLocation,//lokacija
        3,//broj elementi po atrib
        gl.FLOAT,//type
        gl.FALSE,//
        8 * Float32Array.BYTES_PER_ELEMENT,//size vertexData elementa u bufferu
        0//offset
    );

    let colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        colorAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        8 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );


    let UVAttribLocation = gl.getAttribLocation(program, 'texCoord');
    gl.vertexAttribPointer(
        UVAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        8 * Float32Array.BYTES_PER_ELEMENT,
        6 * Float32Array.BYTES_PER_ELEMENT
    );

    //finalno enable-anje
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);
    gl.enableVertexAttribArray(UVAttribLocation);



    //TEXTURA 
    let _MainTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, _MainTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('img'));

    //unbind/release
    gl.bindTexture(gl.TEXTURE_2D, null);


    //da state machine zna koji je program kasnie kad addan matrice
    gl.useProgram(program);

    //matrice
    let mWorldUniLoc = gl.getUniformLocation(program, 'mWorld');
    let mViewUniLoc = gl.getUniformLocation(program, 'mView');
    let mProjUniLoc = gl.getUniformLocation(program, 'mProj');

    let mWorldMat = new Float32Array(16);
    let mProjMat = new Float32Array(16);
    let mViewMat = new Float32Array(16);

    //setanje na default 
    glMatrix.mat4.identity(mWorldMat);
    glMatrix.mat4.lookAt(mViewMat, [0, 0, -5], [0, 0, 0], [0, 1, 0])
    glMatrix.mat4.perspective(mProjMat, Math.PI / 2, canvas.width / canvas.height, 0.1, 1000);

    //setanje u shader
    gl.uniformMatrix4fv(mWorldUniLoc, gl.FALSE, mWorldMat);
    gl.uniformMatrix4fv(mViewUniLoc, gl.FALSE, mViewMat);
    gl.uniformMatrix4fv(mProjUniLoc, gl.FALSE, mProjMat);


    //main render loop
    let angle = 0;
    let IdentityMatrix = new Float32Array(16);
    glMatrix.mat4.identity(IdentityMatrix);

    let Xrot = new Float32Array(16);
    glMatrix.mat4.identity(Xrot);

    let Yrot = new Float32Array(16);
    glMatrix.mat4.identity(Yrot);

    let RenderLoop = function () {
        angle = performance.now() / (1000 * 6) * 2 * Math.PI;
        glMatrix.mat4.rotate(Xrot, IdentityMatrix, angle, [-3, -0.4, 0.3]);
        glMatrix.mat4.rotate(Yrot, IdentityMatrix, angle, [0.8, 1, 0.0]);

        glMatrix.mat4.lookAt(mViewMat, [0, 0, -10 - (5 * Math.sin(performance.now() / 1000))], [0, 0, 0], [0, 1, 0])

        mWorldMat = glMatrix.mat4.mul(mWorldMat, Xrot, Yrot);

        gl.uniformMatrix4fv(mViewUniLoc, gl.FALSE, mViewMat);
        gl.uniformMatrix4fv(mWorldUniLoc, gl.FALSE, mWorldMat);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, _MainTex);
        gl.activeTexture(gl.TEXTURE0);

        //gl.drawArrays(gl.TRIANGLES,0,3); //za array
        gl.drawElements(gl.TRIANGLES, Indices.length, gl.UNSIGNED_SHORT, 0);//za trokute
        requestAnimationFrame(RenderLoop);
    };
    requestAnimationFrame(RenderLoop);

};





//Ode Nek Ide Runtime itd

Initialization();