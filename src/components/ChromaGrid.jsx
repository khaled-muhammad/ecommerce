import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useTheme } from '../theme/useTheme.js';
import './ChromaGrid.css';

export const ChromaGrid = ({
  items,
  variant = 'default',
  className = '',
  radius = 300,
  columns = 3,
  rows = 2,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out'
}) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const isBrands = variant === 'brands';
  const rootRef = useRef(null);
  const fadeRef = useRef(null);
  const setX = useRef(null);
  const setY = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  const demo = [
    {
      image: 'https://i.pravatar.cc/300?img=8',
      title: 'Alex Rivera',
      subtitle: 'Full Stack Developer',
      handle: '@alexrivera',
      borderColor: '#4F46E5',
      gradient: 'linear-gradient(145deg, #4F46E5, #000)',
      url: 'https://github.com/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=11',
      title: 'Jordan Chen',
      subtitle: 'DevOps Engineer',
      handle: '@jordanchen',
      borderColor: '#10B981',
      gradient: 'linear-gradient(210deg, #10B981, #000)',
      url: 'https://linkedin.com/in/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=3',
      title: 'Morgan Blake',
      subtitle: 'UI/UX Designer',
      handle: '@morganblake',
      borderColor: '#F59E0B',
      gradient: 'linear-gradient(165deg, #F59E0B, #000)',
      url: 'https://dribbble.com/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=16',
      title: 'Casey Park',
      subtitle: 'Data Scientist',
      handle: '@caseypark',
      borderColor: '#EF4444',
      gradient: 'linear-gradient(195deg, #EF4444, #000)',
      url: 'https://kaggle.com/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=25',
      title: 'Sam Kim',
      subtitle: 'Mobile Developer',
      handle: '@thesamkim',
      borderColor: '#8B5CF6',
      gradient: 'linear-gradient(225deg, #8B5CF6, #000)',
      url: 'https://github.com/'
    },
    {
      image: 'https://i.pravatar.cc/300?img=60',
      title: 'Tyler Rodriguez',
      subtitle: 'Cloud Architect',
      handle: '@tylerrod',
      borderColor: '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4, #000)',
      url: 'https://aws.amazon.com/'
    }
  ];
  const data = items?.length ? items : demo;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setX.current = gsap.quickSetter(el, '--x', 'px');
    setY.current = gsap.quickSetter(el, '--y', 'px');
    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x, y) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true
    });
  };

  const handleMove = e => {
    if (isBrands) return;
    const r = rootRef.current.getBoundingClientRect();
    moveTo(e.clientX - r.left, e.clientY - r.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
  };

  const handleLeave = () => {
    if (isBrands) return;
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true
    });
  };

  const handleCardClick = item => {
    if (item?.to) {
      navigate(item.to);
      return;
    }
    if (item?.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardMove = e => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    if (isBrands) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 8; // Adjust sensitivity
      const rotateY = (centerX - x) / 8;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    }
  };

  const handleCardLeave = e => {
    const card = e.currentTarget;
    card.style.transform = '';
  };

  return (
    <div
      ref={rootRef}
      className={`chroma-grid ${isBrands ? 'chroma-grid--brands' : ''} ${className}`.trim()}
      style={{
        '--r': `${radius}px`,
        ...(isBrands
          ? {}
          : { '--cols': columns, '--rows': rows })
      }}
      onPointerMove={isBrands ? undefined : handleMove}
      onPointerLeave={isBrands ? undefined : handleLeave}
    >
      {data.map((c, i) =>
        isBrands ? (
          <article
            key={c.title ? `${c.title}-${i}` : i}
            className="chroma-card chroma-card--brand"
            onClick={() => handleCardClick(c)}
            aria-label={
              c.to
                ? `View ${c.title} products in the shop`
                : c.url
                  ? `${c.title}, opens in a new tab`
                  : undefined
            }
            role={c.to || c.url ? 'link' : undefined}
            tabIndex={c.to || c.url ? 0 : undefined}
            onKeyDown={
              c.to || c.url
                ? e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(c);
                    }
                  }
                : undefined
            }
            style={{
              '--brand-accent': c.borderColor || 'currentColor',
              cursor: c.to || c.url ? 'pointer' : 'default',
            }}
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
          >
            <div className="chroma-brand-cell">
              <div className="chroma-brand-logo">
                <img
                  src={isDark && c.imageDark ? c.imageDark : c.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3 className="chroma-brand-name">{c.title}</h3>
            </div>
          </article>
        ) : (
          <article
            key={c.title ? `${c.title}-${i}` : i}
            className="chroma-card"
            onMouseMove={handleCardMove}
            onClick={() => handleCardClick(c)}
            aria-label={
              c.to
                ? `${c.title}, navigate in app`
                : c.url
                  ? `${c.title}, opens in a new tab`
                  : undefined
            }
            role={c.to || c.url ? 'link' : undefined}
            tabIndex={c.to || c.url ? 0 : undefined}
            onKeyDown={
              c.to || c.url
                ? e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(c);
                    }
                  }
                : undefined
            }
            style={{
              '--card-border': c.borderColor || 'transparent',
              '--card-gradient': c.gradient,
              cursor: c.to || c.url ? 'pointer' : 'default',
            }}
          >
            <div className="chroma-img-wrapper">
              <img src={c.image} alt="" loading="lazy" />
            </div>
            <footer className="chroma-info">
              <h3 className="name">{c.title}</h3>
              {c.handle ? <span className="handle">{c.handle}</span> : null}
              {c.subtitle ? <p className="role">{c.subtitle}</p> : null}
              {c.location ? <span className="location">{c.location}</span> : null}
            </footer>
          </article>
        )
      )}
      {!isBrands ? (
        <>
          <div className="chroma-overlay" />
          <div ref={fadeRef} className="chroma-fade" />
        </>
      ) : null}
    </div>
  );
};

export default ChromaGrid;
