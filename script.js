"use strict";

const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");
if (!gl) {
  alert("WebGL not supported");
}

let running = true;
let isLightTheme = false;

let m1 = 1, m2 = 1;
let l1 = 1.5, l2 = 1.5;
let a1 = Math.PI / 2, a2 = Math.PI / 2;
let da1 = 0, da2 = 0;
let tail = [];
const maxTailLength = 500;

const gravitySlider = document.getElementById("g");
const gravityDisplay = document.getElementById("gravityValue");

let g = parseFloat(gravitySlider.value);
gravityDisplay.textContent = g.toFixed(1);

gravitySlider.addEventListener("input", (e) => {
  g = parseFloat(e.target.value);
  gravityDisplay.textContent = g.toFixed(1);
});

let initialEnergy = null;

function wrapAngle(angle) {
  while (angle <= -Math.PI) angle += 2 * Math.PI;
  while (angle > Math.PI) angle -= 2 * Math.PI;
  return angle;
}

function computeEnergy() {
  const KE = 0.5 * m1 * (l1 * da1) ** 2 
           + 0.5 * m2 * ( (l1 * da1) ** 2 
                        + (l2 * da2) ** 2 
                        + 2 * l1 * l2 * da1 * da2 * Math.cos(a1 - a2) );
  const PE = -(m1 + m2) * g * l1 * Math.cos(a1) - m2 * g * l2 * Math.cos(a2);
  return KE + PE;
}

function rescaleVelocities() {
  if (initialEnergy === null) return;

  const PE = -(m1 + m2) * g * l1 * Math.cos(a1) - m2 * g * l2 * Math.cos(a2);
  const KE_target = initialEnergy - PE;

  if (KE_target < 0) {
    da1 = 0;
    da2 = 0;
    return;
  }

  const KE_current = 0.5 * m1 * (l1 * da1) ** 2 
                   + 0.5 * m2 * ( (l1 * da1) ** 2 
                                + (l2 * da2) ** 2 
                                + 2 * l1 * l2 * da1 * da2 * Math.cos(a1 - a2) );
  if (KE_current === 0) return;

  const scale = Math.sqrt(KE_target / KE_current);
  da1 *= scale;
  da2 *= scale;
}

document.getElementById("m1").oninput = (e) => {
  m1 = parseFloat(e.target.value);
  rescaleVelocities();
};
document.getElementById("m2").oninput = (e) => {
  m2 = parseFloat(e.target.value);
  rescaleVelocities();
};
document.getElementById("l1").oninput = (e) => {
  l1 = parseFloat(e.target.value);
  rescaleVelocities();
};
document.getElementById("l2").oninput = (e) => {
  l2 = parseFloat(e.target.value);
  rescaleVelocities();
};

document.getElementById("toggleTheme").onclick = () => {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
  isLightTheme = document.body.classList.contains("light");

  const ctx = document.getElementById("phaseCanvas").getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (isLightTheme) {
    gl.clearColor(1, 1, 1, 1);
  } else {
    gl.clearColor(0, 0, 0, 1);
  }
};

document.getElementById("showPhase").onchange = (e) => {
  document.getElementById("phaseCanvas").style.display = e.target.checked ? "block" : "none";
};

document.getElementById("reset").onclick = () => {
  a1 = a2 = Math.PI / 2;
  da1 = da2 = 0;
  initialEnergy = computeEnergy();
  tail = [];

  const sliders = ["m1", "m2", "l1", "l2", "g"];
  const defaultValues = { m1: 1, m2: 1, l1: 1.5, l2: 1.5, g: 9.8 };
  sliders.forEach(id => {
    const el = document.getElementById(id);
    el.value = defaultValues[id];
    el.dispatchEvent(new Event("input"));
  });
};

document.getElementById("startStop").onclick = () => {
  running = !running;
  document.getElementById("startStop").textContent = running ? "Stop" : "Start";
};

let draggingBob = null;

canvas.addEventListener("mousedown", (e) => {
  const { left, top, width, height } = canvas.getBoundingClientRect();
  const x = ((e.clientX - left) / width) * 2 - 1;
  const y = -(((e.clientY - top) / height) * 2 - 1);
  const points = [
    { x: l1 * Math.sin(a1) * 0.3,            y: -l1 * Math.cos(a1) * 0.3,            id: "a1" },
    { x: (l1 * Math.sin(a1) + l2 * Math.sin(a2)) * 0.3, 
      y: (-l1 * Math.cos(a1) - l2 * Math.cos(a2)) * 0.3, id: "a2" }
  ];
  points.forEach(p => {
    const dist = Math.hypot(p.x - x, p.y - y);
    if (dist < 0.05) {
      draggingBob = p.id;
    }
  });
});

canvas.addEventListener("mousemove", (e) => {
  if (!draggingBob) return;
  const { left, top, width, height } = canvas.getBoundingClientRect();
  const x = ((e.clientX - left) / width) * 2 - 1;
  const y = -(((e.clientY - top) / height) * 2 - 1);
  const angle = Math.atan2(x, -y);
  if (draggingBob === "a1") {
    a1 = angle;
  } else if (draggingBob === "a2") {
    a2 = angle;
  }
  da1 = da2 = 0;
});

