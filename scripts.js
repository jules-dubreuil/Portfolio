import * as THREE from './modules/three.module.js';
import { vertexShader, fluidShader, displayShader } from './shaders.js';



const config = {
    brushSize: 25,
    brushStrength: 0.5,
    distortionAmount: 2.5,
    fluidDecay: 0.98,
    trailLength: 0.8,
    stopDecay: 0.85,
    color1: "#000000",
    color2: "#000000",
    color3: "#000000",
    color4: "#797979",
    colorIntensity: 2,
    softness: 0.1,
};

/*
const config = {
    brushSize: 25.0,
    brushStrength: 0.5,
    distortionAmount: 2.5,
    fluidDecay: 0.98,
    trailLength: 0.8,
    stopDecay: 0.85,
    color1: "#b8fff7",
    color2: "#6e3466",
    color3: "#0133ff",
    color4: "#66d1fe",
    colorIntensity: 1.0,
    softness: 1.0,
};
*/


function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
}

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ antialias: true });

const gradientCanvas = document.querySelector('.gradient-canvas');
renderer.setSize(window.innerWidth, window.innerHeight);
gradientCanvas.appendChild(renderer.domElement);

const fluidTarget1 = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
    }
);

const fluidTarget2 = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
    }
);

let currentFluidTarget = fluidTarget1;
let previousFluidTarget = fluidTarget2;
let frameCount = 0;

const fluidMaterial = new THREE.ShaderMaterial({
    uniforms: {
        iTime : { value: 0 },
        iResolution: {
            value: new THREE.Vector2(window.innerWidth, window.innerHeight)
        },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
        iFrame: { value: 0 },
        iPreviousFrame: { value: null },
        uBrushSize: { value: config.brushSize },
        uBrushStrength: { value: config.brushStrength },
        uFluidDecay: { value: config.fluidDecay },
        uTrailLength: { value: config.trailLength },
        uStopDecay: { value: config.stopDecay },
    },
    vertexShader: vertexShader,
    fragmentShader: fluidShader,
});

const displayMaterial = new THREE.ShaderMaterial({
    uniforms: {
        iTime: { value: 0 }, 
        iResolution: {
            value: new THREE.Vector2(window.innerWidth, window.innerHeight)
        },
        iFluid: { value: null },
        uDistortionAmount: { value: config.distortionAmount },
        uColor1: { value: new THREE.Vector3(...hexToRgb(config.color1))},
        uColor2: { value: new THREE.Vector3(...hexToRgb(config.color2))},
        uColor3: { value: new THREE.Vector3(...hexToRgb(config.color3))},
        uColor4: { value: new THREE.Vector3(...hexToRgb(config.color4))},
        uColorIntensity: { value: config.colorIntensity },
        uSoftness: { value: config.softness }
    },
    vertexShader: vertexShader,
    fragmentShader: displayShader,
});

const geometry = new THREE.PlaneGeometry(2, 2);
const fluidPlane = new THREE.Mesh(geometry, fluidMaterial);
const displayPlane = new THREE.Mesh(geometry, displayMaterial);


let mouseX = 0,
    mouseY = 0;

let prevMouseX = 0,
    prevMouseY = 0;

let lastMoveTime = 0;

document.addEventListener("mousemove", (e) => {
    const rect = gradientCanvas.getBoundingClientRect();

    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX - rect.left;
    mouseY = rect.height - (e.clientY - rect.top);
    lastMoveTime = performance.now();
    fluidMaterial.uniforms.iMouse.value.set(
        mouseX,
        mouseY,
        prevMouseX,
        prevMouseY
    );
});

