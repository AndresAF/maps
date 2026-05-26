import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import logoCoyoacan from '../assets/logoCoyoacan.png'

export default function IntroAnimation({ onComplete }) {
  const overlayRef = useRef()
  const logoRef = useRef()
  const lineRef = useRef()

  useEffect(() => {
    const tl = gsap.timeline()

    tl.fromTo(logoRef.current,
      { opacity: 0, scale: 0.88, filter: 'blur(8px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' }
    )
    .fromTo(lineRef.current,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.35, ease: 'expo.out' },
      '-=0.1'
    )
    .to({}, { duration: 0.25 })
    .to([logoRef.current, lineRef.current],
      { opacity: 0, scale: 1.06, duration: 0.25, ease: 'power2.in' }
    )
    .to(overlayRef.current,
      {
        clipPath: 'circle(0% at 50% 50%)',
        duration: 0.45,
        ease: 'power3.in',
        onComplete,
      },
      '-=0.05'
    )

    return () => tl.kill()
  }, [])

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(ellipse at 50% 40%, #1e0a35 0%, #0a0a0a 65%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '20px',
        clipPath: 'circle(150% at 50% 50%)',
      }}
    >
      <img
        ref={logoRef}
        src={logoCoyoacan}
        alt="Coyoacán"
        style={{ width: 160, height: 160, objectFit: 'contain', opacity: 0 }}
      />
      <div
        ref={lineRef}
        style={{
          width: '180px', height: '3px',
          background: 'linear-gradient(90deg, #e91e2c 0%, #feb615 30%, #01a0e0 65%, #704e9f 100%)',
          borderRadius: '2px',
          transformOrigin: 'left center',
          boxShadow: '0 0 12px rgba(1,160,224,0.5)',
        }}
      />
    </div>
  )
}