canvas.addEventListener("mouseup", () => {
  draggingBob = null;
});

function rk4Step(dt) {
  const subSteps = 5;
  const subDt = dt / subSteps;
  for (let i = 0; i < subSteps; i++) {
    singleRK4Step(subDt);
  }
}

function singleRK4Step(dt) {
  function derivs(a1, da1, a2, da2) {
    const delta = a2 - a1;
    const den1 = (m1 + m2) * l1 - m2 * l1 * Math.cos(delta) ** 2;
    const den2 = (l2 / l1) * den1;
    const dda1 = (
      m2 * l1 * da1 ** 2 * Math.sin(delta) * Math.cos(delta)
      + m2 * g * Math.sin(a2) * Math.cos(delta)
      + m2 * l2 * da2 ** 2 * Math.sin(delta)
      - (m1 + m2) * g * Math.sin(a1)
    ) / den1;
    const dda2 = (
      -m2 * l2 * da2 ** 2 * Math.sin(delta) * Math.cos(delta)
      + (m1 + m2) * g * Math.sin(a1) * Math.cos(delta)
      - (m1 + m2) * l1 * da1 ** 2 * Math.sin(delta)
      - (m1 + m2) * g * Math.sin(a2)
    ) / den2;
    return [ da1, dda1, da2, dda2 ];
  }

  const [k1_a1, k1_da1, k1_a2, k1_da2] = derivs(a1, da1, a2, da2);
  const [k2_a1, k2_da1, k2_a2, k2_da2] = derivs(
    a1 + 0.5 * dt * k1_a1,    da1 + 0.5 * dt * k1_da1,
    a2 + 0.5 * dt * k1_a2,    da2 + 0.5 * dt * k1_da2
  );
  const [k3_a1, k3_da1, k3_a2, k3_da2] = derivs(
    a1 + 0.5 * dt * k2_a1,    da1 + 0.5 * dt * k2_da1,
    a2 + 0.5 * dt * k2_a2,    da2 + 0.5 * dt * k2_da2
  );
  const [k4_a1, k4_da1, k4_a2, k4_da2] = derivs(
    a1 + dt * k3_a1,          da1 + dt * k3_da1,
    a2 + dt * k3_a2,          da2 + dt * k3_da2
  );

  a1  += (dt / 6) * (k1_a1  + 2 * k2_a1  + 2 * k3_a1  + k4_a1);
  da1 += (dt / 6) * (k1_da1 + 2 * k2_da1 + 2 * k3_da1 + k4_da1);
  a2  += (dt / 6) * (k1_a2  + 2 * k2_a2  + 2 * k3_a2  + k4_a2);
  da2 += (dt / 6) * (k1_da2 + 2 * k2_da2 + 2 * k3_da2 + k4_da2);
}


