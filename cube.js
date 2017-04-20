var canvas;
var gl;
var program;
var texCoords = [];
var texture;

var NumVertices = 0;
var points = [];
var colors = [];

var cubes = [];
var normals = [];


var cubeM = 3;
var cameraX = 0;
var cameraY = -.4;

var cY = .31;
var cX = -0.40;

var vBuffer;
var cBuffer;
var stack = [];
var sch = [];
var theta;
var cameraPosition;

var map = [];
var mx, my;
var n = 5;
var w = 5;
//must be odd
var v;

var worldViewProjectionLocation;
var worldInverseTransposeLocation;
var shininessLocation;
var lightWorldPositionLocation;
var viewWorldPositionLocation;
var worldLocation;
/* function loadImageAndCreateTextureInfo(url) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));

    // let's assume all images are not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var textureInfo = {
      width: 1,   // we don't know the size until it loads
      height: 1,
      texture: tex,
    };
    var img = new Image();
    img.addEventListener('load', function() {
      textureInfo.width = img.width;
      textureInfo.height = img.height;

      gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    });
    requestCORSIfNotSameOrigin(img, url);
    img.src = url;

    return textureInfo;
  }*/
function mapGen(n) {
    //generate the map

    cubeM = n * w + n + 1; //w represent the road's width
    v = 1 / cubeM * 1/3; // the walking speed, bounce distance and detect, common measurment of the maze

  //initialize the map by setting up walls on every position 
    map = new Array(cubeM);
    for (var i = 0; i < cubeM; i++) {
        map[i] = new Array(cubeM);
    }
    for (var ii = 0; ii < cubeM; ii++)
        for (var j = 0; j < cubeM; j++) {
            map[ii][j] = true;
        }

   //starting points to remove walls to form roads
    mx = 1;
    my = 1;
    mapRecur(1, 1);

    //making entrance and exit 
    for (var i = 1; i < 1 + w; i++)
        map[i][0] = false;
    for (var i = cubeM - 1 - w; i < cubeM - 1; i++)
        map[i][cubeM - 1] = false;
}
function mapMarker(mmx, mmy) {

    //function to remove a area of walls on the given XY
    for (var i = mmx; i < mmx + w; i++)
        for (var j = mmy; j < mmy + w; j++)
            map[i][j] = false;
    
}
function mapRecur(xL, yL) {
    //the recurrsive backtrackign agorithm of generate of maze 

    var s = w + 1;
    if (xL >= cubeM || xL < 0)
        return;
    if (yL >= cubeM || yL < 0)
        return;
    if (!map[xL][yL])
        return;

    //clear out blocks on the targeted location
    mapMarker(xL, yL);

    //clear out blocks on the mid point of original targeted location
    mapMarker((xL + mx) / 2, (yL + my) / 2);

    //random the next direction, exit when all direction were visited
    flag = true;
    while (flag) {
        mx = xL;
        my = yL;
        var ran = Math.floor((Math.random() * 4));
        switch (ran) {
        case 0:
            mapRecur(xL + s, yL);
            break;
        case 1:
            mapRecur(xL - s, yL);
            break;
        case 2:
            mapRecur(xL, yL + s);
            break;
        case 3:
            mapRecur(xL, yL - s);
            break;
        default:
            mapRecur(xL, yL);
        }
        flag = false;
        if (xL + s < cubeM && xL + s >= 0)
            if (map[xL + s][yL])
                flag = true;
        if (xL - s < cubeM && xL - s >= 0)
            if (map[xL - s][yL])
                flag = true;
        if (yL + s < cubeM && yL + s >= 0)
            if (map[xL][yL + s])
                flag = true;
        if (yL - s < cubeM && yL - s >= 0)
            if (map[xL][yL - s])
                flag = true;
    }
    

}
function configureTexture(image) {
    //take in the texture
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

window.onload = function init() {
    //based on last cube project 

    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    
    
    //initialize maze
    mapGen(n);

    //initialize cubes 
    var cube = new cubeModel();
    for (var i = 0; i < cubeM; i++) {
        for (var k = 0; k < cubeM; k++) {
            for (var j = 0; j < w + 2; j++) {

                //  if(j>0&&j<w+1)continue;//
             //   if (j == 0 || j == w + 1)    continue;
                

               if (j > 0 && j < w + 1)
                if (!map[i][k])
                    continue;
                NumVertices += cube.NumVertices;

                //place the cube 
                cube.scale(1 / cubeM, 1 / cubeM, 1 / cubeM);
                //cube.translate(-.5 + 1 / (2 * cubeM) + 1.00501 * i / cubeM, -.5 + 1 / (2 * cubeM) + 1.005 * j / cubeM, -.5 + 1 / (2 * cubeM) + 1.005 * k / cubeM);
                cube.translate(-.5 + 1 / (2 * cubeM) + i / cubeM, -.5 + 1 / (2 * cubeM) + j / cubeM, -.5 + 1 / (2 * cubeM) + k / cubeM);

                cubes.push(cube);
                this.points = this.points.concat(cube.points);
                this.colors = this.colors.concat(cube.colors);
                this.texCoords = this.texCoords.concat(cube.texCoordsArray);
                this.normals = this.normals.concat(cube.normalsArray);

                //getting the next cube 
                cube = new cubeModel();
            }
        }
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

   

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.DYNAMIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.DYNAMIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    // lookup uniforms
    worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
    worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");

    shininessLocation = gl.getUniformLocation(program, "u_shininess");
    lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
    viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
    worldLocation = gl.getUniformLocation(program, "u_world");

     
   // var image = document.getElementById("texImage");
   //var image  =loadImageAndCreateTextureInfo('https://c1.staticflickr.com/9/8873/18598400202_3af67ef38f_q.jpg');

//    image.crossOrigin = "";
   // configureTexture(image);

    window.addEventListener("keydown", function(event) {

        switch (event.keyCode) {

        case 87: //move forward
            moveF(v);
            
            break;
        case 83:
           //move backwards
            moveF(-v);
            
            break;
        case 65:

        //move right
            moveR(v);
            
            break;
        case 68:
        //move left
            moveR(-v);
            
            break;
            /* case 38: do not remove

            // key W and "arrow up"
            //rotate camera up

            if (cameraY - .1 < -19) {
                break;
            }
            cameraY -= .1;
            cRotate();

            break;
        case 40:

            // key S and "arrow down"
            //rotate camera down

            if (cameraY + .1 > 19) {
                break;
            }
            cameraY += .1;
            cRotate();

            break;*/
        case 37:
            //ratate of camera horizontally 
            // "arrow left"
            //rotate left
            if (cameraX > 360)
                cameraX -= 360;

            cameraX += 2;
            if (cameraX < 120)
                cameraX += 4;
            if (cameraX > 240)
                cameraX += 4;
            cRotate();
            break;
        case 39:
              //ratate of camera horizontally 
            // "arrow right"
            //rotate right
            if (cameraX < 0)
                cameraX += 360;

            cameraX -= 2;
            if (cameraX > 240)
                cameraX -= 4;
            if (cameraX < 120)
                cameraX -= 4;

            cRotate();
            break;

        }
    });

    //initialize the cube to dimension of 2

    cRotate();

    render();

}
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

    setTimeout(requestAnimFrame(render), 100);
}

// Converts from degrees to radians. from:http://cwestblog.com/2012/11/12/javascript-degree-and-radian-conversion/
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
}
;

