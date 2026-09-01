import { useEffect } from 'react'

/**
 * A camada de movimento da landing, portada do mockup: revelação por
 * IntersectionObserver, o ponto da seção que acende no eixo, e o eixo que
 * cresce com o scroll — a página é a própria barra de progresso.
 *
 * Com `prefers-reduced-motion` nada disso anima: as barras já nascem no
 * tamanho final, sem escalonamento, e a rolagem do manifesto é desligada no
 * CSS. O eixo continua sendo pintado porque é posição, não movimento.
 */
export function useLandingMotion() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const grow = (el: Element) => {
      el.querySelectorAll<HTMLElement>('.fam-bar').forEach((bar, i) => {
        const width = bar.dataset.w
        if (!width) return
        if (reduced) bar.style.width = width
        else setTimeout(() => (bar.style.width = width), i * 34)
      })
    }

    const rise = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('in')
          grow(e.target)
          rise.unobserve(e.target)
        })
      },
      { rootMargin: '0px 0px -12% 0px' }
    )
    document.querySelectorAll('.rise').forEach((el) => rise.observe(el))

    const lit = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('lit', e.isIntersecting)),
      { rootMargin: '-45% 0px -45% 0px' }
    )
    document.querySelectorAll('.sec').forEach((el) => lit.observe(el))

    const fill = document.getElementById('axisFill')
    let ticking = false
    const draw = () => {
      ticking = false
      if (!fill) return
      const h = document.documentElement.scrollHeight - window.innerHeight
      fill.style.height = `${(h > 0 ? Math.min(window.scrollY / h, 1) : 0) * 100}%`
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(draw)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    draw()

    return () => {
      rise.disconnect()
      lit.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
}
