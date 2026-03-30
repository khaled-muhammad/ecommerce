import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { gsap } from "gsap";
import "./PixelTransition.css";

const PixelTransition = forwardRef(function PixelTransition(
  {
    firstContent,
    secondContent,
    gridSize = 7,
    pixelColor = "currentColor",
    animationStepDuration = 0.3,
    once = false,
    aspectRatio = "100%",
    className = "",
    style = {},
    /** Fires after the forward reveal finishes (pixels cleared, second layer visible). */
    onRevealComplete,
    /** If false, hover/focus/click do not run transitions (e.g. programmatic carousel only). */
    interactive = true,
    /** Use full height of parent (e.g. absolute inset-0) instead of padding-top aspect ratio. */
    fillParent = false,
  },
  ref,
) {
  const containerRef = useRef(null);
  const pixelGridRef = useRef(null);
  const activeRef = useRef(null);
  const delayedCallRef = useRef(null);
  const completeCallRef = useRef(null);
  const onRevealCompleteRef = useRef(onRevealComplete);
  onRevealCompleteRef.current = onRevealComplete;

  const [isActive, setIsActive] = useState(false);

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches);

  useEffect(() => {
    const pixelGridEl = pixelGridRef.current;
    if (!pixelGridEl) return;

    pixelGridEl.innerHTML = "";

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixel = document.createElement("div");
        pixel.classList.add("pixelated-image-card__pixel");
        pixel.style.backgroundColor = pixelColor;

        const size = 100 / gridSize;
        pixel.style.width = `${size}%`;
        pixel.style.height = `${size}%`;
        pixel.style.left = `${col * size}%`;
        pixel.style.top = `${row * size}%`;
        pixelGridEl.appendChild(pixel);
      }
    }
  }, [gridSize, pixelColor]);

  const snapInactive = useCallback(() => {
    const pixelGridEl = pixelGridRef.current;
    const activeEl = activeRef.current;
    const pixels = pixelGridEl?.querySelectorAll(".pixelated-image-card__pixel") ?? [];
    gsap.killTweensOf(pixels);
    if (delayedCallRef.current) delayedCallRef.current.kill();
    if (completeCallRef.current) completeCallRef.current.kill();
    pixels.forEach((p) => {
      p.style.display = "none";
    });
    if (activeEl) {
      activeEl.style.display = "none";
      activeEl.style.pointerEvents = "";
    }
    setIsActive(false);
  }, []);

  const animatePixels = useCallback(
    (activate) => {
      setIsActive(activate);

      const pixelGridEl = pixelGridRef.current;
      const activeEl = activeRef.current;
      if (!pixelGridEl || !activeEl) return;

      const pixels = pixelGridEl.querySelectorAll(".pixelated-image-card__pixel");
      if (!pixels.length) return;

      gsap.killTweensOf(pixels);
      if (delayedCallRef.current) delayedCallRef.current.kill();
      if (completeCallRef.current) completeCallRef.current.kill();

      gsap.set(pixels, { display: "none" });

      const totalPixels = pixels.length;
      const staggerDuration = animationStepDuration / totalPixels;

      gsap.to(pixels, {
        display: "block",
        duration: 0,
        stagger: {
          each: staggerDuration,
          from: "random",
        },
      });

      delayedCallRef.current = gsap.delayedCall(animationStepDuration, () => {
        activeEl.style.display = activate ? "block" : "none";
        activeEl.style.pointerEvents = activate ? "none" : "";
      });

      gsap.to(pixels, {
        display: "none",
        duration: 0,
        delay: animationStepDuration,
        stagger: {
          each: staggerDuration,
          from: "random",
        },
      });

      if (activate && onRevealCompleteRef.current) {
        completeCallRef.current = gsap.delayedCall(animationStepDuration * 2, () => {
          onRevealCompleteRef.current?.();
        });
      }
    },
    [animationStepDuration],
  );

  const playForward = useCallback(() => {
    animatePixels(true);
  }, [animatePixels]);

  useImperativeHandle(
    ref,
    () => ({
      playForward,
      reset: snapInactive,
    }),
    [playForward, snapInactive],
  );

  const handleEnter = () => {
    if (!interactive || isActive) return;
    animatePixels(true);
  };
  const handleLeave = () => {
    if (!interactive || !isActive || once) return;
    animatePixels(false);
  };
  const handleClick = () => {
    if (!interactive) return;
    if (!isActive) animatePixels(true);
    else if (!once) animatePixels(false);
  };

  return (
    <div
      ref={containerRef}
      className={`pixelated-image-card ${fillParent ? "h-full w-full" : ""} ${className}`}
      style={style}
      onMouseEnter={interactive && !isTouchDevice ? handleEnter : undefined}
      onMouseLeave={interactive && !isTouchDevice ? handleLeave : undefined}
      onClick={interactive && isTouchDevice ? handleClick : undefined}
      onFocus={interactive && !isTouchDevice ? handleEnter : undefined}
      onBlur={interactive && !isTouchDevice ? handleLeave : undefined}
      tabIndex={interactive ? 0 : -1}
    >
      {!fillParent ? <div style={{ paddingTop: aspectRatio }} /> : null}
      <div className="pixelated-image-card__default" aria-hidden={isActive}>
        {firstContent}
      </div>
      <div className="pixelated-image-card__active" ref={activeRef} aria-hidden={!isActive}>
        {secondContent}
      </div>
      <div className="pixelated-image-card__pixels" ref={pixelGridRef} />
    </div>
  );
});

PixelTransition.displayName = "PixelTransition";

export default PixelTransition;