// Converts from radians to degrees.from :http://cwestblog.com/2012/11/12/javascript-degree-and-radian-conversion/
Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
}
;
function bounce() {
    //my algorithm, checks all four directions in terms of absolute position 
    // if there is a wall ahead, bounce you to the opposite side(based on the wall rather than camera angle or move directions)

    var camX = cameraPosition[0] + .5 + (1 / cubeM) * 1.5;
    var camY = cameraPosition[2] + .5;
    var posX = Math.floor(camX * cubeM);
    var posY = Math.floor(camY * cubeM);

    var camX2 = cameraPosition[0] + .5 - (1 / cubeM) * 1.5;
    var camY2 = cameraPosition[2] + .5;
    var posX2 = Math.floor(camX2 * cubeM);
    var posY2 = Math.floor(camY2 * cubeM);
    var camX3 = cameraPosition[0] + .5;
    var camY3 = cameraPosition[2] + .5 + (1 / cubeM) * 1.5;
    var posX3 = Math.floor(camX3 * cubeM);
    var posY3 = Math.floor(camY3 * cubeM);

    var camX4 = cameraPosition[0] + .5;
    var camY4 = cameraPosition[2] + .5 - (1 / cubeM) * 1.5;
    var posX4 = Math.floor(camX4 * cubeM);
    var posY4 = Math.floor(camY4 * cubeM);

    if (posX <= cubeM && posX >= 0)
        if (posY <= cubeM && posY >= 0)
            if (map[posX][posY]) {

                cX -= 3 * v;

            }
    if (posX2 <= cubeM && posX2 >= 0)
        if (posY2 <= cubeM && posY2 >= 0)
            if (map[posX2][posY2]) {

                cX += 3 * v;

            }
    if (posX3 <= cubeM && posX3 >= 0)
        if (posY3 <= cubeM && posY3 >= 0)
            if (map[posX3][posY3]) {
                cY -= 3 * v;

            }
    if (posX4 <= cubeM && posX4 >= 0)
        if (posY4 <= cubeM && posY4 >= 0)
            if (map[posX4][posY4]) {
                cY += 3 * v;

            }
}

