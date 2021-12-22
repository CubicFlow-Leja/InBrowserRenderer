const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

let url = window.location;

let fragUrl = '../src/OpenGl/FragmentShaderAbyss.glsl';
let VertUrl = '../src/OpenGl/VS.glsl';



class Vector2 {
    constructor(X, Y) {
        this.X = X;
        this.Y = Y;
    }

    ComputeChange(NewPos) {
        return new Vector2(NewPos.X - this.X, NewPos.Y - this.Y);
    }

    Reset() {
        this.X = 0;
        this.Y = 0;
    }
}


class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Increment(value, dt) {
        this.x += value.x * dt;
        this.y += value.y * dt;
        this.z += value.z * dt;
    }

    Set(value) {
        this.x = value.x;
        this.y = value.y;
        this.z = value.z;
    }

    SetFromVecFormat(value) {
        this.x = value[0];
        this.y = value[1];
        this.z = value[2];
    }

    Reset() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }

    ReturnVectorFormat() {
        return [this.x, this.y, this.z];
    }

    Normalize() {
        let X = this.x * this.x + this.y * this.y + this.z * this.z;
        let Mag;
        if (X >= 0.2)
            Mag = Math.sqrt(X);
        else
            Mag = 1;
        this.x /= Mag;
        this.y /= Mag;
        this.z /= Mag;
    }
}

class InputAxis {
    constructor(Axis, AxisGravity) {
        this.value = Axis;
        this.Gravity = AxisGravity;
        this.TargetVal = 0;
    }

    Gravitate(dt) {
        this.value += (this.TargetVal - this.value) * dt * this.Gravity;
    }
}


let mWorldMat;
let Xrot;
let Yrot;



let XAxis = new InputAxis(0, 8.0);
let YAxis = new InputAxis(0, 8.0);
let ZAxis = new InputAxis(0, 8.0);


let OldPos = new Vector2(0, 0);
let Dir = new Vector2(0, 0);

let OldTime = 0;
let DeltaTime = 0.02;

let VirtualCameraPos = new Vector3(0, 0, 0);

let RDirection = new Vector3(1, 0, 0);
let UpDirection = new Vector3(0, 1, 0);
let FwDirection = new Vector3(0, 0, 1);


let Angle = new Vector3(0, 0, 0);

let MoveVector = new Vector3(0, 0, 0);
let CameraMoveSpeed = 50;
let CameraRotSpeed = 0.2;
let right;
let fw;
let up;

let ShiftBool = false;

function HandlePositionsAndCoordinateSystem() {
    Angle.Reset();
    MoveVector.Reset();

    Angle.x = CameraRotSpeed * Dir.Y * Math.PI / 6;
    Angle.y = CameraRotSpeed * Dir.X * Math.PI / 6;

    right = RDirection.ReturnVectorFormat();
    fw = FwDirection.ReturnVectorFormat();
    up = UpDirection.ReturnVectorFormat();



    let WorldRotQuat = [0, 0, 0, 1];


    glMatrix.mat4.rotate(Yrot, Yrot, Angle.y, [0, 1, 0]);

    glMatrix.vec3.transformMat4(right, [1, 0, 0], Yrot);
    glMatrix.mat4.rotate(Xrot, Xrot, Angle.x, right);

    mWorldMat = glMatrix.mat4.mul(mWorldMat, Xrot, Yrot);

    glMatrix.mat4.getRotation(WorldRotQuat, mWorldMat);


    glMatrix.vec3.transformQuat(up, [0, 1, 0], WorldRotQuat);
    glMatrix.vec3.transformQuat(right, [1, 0, 0], WorldRotQuat);

    //glMatrix.vec3.cross(fw,up,right);
    glMatrix.vec3.transformQuat(fw, [0, 0, 1], WorldRotQuat);

    RDirection.SetFromVecFormat(right);
    UpDirection.SetFromVecFormat(up);
    FwDirection.SetFromVecFormat(fw);

    RDirection.Normalize();
    UpDirection.Normalize();
    FwDirection.Normalize();

    MoveVector.x = XAxis.value;
    MoveVector.y = YAxis.value;
    MoveVector.z = ZAxis.value;

    MoveVector.Normalize();

    VirtualCameraPos.Increment(RDirection, MoveVector.x * DeltaTime * CameraMoveSpeed);
    VirtualCameraPos.Increment(UpDirection, MoveVector.y * DeltaTime * CameraMoveSpeed);
    VirtualCameraPos.Increment(FwDirection, MoveVector.z * DeltaTime * CameraMoveSpeed);
}