document.addEventListener("mouseleave", () => {
    fluidMaterial.uniforms.iMouse.value.set(0,0,0,0);
    console.log("Mouse left the canvas");
});

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now() * 0.001;
    fluidMaterial.uniforms.iTime.value = time;
    displayMaterial.uniforms.iTime.value = time;
    fluidMaterial.uniforms.iFrame.value = frameCount;

    if (performance.now() - lastMoveTime > 100) {
        fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0);
    }

    fluidMaterial.uniforms.uBrushSize.value = config.brushSize;
    fluidMaterial.uniforms.uBrushStrength.value = config.brushStrength;
    fluidMaterial.uniforms.uFluidDecay.value = config.fluidDecay;
    fluidMaterial.uniforms.uTrailLength.value = config.trailLength;
    fluidMaterial.uniforms.uStopDecay.value = config.stopDecay;

    displayMaterial.uniforms.uDistortionAmount.value = config.distortionAmount;
    displayMaterial.uniforms.uColorIntensity.value = config.colorIntensity;
    displayMaterial.uniforms.uSoftness.value = config.softness;
    displayMaterial.uniforms.uColor1.value.set(...hexToRgb(config.color1));
    displayMaterial.uniforms.uColor2.value.set(...hexToRgb(config.color2));
    displayMaterial.uniforms.uColor3.value.set(...hexToRgb(config.color3));
    displayMaterial.uniforms.uColor4.value.set(...hexToRgb(config.color4));

    fluidMaterial.uniforms.iPreviousFrame.value = previousFluidTarget.texture;
    renderer.setRenderTarget(currentFluidTarget);
    renderer.render(fluidPlane, camera);

    displayMaterial.uniforms.iFluid.value = currentFluidTarget.texture;
    renderer.setRenderTarget(null);
    renderer.render(displayPlane, camera);

    const temp = currentFluidTarget;
    currentFluidTarget = previousFluidTarget;
    previousFluidTarget = temp;

    frameCount++;
}

window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    fluidMaterial.uniforms.iResolution.value.set(width, height);
    displayMaterial.uniforms.iResolution.value.set(width, height);

    fluidTarget1.setSize(width, height);
    fluidTarget2.setSize(width, height);
    frameCount = 0;
});

animate();

/*CARROUSEL*/

const projects = [
      { description: "Plonger dans une expérience unique et immersive", name: "Nomadia" },
      { description: "Une identité de nature entraînante", name: "HONOR TALENT" },
      { description: "Entretenir la flamme pour les arts visuels", name: "InTempo" },
      { description: "Redéfinir l'élégance en s'appropriant les codes du luxe", name: "Photographie" },
    ];

    const track = document.getElementById('track');

    function createCard(project, index) {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.index = index % projects.length;
      card.innerHTML = `
        <div class="card-image"></div>
        <div class="card-caption">
          <div class="card-description">${project.description}</div>
          <div class="card-name">${project.name}</div>
        </div>
      `;
      return card;
    }

    // Render 3 sets so we can loop in both directions
    for (let s = 0; s < 3; s++) {
      projects.forEach((p, i) => track.appendChild(createCard(p, i)));
    }

    let offset = 0;
    let isDown = false;
    let startX = 0;
    let startOffset = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let rafId = null;

    function getSetWidth() {
      return track.querySelector('.card').offsetWidth * projects.length;
    }

    function applyTransform(x) {
      track.style.transform = `translateX(${x}px)`;
    }

    function init() {
      offset = -getSetWidth(); // start showing middle set
      applyTransform(offset);
    }

    // Jump silently when we pass into clone territory
    function wrapOffset() {
      const setWidth = getSetWidth();
      if (offset <= -setWidth * 2) {
        offset += setWidth;
        applyTransform(offset);
      } else if (offset >= 0) {
        offset -= setWidth;
        applyTransform(offset);
      }
    }

    // Mouse
    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.classList.add('grabbing');
      startX = e.pageX;
      startOffset = offset;
      velocity = 0;
      lastX = e.pageX;
      lastTime = Date.now();
      cancelAnimationFrame(rafId);
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) velocity = (e.pageX - lastX) / dt * 16;
      lastX = e.pageX;
      lastTime = now;
      offset = startOffset + (e.pageX - startX);
      applyTransform(offset);
      wrapOffset();
    });

    document.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('grabbing');
      applyMomentum();
    });

    // Touch
    track.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      isDown = true;
      startX = t.pageX;
      startOffset = offset;
      velocity = 0;
      lastX = t.pageX;
      lastTime = Date.now();
      cancelAnimationFrame(rafId);
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (!isDown) return;
      const t = e.touches[0];
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) velocity = (t.pageX - lastX) / dt * 16;
      lastX = t.pageX;
      lastTime = now;
      offset = startOffset + (t.pageX - startX);
      applyTransform(offset);
      wrapOffset();
    }, { passive: true });

    track.addEventListener('touchend', () => {
      isDown = false;
      applyMomentum();
    });

    // Momentum
    function applyMomentum() {
      const friction = 0.92;
      function step() {
        if (Math.abs(velocity) < 0.3) return;
        offset += velocity;
        applyTransform(offset);
        wrapOffset();
        velocity *= friction;
        rafId = requestAnimationFrame(step);
      }
      rafId = requestAnimationFrame(step);
    }

    track.querySelectorAll('img, a').forEach(el => {
      el.addEventListener('dragstart', e => e.preventDefault());
    });

    window.addEventListener('load', init);
    window.addEventListener('resize', init);