function setTheta() {
    //adjust for perspective camera's angle distortion to calculate the real theta and thus direction to move

    theta = Math.degrees(theta);
    while (theta < 0)
        theta += 360;
    while (theta > 360)
        theta -= 360;

    var atheta = theta;
    atheta = Math.floor(atheta / 60);

    switch (atheta) {
    case 0:
    case 1:
        theta = theta / 4 * 3;

        break;
    case 2:
    case 3:
    case 4:
        theta = (theta - 120) / 2 * 3;
        theta += 90;

        break;
    case 5:
        theta = (theta - 240);
        theta = theta / 4 * 3;
        theta += 270;
        break;
    default:
        theta = 0;
        cameraX = 0;
    }

    //cameraX = theta;
    theta = Math.radians(theta);

}
function moveF(v) {
    //actually moving

    setTheta();

    cY += Math.cos(theta) * v;
    cX += Math.sin(theta) * v;
    bounce();
    cRotate();
}
function moveR(v) {
    //move 90 degrees from forward 
    //implementing typical wsad

    setTheta();

    cY += Math.cos(theta + Math.radians(90)) * v;
    cX += Math.sin(theta + Math.radians(90)) * v;
   

    bounce();
    cRotate();
}
function cRotate() {
    //take care of camera, rotation, matrixes and so on
    //based on :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    //no longer similar 
    //https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-point.html

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = .00001;
    var zFar = 18;
    var shininess = 3000;
    var projectionMatrix = m4.perspective(Math.radians(120), aspect, zNear, zFar);

    // Use matrix math to compute a position on a circle where
    // the camera is
    //var cameraMatrix = m4.yRotation(Math.radians(cameraX));
    var cameraMatrix = m4.yRotation(Math.radians(0));
    theta = Math.radians(cameraX);

    cameraMatrix = m4.translate(cameraMatrix, cX, cameraY, cY - 1); //move the camera 
    cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]]; //where you are

    var up = [0, 1, 0];

    //the point to lookAt, it moves as the camera move
    //the sin and cos allows it to turn camera to left and right
    var fPosition = [cX + Math.sin(theta), +cameraY, -.5 + cY + Math.cos(theta)]; 

    // Compute the camera's matrix using look at.

    var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

    // Make a view matrix from the camera matrix
    var viewMatrix = m4.inverse(cameraMatrix);

    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var matrix = m4.translate(viewProjectionMatrix, 0, 0, 0);

    var worldMatrix = m4.yRotation(Math.radians(0));
    var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
    var worldInverseMatrix = m4.inverse(worldMatrix);
    var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);
    // Set the matrix.
 

    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
    gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

    // Set the color to use
    
    //the light position, can be replaced by solely using cameraPosition
    var lPosition = [cameraMatrix[12] + Math.sin(theta) * v * 3, cameraMatrix[13], cameraMatrix[14] + Math.cos(theta) * v * 3];
    // set the light position
    gl.uniform3fv(lightWorldPositionLocation, lPosition);

    // set the camera/view position
    gl.uniform3fv(viewWorldPositionLocation, cameraPosition);

    // set the shininess
    gl.uniform1f(shininessLocation, shininess);

}