function HandleINputs() {
    XAxis.Gravitate(DeltaTime);
    YAxis.Gravitate(DeltaTime);
    ZAxis.Gravitate(DeltaTime);
}

function ComputeTimeDelta() {
    let NewTime = performance.now() / 1000.0;
    DeltaTime = NewTime - OldTime;
    OldTime = NewTime;
}
ComputeTimeDelta();


function Initialization(VertText, FragText) {

    let canvas = document.getElementById('RendererId');
    let gl = canvas.getContext('Webgl');
    if (!gl)
        gl = canvas.getContext('experimental-webgl');
    if (!gl)
        alert('Browser does not support WebGl');

    //dimenzije
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    //defaults
    gl.clearColor(1, 1, 1, 1);

    //clearing
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //culling i depth
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);


    //shaderi
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);




    //setanje koda
    gl.shaderSource(vertexShader, VertText);
    gl.shaderSource(fragmentShader, FragText);

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


    /////
    /////
    /////
    /////

    //create-anje buffera
    let VerticesData =
        [//   X     Y       MatInd
            -1.0, -1.0, 0,
            1.0, -1.0, 1,
            1.0, 1.0, 2,
            -1.0, 1.0, 3
        ];

    let Indices = [0, 1, 2,
        0, 2, 3,];



    //Vertex buffer
    let triangleVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(VerticesData), gl.STATIC_DRAW);

    //Triangle Buffer
    let IndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Indices), gl.STATIC_DRAW);


    let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    let IndexAttribLocation = gl.getAttribLocation(program, 'MatrixIndex');

    gl.vertexAttribPointer
        (
            positionAttribLocation,
            2,
            gl.FLOAT,
            gl.FALSE,
            3 * Float32Array.BYTES_PER_ELEMENT,
            0
        );

    gl.vertexAttribPointer
        (
            IndexAttribLocation,
            1,
            gl.FLOAT,
            gl.FALSE,
            3 * Float32Array.BYTES_PER_ELEMENT,
            2 * Float32Array.BYTES_PER_ELEMENT
        );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(IndexAttribLocation);

    gl.useProgram(program);

    //
    //
    //


    let CamFov = Math.PI / 3;
    let CamAspect = canvas.width / canvas.height;
    let fov = Math.tan(CamFov * 0.5);
    // console.log(fov);
    let x = CamAspect * fov;//right
    let y = fov;//up

    let Frustum = [-x, -y, 1, 0,
        x, -y, 1, 0,
        x, y, 1, 0,
    -x, y, 1, 0];

    let FrustumLocation = gl.getUniformLocation(program, 'CamFrustum');
    gl.uniformMatrix4fv(FrustumLocation, gl.FALSE, Frustum);



    //world mat4 kasnie jer mi zasad ne triba cam controll
    let WorldMatLoc = gl.getUniformLocation(program, 'mWorld');
    mWorldMat = new Float32Array(16);
    glMatrix.mat4.identity(mWorldMat);
    gl.uniformMatrix4fv(WorldMatLoc, gl.FALSE, mWorldMat);



    //main render loop

    Xrot = new Float32Array(16);
    glMatrix.mat4.identity(Xrot);

    Yrot = new Float32Array(16);
    glMatrix.mat4.identity(Yrot);

    let Time;
    let TimeLocation = gl.getUniformLocation(program, 'Time');
    let PositionLocation = gl.getUniformLocation(program, 'CameraPosition');

    let steps = document.getElementById('Steps').value;
    let StepsLoc = gl.getUniformLocation(program, 'Steps');
    //let Fps=1/DeltaTime;

    //offset
    glMatrix.mat4.rotate(Yrot, Yrot, -Math.PI / 6, [0, 1, 0]);

    let RenderLoop = function () {
        steps = document.getElementById('Steps').value;

        Time = performance.now() / 1000;
        gl.uniform1f(TimeLocation, Time);

        gl.uniform1f(StepsLoc, steps);
        //Fps=Math.round( 1/DeltaTime);
        // if(Fps>=60)
        //     Fps='Above '+ 60;
        //console.log(Fps);

        ComputeTimeDelta();
        HandleINputs();
        HandlePositionsAndCoordinateSystem();

        gl.uniformMatrix4fv(WorldMatLoc, gl.FALSE, mWorldMat);
        gl.uniform3f(PositionLocation, VirtualCameraPos.x, VirtualCameraPos.y, VirtualCameraPos.z);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, Indices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(RenderLoop);

    };
    requestAnimationFrame(RenderLoop);

};




