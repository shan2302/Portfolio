import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import gsap from 'gsap';
import SplitType from 'split-type';

const ThreeStage = lazy(() => import('./ThreeStage.jsx'));

const projects = [
  { title: 'Money Manager', type: 'PERSONAL FINANCE', url: 'https://github.com/shan2302/moneymanager', description: 'A personal finance application with JWT-secured APIs and reporting workflows. Java 21 and Spring Boot run the backend; React 19, Vite, and Tailwind CSS run the frontend.', tags: ['JAVA 21', 'SPRING BOOT', 'SPRING SECURITY', 'JWT', 'REACT 19', 'VITE', 'TAILWIND CSS', 'POSTGRESQL', 'MYSQL', 'APACHE POI', 'BREVO SMTP'] },
  { title: 'KrishiVaani AI', type: 'VOICE AI', url: 'https://github.com/shan2302/Krishivaani-AI', description: 'An AI assistant for agricultural information, built around voice input and practical local-language access.', tags: ['AI', 'SPRING BOOT', 'WHISPER', 'VOICE', 'PYTHON'] },
  { title: 'CA Saathi', type: 'PRACTICE MANAGEMENT', url: 'https://github.com/shan2302/CASaathi', description: 'A practice management platform for Chartered Accountants, bringing GST, TDS, Income Tax workflows, documents, deadlines, and reminders into one service.', tags: ['REACT', 'NODE.JS', 'EXPRESS', 'MONGODB', 'JWT'] },
  { title: 'Student Fee Portal', type: 'EDUCATION MANAGEMENT', url: 'https://github.com/shan2302/studentFeePortal', description: 'A portal for managing student fee records and payment workflows.', tags: ['JAVA', 'SPRING BOOT', 'DATABASE', 'WEB'] },
  { title: 'Snake CLI', type: 'C / DATA STRUCTURES', url: 'https://github.com/shan2302/SNAKE-GAME', description: 'A terminal implementation of Snake built in C, using linked structures and dynamic memory.', tags: ['C', 'LINKED LISTS', 'DYNAMIC MEMORY'] },
  { title: 'Waterwise', type: 'WATER MANAGEMENT', url: 'https://github.com/shan2302/Waterwise', description: 'A project focused on practical water management and resource awareness.', tags: ['WEB', 'FULL STACK'] },
  { title: 'Astram', type: 'GROUP PROJECT / REAL-TIME GAME', url: 'https://github.com/Sid130698/Astram', description: 'A real-time 1v1 turn-based archery game developed as a group project.', tags: ['GROUP PROJECT', 'SPRING BOOT', 'WEBSOCKETS', 'POSTGRESQL', 'REDIS', 'PHASER.JS'] }
];
const skillGroups = [
  ['BACKEND & LANGUAGES', 'Java 21 · Spring Boot · Spring Security · Go · Python · REST APIs · JWT · OAuth2'],
  ['FRONTEND', 'React 19 · TypeScript · JavaScript · Vite · Tailwind CSS'],
  ['DATABASES & INFRA', 'PostgreSQL · PGVector · MySQL · MongoDB · Redis · Docker · Vercel · Render']
];

function Magnetic({ children, className = '', ...props }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });
  return <motion.a {...props} className={className} style={{ x: springX, y: springY }} onPointerMove={(event) => {
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x((event.clientX - rect.left - rect.width / 2) * .18);
    y((event.clientY - rect.top - rect.height / 2) * .18);
  }} onPointerLeave={() => { x(0); y(0); }}>{children}</motion.a>;
}

function Chat({ open, setOpen, origin }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, busy]);
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setOpen]);

  async function send(event) {
    event.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next.slice(-10) }) });
      let data;
      try { data = await response.json(); }
      catch { throw new Error(`Chat server returned an unreadable response (HTTP ${response.status}).`); }
      if (!response.ok) throw new Error(data.error || 'The assistant is unavailable. Please try again.');
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', content: error.message || 'Please email shantanu230205@gmail.com.', error: true }]);
    } finally { setBusy(false); }
  }

  return <AnimatePresence>
    {open && <motion.aside className="chat-panel open" aria-label="Chat with AI" aria-hidden="false" style={{ transformOrigin: `${origin.x}px ${origin.y}px` }} initial={{ opacity: 0, scale: .06, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .06, y: 20 }} transition={{ duration: .52, ease: [.16, 1, .3, 1] }}>
      <div className="chat-head"><div><span className="chat-status"><i /> AVAILABLE</span><h2>Ask about<br />my work<span className="period">.</span></h2></div><button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button></div>
      <div className="chat-messages" ref={scrollRef} aria-live="polite">
        {!messages.length && <div className="chat-message assistant"><p>Hi! Ask me about Shantanu’s projects, skills, or background.</p></div>}
      {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`chat-message ${message.role}${message.error ? ' error' : ''}`}>
          {message.role === 'assistant' && window.marked && window.DOMPurify
            ? <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(message.content, { breaks: true })) }} />
            : <p>{message.content}</p>}
        </div>)}
        {busy && <div className="chat-message assistant"><span className="typing" aria-label="Assistant is typing">…</span></div>}
      </div>
      <form className="chat-form" onSubmit={send}><label className="sr-only" htmlFor="chat-input">Your message</label><input id="chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Write a message…" autoComplete="off" required maxLength={1000} disabled={busy} /><button type="submit" aria-label="Send message" disabled={busy}>↗</button></form>
      <p className="chat-footnote">ANSWERS GROUNDED IN THE PORTFOLIO</p>
    </motion.aside>}
  </AnimatePresence>;
}