;var m4 = {
    //from :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html

    lookAt: function(cameraPosition, target, up) {
        var zAxis = normalize(subtractVectors(cameraPosition, target));
        var xAxis = cross(up, zAxis);
        var yAxis = cross(zAxis, xAxis);

        return [xAxis[0], xAxis[1], xAxis[2], 0, yAxis[0], yAxis[1], yAxis[2], 0, zAxis[0], zAxis[1], zAxis[2], 0, cameraPosition[0], cameraPosition[1], cameraPosition[2], 1, ];
    },

    perspective: function(fieldOfViewInRadians, aspect, near, far) {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        var rangeInv = 1.0 / (near - far);

        return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0];
    },

    projection: function(width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [2 / width, 0, 0, 0, 0, -2 / height, 0, 0, 0, 0, 2 / depth, 0, -1, 1, 0, 1, ];
    },
    transpose: function(m, dst) {
        dst = dst || new Float32Array(16);

        dst[0] = m[0];
        dst[1] = m[4];
        dst[2] = m[8];
        dst[3] = m[12];
        dst[4] = m[1];
        dst[5] = m[5];
        dst[6] = m[9];
        dst[7] = m[13];
        dst[8] = m[2];
        dst[9] = m[6];
        dst[10] = m[10];
        dst[11] = m[14];
        dst[12] = m[3];
        dst[13] = m[7];
        dst[14] = m[11];
        dst[15] = m[15];

        return dst;
    },
    multiply: function(a, b) {
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];

        return [b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30, b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31, b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32, b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33, b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30, b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31, b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32, b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33, b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30, b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31, b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32, b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33, b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30, b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31, b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32, b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33, ];
    },

    translation: function(tx, ty, tz) {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1, ];
    },

    xRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, ];
    },

    yRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1, ];
    },

    zRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, ];
    },

    scaling: function(sx, sy, sz) {
        return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1, ];
    },

    translate: function(m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    },

    xRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
    },

    yRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
    },

    zRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
    },

    scale: function(m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
    },

    inverse: function(m) {
        var m00 = m[0 * 4 + 0];
        var m01 = m[0 * 4 + 1];
        var m02 = m[0 * 4 + 2];
        var m03 = m[0 * 4 + 3];
        var m10 = m[1 * 4 + 0];
        var m11 = m[1 * 4 + 1];
        var m12 = m[1 * 4 + 2];
        var m13 = m[1 * 4 + 3];
        var m20 = m[2 * 4 + 0];
        var m21 = m[2 * 4 + 1];
        var m22 = m[2 * 4 + 2];
        var m23 = m[2 * 4 + 3];
        var m30 = m[3 * 4 + 0];
        var m31 = m[3 * 4 + 1];
        var m32 = m[3 * 4 + 2];
        var m33 = m[3 * 4 + 3];
        var tmp_0 = m22 * m33;
        var tmp_1 = m32 * m23;
        var tmp_2 = m12 * m33;
        var tmp_3 = m32 * m13;
        var tmp_4 = m12 * m23;
        var tmp_5 = m22 * m13;
        var tmp_6 = m02 * m33;
        var tmp_7 = m32 * m03;
        var tmp_8 = m02 * m23;
        var tmp_9 = m22 * m03;
        var tmp_10 = m02 * m13;
        var tmp_11 = m12 * m03;
        var tmp_12 = m20 * m31;
        var tmp_13 = m30 * m21;
        var tmp_14 = m10 * m31;
        var tmp_15 = m30 * m11;
        var tmp_16 = m10 * m21;
        var tmp_17 = m20 * m11;
        var tmp_18 = m00 * m31;
        var tmp_19 = m30 * m01;
        var tmp_20 = m00 * m21;
        var tmp_21 = m20 * m01;
        var tmp_22 = m00 * m11;
        var tmp_23 = m10 * m01;

        var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        return [d * t0, d * t1, d * t2, d * t3, d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)), d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)), d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)), d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)), d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)), d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)), d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)), d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)), d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)), d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)), d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)), d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))];
    },

    vectorMultiply: function(v, m) {
        var dst = [];
        for (var i = 0; i < 4; ++i) {
            dst[i] = 0.0;
            for (var j = 0; j < 4; ++j)
                dst[i] += v[j] * m[j * 4 + i];
        }
        return dst;
    },

};
function subtractVectors(a, b) {
    //from :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
    //from :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
        return [v[0] / length, v[1] / length, v[2] / length];
    } else {
        return [0, 0, 0];
    }
}

function cross(a, b) {
    //from :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