var InitAsyncRequest = function () {
    loadTextResource(VertUrl, function (verError, vText) {
        if (verError) {
            alert('Fatal Error While Loading Vert Shader');
            console.error(verError);
        }
        else {
            loadTextResource(fragUrl, function (fragError, fText) {
                if (fragError) {
                    alert('Fatal Error While Loading Vert SHader');
                    console.error(fragError);
                }
                else {
                    Initialization(vText, fText);
                }
            });
        }
    });
}



InitAsyncRequest();

let ClickBool = false;
let InputGravity = 2.5;
function handleMouseMove(event) {
    let NewPos = new Vector2(event.pageX / 10, event.pageY / 10);

    if (ClickBool) {
        Dir.X += (OldPos.ComputeChange(NewPos).X - Dir.X) * DeltaTime * InputGravity;
        Dir.Y += (OldPos.ComputeChange(NewPos).Y - Dir.Y) * DeltaTime * InputGravity;
        Dir.X = clamp(Dir.X, -1, 1);
        Dir.Y = clamp(Dir.Y, -1, 1);
    }
    else
        Dir.Reset();

    OldPos = NewPos;
}



function OnClick() {
    ClickBool = true;
}

function OnRelease() {
    ClickBool = false;
    Dir.Reset();
}




let KeyTempDown;
document.addEventListener('keydown', function (event) {

    KeyTempDown = event.key;

    if (KeyTempDown == 'a' && XAxis.TargetVal != 1)
        XAxis.TargetVal = -1;
    else
        if (KeyTempDown == 'd' && XAxis.TargetVal != -1)
            XAxis.TargetVal = 1;

    if (KeyTempDown == 'q' && YAxis.TargetVal != 1)
        YAxis.TargetVal = -1;
    else
        if (KeyTempDown == 'e' && YAxis.TargetVal != -1)
            YAxis.TargetVal = 1;

    if (KeyTempDown == 's' && ZAxis.TargetVal != 1)
        ZAxis.TargetVal = -1;
    else
        if (KeyTempDown == 'w' && ZAxis.TargetVal != -1)
            ZAxis.TargetVal = 1;

    if (KeyTempDown == 'r')
        ShiftBool = true;
})

let KeyTempUp;
document.addEventListener('keyup', function (event) {

    KeyTempUp = event.key;

    if (KeyTempUp == 'a' || KeyTempUp == 'd')
        XAxis.TargetVal = 0;

    if (KeyTempUp == 'w' || KeyTempUp == 's')
        ZAxis.TargetVal = 0;

    if (KeyTempUp == 'q' || KeyTempUp == 'e')
        YAxis.TargetVal = 0;

    if (KeyTempUp == 'r')
        ShiftBool = false;

})


document.onpointerdown = OnClick;
document.onpointerup = OnRelease;
document.onpointermove = handleMouseMove;