export default function App() {
  const heroRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatOrigin, setChatOrigin] = useState({ x: 350, y: 500 });
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springTiltX = useSpring(tiltX, { stiffness: 150, damping: 18 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = [...document.querySelectorAll('[data-text-reveal]')];
    const splits = new Map();
    const observers = [];

    const animateElement = (element) => {
      if (element.dataset.revealed === 'true') return;
      element.dataset.revealed = 'true';
      gsap.fromTo(element.querySelectorAll('.line'),
        { yPercent: 115 },
        { yPercent: 0, duration: 0.85, stagger: 0.075, ease: 'power3.out' }
      );
    };

    elements.forEach((element) => {
      const split = new SplitType(element, { types: 'lines', tagName: 'span' });
      splits.set(element, split);

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateElement(element);
            observer.disconnect();
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

      observer.observe(element);
      observers.push(observer);
    });

    let resizeFrame;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        splits.forEach((split, element) => {
          if (element.dataset.revealed === 'true') return;
          split.revert();
          splits.set(element, new SplitType(element, { types: 'lines', tagName: 'span' }));
        });
      });
    });

    elements.forEach((element) => resizeObserver.observe(element));

    return () => {
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      observers.forEach((observer) => observer.disconnect());
      splits.forEach((split) => split.revert());
    };
  }, []);
  const springTiltY = useSpring(tiltY, { stiffness: 150, damping: 18 });

  function tiltHero(event) {
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = heroRef.current.getBoundingClientRect();
    tiltX(((event.clientY - rect.top) / rect.height - .5) * -2.2);
    tiltY(((event.clientX - rect.left) / rect.width - .5) * 2.2);
  }
  function openChat(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const panelWidth = Math.min(390, window.innerWidth - 32);
    const panelHeight = Math.min(560, window.innerHeight - 120);
    const panelLeft = window.innerWidth - (mobile ? 12 : 24) - panelWidth;
    const panelTop = window.innerHeight - (mobile ? 70 : 82) - panelHeight;
    setChatOrigin({ x: rect.left + rect.width / 2 - panelLeft, y: rect.top + rect.height / 2 - panelTop });
    setChatOpen((current) => !current);
  }

  return <>
    <Suspense fallback={null}><ThreeStage /></Suspense>
    <div className="page-frame" ref={heroRef}>
      <motion.header className="topbar" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: 'easeOut' }}><a className="wordmark" href="#top" aria-label="Shantanu Singh home"><img src="/img/shantanu-logo.png" alt="Shantanu Singh logo" /></a><nav className="site-nav" aria-label="Main navigation"><Magnetic href="#about">ABOUT</Magnetic><Magnetic href="#work">WORK</Magnetic><Magnetic href="#skills">TOOLKIT</Magnetic></nav><Magnetic className="topbar-link" href="#contact">LET’S TALK <span>↗</span></Magnetic></motion.header>
      <main>
        <section className="hero" id="top" onPointerMove={tiltHero} onPointerLeave={() => { tiltX(0); tiltY(0); }}>
          <div className="hero-meta"><span>PORTFOLIO — 2026 / 27</span><span>BANGALORE, INDIA <i className="red-dot" /></span></div>
          <motion.div className="hero-title-mask" style={{ rotateX: springTiltX, rotateY: springTiltY, transformPerspective: 1000 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.025, z: 36, rotateX: -1 }} transition={{ duration: .6, ease: 'easeOut', delay: .12 }}><h1 className="hero-title" data-text-reveal><span>Shantanu</span><span>Singh</span></h1></motion.div>
          <div className="hero-bottom"><p className="hero-description">Java 21, Spring Boot, React 19, TypeScript,<br />Go, Python, PostgreSQL and PGVector.</p><Magnetic className="round-link" href="#work" aria-label="Explore selected work">↓</Magnetic><p className="hero-role">FULL STACK &amp; BACKEND<br />SYSTEMS DEVELOPMENT<br />BENGALURU, INDIA</p></div>
          <motion.figure className="hero-image-wrap" whileHover={{ scale: 1.035, z: 32, rotateY: -1.5 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}><img src="/img/shantanu-1.jpg" alt="Shantanu Singh in an olive green shirt" className="hero-image" /><figcaption className="image-caption">FIG. 1 — SHANTANU, BENGALURU</figcaption><span className="image-index">01 / 02</span></motion.figure>
        </section>
        <motion.section className="intro section-pad reveal parallax-grid" id="about" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .6, ease: 'easeOut' }}><div className="section-label"><span>01 — ABOUT</span><span>THE SHORT VERSION</span></div><div className="intro-layout"><h2 data-text-reveal>Systems thinker.<br /><span>Product builder.</span></h2><div className="intro-copy"><p>I’m an Information Science &amp; Engineering student at RV Institute of Technology and Management, Bengaluru.</p><p>I build backend systems and full-stack products with Java 21, Spring Boot, React 19, TypeScript, Go, Python, PostgreSQL, and PGVector.</p><p>My work focuses on authentication, APIs, retrieval systems, databases, and practical cloud deployment.</p><motion.figure className="about-image" whileHover={{ scale: 1.035, z: 30, rotateY: 1.4 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}><img src="/img/shantanu-2.jpg" alt="Shantanu Singh at an outdoor restaurant" /><figcaption>FIG. 2 — OUTSIDE THE FRAME</figcaption></motion.figure></div></div></motion.section>
        <motion.section className="work section-pad" id="work" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .6, ease: 'easeOut' }}><div className="section-label"><span>02 — SELECTED WORK</span><span>BUILT WITH INTENT</span></div><div className="work-intro"><h2 data-text-reveal>Projects with a<br /><em>purpose.</em></h2><p>A selection of games, practice tools, finance software, and backend systems—each a different way to bring full stack and backend skills into practice.</p></div><div className="project-list">{projects.map((project, index) => <motion.article className="project-card" key={project.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .22 }} whileHover={{ scale: 1.012, y: -3 }} transition={{ duration: .6, ease: 'easeOut' }}><div className="project-heading"><span className="project-number">0{index + 1} / 07</span><span className="project-type">{project.type}</span></div>{project.url ? <a className="project-title" href={project.url} target="_blank" rel="noreferrer"><h3>{project.title}</h3><span aria-hidden="true">↗</span></a> : <div className="project-title"><h3>{project.title}</h3></div>}<p>{project.description}</p><div className="project-bottom"><div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>{project.url && <a className="project-source" href={project.url} target="_blank" rel="noreferrer">VIEW PROJECT <span>↗</span></a>}</div></motion.article>)}</div></motion.section>
        <motion.section className="skills section-pad" id="skills" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .6, ease: 'easeOut' }}><div className="section-label reveal"><span>03 — THE TOOLKIT</span><span>LEARNING BY BUILDING</span></div><div className="skills-layout"><h2 className="reveal" data-text-reveal>Curious by<br />default<span className="period">.</span></h2><div className="skill-groups reveal parallax-grid">{skillGroups.map(([label, skills]) => <div className="skill-row" key={label}><span>{label}</span><p>{skills}</p></div>)}</div></div></motion.section>
        <div className="marquee" aria-label="Build with curiosity, ship with care"><div className="marquee-track"><div className="marquee-group"><span>BUILD WITH CURIOSITY</span><i>✳</i><span>SHIP WITH CARE</span><i>✳</i></div><div className="marquee-group" aria-hidden="true"><span>BUILD WITH CURIOSITY</span><i>✳</i><span>SHIP WITH CARE</span><i>✳</i></div></div></div>
        <motion.section className="contact section-pad" id="contact" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .6, ease: 'easeOut' }}><div className="section-label reveal"><span>04 — OPEN CHANNEL</span><span>HAVE A GOOD ONE IN MIND?</span></div><div className="contact-content reveal"><h2 data-text-reveal>Let’s make<br />it <em>matter.</em></h2><Magnetic className="email-link" href="mailto:shantanu230205@gmail.com">shantanu230205<br />@gmail.com <span>↗</span></Magnetic><div className="contact-bottom"><span>BENGALURU, INDIA</span><div><a href="https://github.com/shan2302" target="_blank" rel="noreferrer" aria-label="Shantanu Singh on GitHub">GITHUB ↗</a></div></div></div></motion.section>
      </main>
      <footer><img className="footer-logo" src="/img/shantanu-logo.png" alt="Shantanu Singh logo" /><span>© SHANTANU SINGH · 2026 / 27</span><span>MADE WITH INTENTION <b>✳</b></span><a href="#top">BACK TO TOP ↑</a></footer>
    </div>
    <motion.button className="chat-launch magnetic" id="chat-launch" aria-label="Open AI chat" onClick={openChat} whileTap={{ scale: .96 }}><span className="chat-launch-icon">✳</span> ASK AI</motion.button>
    <Chat open={chatOpen} setOpen={setChatOpen} origin={chatOrigin} />
  </>;
}
