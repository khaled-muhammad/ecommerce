import { Component, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import HeroImageShell from "./HeroImageShell.jsx";
import {
  HERO_PC_FALLBACK_PNG,
  HERO_PC_MODEL_PATH_FBX,
  HERO_PC_MODEL_PATH_GLB,
} from "./heroModelConfig.js";

const HERO_MODEL_TARGET = 2.58;
const HERO_MODEL_ROTATION_MARGIN = 0.84;
const HERO_MODEL_EXTRA_SCALE = 1.0;
const HERO_MODEL_BASE_YAW = 0.32;
const HERO_SCROLL_YAW_PER_PAGE = Math.PI * 0.78;
const HERO_SCROLL_TILT_PEAK = 0.14;
const HERO_SCROLL_SINK = 0.42;
const HERO_SCROLL_Y_BOB = 0.045;

const FRAME_STYLE = {
  height: "clamp(560px, 78vh, min(92vh, 1080px))",
  minHeight: "clamp(560px, 78vh, min(92vh, 1080px))",
};

function isWebGLAvailable() {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const ctx =
      c.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      c.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
      c.getContext("experimental-webgl", { failIfMajorPerformanceCaveat: false });
    return !!ctx;
  } catch {
    return false;
  }
}

class HeroCanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onFallback?.();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function HeroFallbackImage() {
  return (
    <div
      className="relative flex w-full min-h-0 items-center justify-center touch-pan-y"
      style={FRAME_STYLE}
    >
      <img
        src={HERO_PC_FALLBACK_PNG}
        alt="Custom gaming PC build with RGB lighting"
        className="h-full w-full max-h-full object-contain object-center"
        width={1200}
        height={900}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function fitObjectToBox(obj) {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const s =
    ((HERO_MODEL_TARGET * HERO_MODEL_ROTATION_MARGIN) / maxDim) *
    HERO_MODEL_EXTRA_SCALE;
  obj.scale.setScalar(s);
  box.setFromObject(obj);
  const centre = box.getCenter(new THREE.Vector3());
  obj.position.sub(centre);
}

function loadModel(url, format) {
  return new Promise((resolve, reject) => {
    const loader = format === "glb" ? new GLTFLoader() : new FBXLoader();
    loader.load(
      url,
      (result) => resolve(format === "glb" ? result.scene : result),
      undefined,
      reject,
    );
  });
}

function disposeObject3D(obj) {
  obj.traverse?.((child) => {
    child.geometry?.dispose();
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        Object.values(m).forEach((v) => {
          if (v instanceof THREE.Texture) v.dispose();
        });
        m.dispose?.();
      });
    }
  });
}

function ModelScene({ scrollRef, onAllModelsFailed }) {
  const groupRef = useRef(null);
  const [scene, setScene] = useState(null);
  const { invalidate } = useThree();
  const onFailRef = useRef(onAllModelsFailed);
  onFailRef.current = onAllModelsFailed;

  useEffect(() => {
    let cancelled = false;

    const candidates = [
      { url: HERO_PC_MODEL_PATH_GLB, format: "glb" },
      { url: HERO_PC_MODEL_PATH_FBX, format: "fbx" },
    ];

    (async () => {
      let loaded = false;
      for (const { url, format } of candidates) {
        try {
          const obj = await loadModel(url, format);
          if (cancelled) {
            disposeObject3D(obj);
            return;
          }
          fitObjectToBox(obj);
          setScene(obj);
          loaded = true;
          invalidate();
          return;
        } catch {}
      }
      if (!cancelled && !loaded) {
        onFailRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per canvas
  }, []);

  useEffect(() => {
    return () => {
      if (scene) disposeObject3D(scene);
    };
  }, [scene]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const t = scrollRef.current;
    g.rotation.y = HERO_MODEL_BASE_YAW + t * HERO_SCROLL_YAW_PER_PAGE;
    g.rotation.x = Math.sin(t * Math.PI) * HERO_SCROLL_TILT_PEAK;
    g.position.y =
      -t * HERO_SCROLL_SINK + Math.sin(t * Math.PI * 2) * HERO_SCROLL_Y_BOB;
  });

  if (!scene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export default function HeroPCModel() {
  const scrollRef = useRef(0);
  const [useFallbackImage, setUseFallbackImage] = useState(
    () => typeof document !== "undefined" && !isWebGLAvailable(),
  );

  const onModelsFailed = useCallback(() => {
    setUseFallbackImage(true);
  }, []);

  const onCanvasCrashed = useCallback(() => {
    setUseFallbackImage(true);
  }, []);

  useEffect(() => {
    const docEl = document.documentElement;

    const readProgress = () => {
      const scrollTop =
        window.scrollY ??
        window.pageYOffset ??
        docEl.scrollTop ??
        document.body.scrollTop ??
        0;
      const maxScroll = docEl.scrollHeight - docEl.clientHeight;
      scrollRef.current =
        maxScroll > 0
          ? Math.min(1, Math.max(0, scrollTop / maxScroll))
          : 0;
    };

    readProgress();

    const opts = { passive: true };
    window.addEventListener("scroll", readProgress, opts);
    window.addEventListener("resize", readProgress, opts);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", readProgress, opts);
    vv?.addEventListener("scroll", readProgress, opts);

    const ro = new ResizeObserver(readProgress);
    ro.observe(docEl);

    return () => {
      window.removeEventListener("scroll", readProgress, opts);
      window.removeEventListener("resize", readProgress, opts);
      vv?.removeEventListener("resize", readProgress, opts);
      vv?.removeEventListener("scroll", readProgress, opts);
      ro.disconnect();
    };
  }, []);

  if (useFallbackImage) {
    return (
      <HeroImageShell>
        <HeroFallbackImage />
      </HeroImageShell>
    );
  }

  return (
    <HeroImageShell>
      <div
        className="relative w-full min-h-0 touch-pan-y"
        style={FRAME_STYLE}
      >
        <HeroCanvasErrorBoundary onFallback={onCanvasCrashed}>
          <Canvas
            frameloop="always"
            camera={{ position: [0, 0, 5.05], fov: 40, near: 1, far: 200 }}
            className="block h-full w-full"
            style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
            dpr={[1, 2]}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: "high-performance",
            }}
          >
            <ambientLight intensity={0.62} />
            <directionalLight position={[8, 10, 6]} intensity={1.05} />
            <directionalLight
              position={[-6, 4, -8]}
              intensity={0.38}
              color="#c5d8f0"
            />
            <hemisphereLight args={["#eef2f6", "#2a2a2a", 0.32]} />
            <ModelScene scrollRef={scrollRef} onAllModelsFailed={onModelsFailed} />
          </Canvas>
        </HeroCanvasErrorBoundary>
      </div>
    </HeroImageShell>
  );
}