function drawPendulum() {
  const x1 = l1 * Math.sin(a1);
  const y1 = -l1 * Math.cos(a1);
  const x2 = x1 + l2 * Math.sin(a2);
  const y2 = y1 - l2 * Math.cos(a2);

  if (document.getElementById("showTail").checked) {
    if (running) {
      tail.push(x2, y2);
      if (tail.length > maxTailLength * 2) {
        tail.splice(0, 2);
      }
    }
  } else {
    tail = [];
  }

  const scale = 0.3;
  const points = [
    0, 0,
    x1 * scale, y1 * scale,
    x2 * scale, y2 * scale
  ];
  const tailPoints = tail.map(v => v * scale);

  gl.clear(gl.COLOR_BUFFER_BIT);

  const tailColor = isLightTheme ? [1, 0.5, 0, 1] : [1, 0.2, 0.2, 1];
  if (tailPoints.length > 2) {
    drawLine(tailPoints, tailColor);
  }

  const rodColor = isLightTheme ? [0, 0, 0, 1] : [1, 1, 1, 1];
  drawLine(points, rodColor);

  function drawCircle(cx, cy, r, color) {
    const segments = 30;
    const pts = [cx, cy];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      pts.push(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
    const vertSrc = `
      attribute vec2 a;
      void main() {
        gl_Position = vec4(a, 0.0, 1.0);
      }
    `;
    const fragSrc = `
      precision mediump float;
      uniform vec4 uColor;
      void main() {
        gl_FragColor = uColor;
      }
    `;
    const vs = createShader(gl.VERTEX_SHADER, vertSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fragSrc);
    const program = createProgram(vs, fs);
    gl.useProgram(program);
    const posAttrib = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
    const colorUniform = gl.getUniformLocation(program, "uColor");
    gl.uniform4fv(colorUniform, color);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, pts.length / 2);
  }

  const bob1Color = isLightTheme ? [0, 0.5, 1, 1]
                                 : [0.2, 0.8, 1, 1];
  const bob2Color = isLightTheme ? [1, 0, 0.5, 1]
                                 : [1, 0.22, 0.61, 1];
  drawCircle(x1 * scale, y1 * scale, 0.03, bob1Color);
  drawCircle(x2 * scale, y2 * scale, 0.03, bob2Color);

  const KE = 0.5 * m1 * (l1 * da1) ** 2 
           + 0.5 * m2 * ( (l1 * da1) ** 2 
                        + (l2 * da2) ** 2 
                        + 2 * l1 * l2 * da1 * da2 * Math.cos(a1 - a2) );
  const PE = (m1 + m2) * g * l1 * (1 - Math.cos(a1)) 
           + m2 * g * l2 * (1 - Math.cos(a2));
  const totalE = KE + PE;

  const energyDisplay = document.getElementById("energyDisplay");
  if (document.getElementById("showEnergy").checked) {
    energyDisplay.style.display = "block";
    energyDisplay.textContent = `Total Energy (J): ${totalE.toFixed(3)} | KE: ${KE.toFixed(3)} | PE: ${PE.toFixed(3)}`;
  } else {
    energyDisplay.style.display = "none";
  }

  if (document.getElementById("showPhase").checked) {
    const ctx = document.getElementById("phaseCanvas").getContext("2d");

    const bgFade = isLightTheme ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    ctx.fillStyle = bgFade;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const ang1 = wrapAngle(a1);
    const ang2 = wrapAngle(a2);

    const x_plot1 = ((ang1 + Math.PI) / (2 * Math.PI)) * ctx.canvas.width;
    const y_plot1 = ((da1 + 10) / 20) * ctx.canvas.height;
    const x_plot2 = ((ang2 + Math.PI) / (2 * Math.PI)) * ctx.canvas.width;
    const y_plot2 = ((da2 + 10) / 20) * ctx.canvas.height;

    ctx.fillStyle = isLightTheme ? "#008000" : "#0f0";
    ctx.fillRect(x_plot1, ctx.canvas.height - y_plot1, 2, 2);
    ctx.fillStyle = isLightTheme ? "#800080" : "#f0f";
    ctx.fillRect(x_plot2, ctx.canvas.height - y_plot2, 2, 2);

    ctx.strokeStyle = isLightTheme ? "#333" : "#aaa";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ctx.canvas.width / 2, 0);
    ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height);
    ctx.moveTo(0, ctx.canvas.height / 2);
    ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
    ctx.stroke();

    ctx.fillStyle = isLightTheme ? "#000" : "#fff";
    ctx.font = "12px sans-serif";
    ctx.fillText("a", ctx.canvas.width - 15, ctx.canvas.height / 2 - 5);
    ctx.fillText("da/dt", ctx.canvas.width / 2 + 5, 15);

    ctx.fillStyle = isLightTheme ? "#008000" : "#0f0";
    ctx.fillRect(10, ctx.canvas.height - 30, 10, 10);
    ctx.fillStyle = isLightTheme ? "#000" : "#fff";
    ctx.fillText("a₁", 25, ctx.canvas.height - 20);
    ctx.fillStyle = isLightTheme ? "#800080" : "#f0f";
    ctx.fillRect(60, ctx.canvas.height - 30, 10, 10);
    ctx.fillStyle = isLightTheme ? "#000" : "#fff";
    ctx.fillText("a₂", 75, ctx.canvas.height - 20);
  }
}

function drawLine(pointsArray, color) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointsArray), gl.STATIC_DRAW);

  const vertSrc = `
    attribute vec2 a;
    void main() {
      gl_Position = vec4(a, 0.0, 1.0);
    }
  `;
  const fragSrc = `
    precision mediump float;
    uniform vec4 uColor;
    void main() {
      gl_FragColor = uColor;
    }
  `;
  const vs = createShader(gl.VERTEX_SHADER, vertSrc);
  const fs = createShader(gl.FRAGMENT_SHADER, fragSrc);
  const program = createProgram(vs, fs);
  gl.useProgram(program);

  const posAttrib = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(posAttrib);
  gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

  const colorUniform = gl.getUniformLocation(program, "uColor");
  gl.uniform4fv(colorUniform, color);

  gl.drawArrays(gl.LINE_STRIP, 0, pointsArray.length / 2);
}

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createProgram(vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return program;
}

gl.clearColor(0, 0, 0, 1);

gl.clearColor(
  document.body.classList.contains("light") ? 1 : 0,
  document.body.classList.contains("light") ? 1 : 0,
  document.body.classList.contains("light") ? 1 : 0,
  1
);

let lastTime = 0;
function loop(timestamp) {
  if (initialEnergy === null) {
    initialEnergy = computeEnergy();
  }
  const rawDt = (timestamp - lastTime) / 1000 || 0.016;
  const dt = Math.min(rawDt, 0.05);
  lastTime = timestamp;

  if (running && !draggingBob) {
    rk4Step(dt);
  }
  drawPendulum();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
