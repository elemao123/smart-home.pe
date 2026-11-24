/**
 * Smart Home Inmobiliaria — Interacciones Seguras (CSP-compliant, sin inline scripts),
 * Validación y Sanitización Anti-XSS / Anti-Bots en Formulario, y Navegación Responsiva
 */
(function () {
  'use strict';

  const video = document.getElementById('hero-video');
  const fallbackNotice = document.getElementById('video-fallback-notice');
  const openMenuBtn = document.getElementById('mobile-menu-open');
  const closeMenuBtn = document.getElementById('mobile-menu-close');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
  const projectButtons = document.querySelectorAll('[data-project]');
  const projectSelect = document.getElementById('project-select');
  const contactForm = document.getElementById('contact-form');
  const contactError = document.getElementById('contact-error');
  const honeypotInput = document.getElementById('website_url_hp');

  let lastSubmitTimestamp = 0;

  // 1. Preferencia de movimiento reducido (prefers-reduced-motion)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function syncVideoWithMotionPreference() {
    if (!video) return;
    if (prefersReducedMotion.matches) {
      video.pause();
    } else if (typeof video.play === 'function') {
      video.play().catch(() => {});
    }
  }

  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener('change', syncVideoWithMotionPreference);
  }
  syncVideoWithMotionPreference();

  // 2. Pausar video cuando sale de pantalla (IntersectionObserver)
  if (video && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!prefersReducedMotion.matches && typeof video.play === 'function') {
              video.play().catch(() => {});
            }
          } else if (typeof video.pause === 'function') {
            video.pause();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(video);
  }

  // 3. Si el video no carga, indicar el archivo pendiente sin inventar un sustituto
  if (video && fallbackNotice) {
    video.addEventListener('error', () => {
      fallbackNotice.hidden = false;
    });
  }

  // 4. Menú móvil negro translúcido (apertura, cierre y tecla Escape)
  function openMobileMenu() {
    if (!mobileMenu || !openMenuBtn) return;
    mobileMenu.hidden = false;
    openMenuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (closeMenuBtn) closeMenuBtn.focus();
  }

  function closeMobileMenu() {
    if (!mobileMenu || !openMenuBtn) return;
    mobileMenu.hidden = true;
    openMenuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    openMenuBtn.focus();
  }

  if (openMenuBtn) {
    openMenuBtn.addEventListener('click', openMobileMenu);
  }
  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', closeMobileMenu);
  }
  mobileLinks.forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu && !mobileMenu.hidden) {
      closeMobileMenu();
    }
  });

  // 5. Seleccionar automáticamente el proyecto en el formulario de contacto al hacer clic en "Cotizar"
  projectButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetProject = btn.getAttribute('data-project');
      if (projectSelect && targetProject) {
        projectSelect.value = targetProject;
      }
    });
  });

  // 6. Sanitización Anti-XSS y Validación Segura del Formulario de Contacto
  function sanitizeText(str) {
    return String(str || '')
      .replace(/[<>]/g, '')
      .trim();
  }

  function showFormError(msg) {
    if (!contactError) return;
    contactError.textContent = msg;
    contactError.hidden = false;
  }

  function clearFormError() {
    if (!contactError) return;
    contactError.textContent = '';
    contactError.hidden = true;
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFormError();

      // Protección Anti-Bot (Honeypot)
      if (honeypotInput && honeypotInput.value.trim() !== '') {
        return;
      }

      // Protección Rate-Limiting contra envíos automatizados (mínimo 8s entre envíos)
      const now = Date.now();
      if (now - lastSubmitTimestamp < 8000) {
        showFormError('Por favor espera unos segundos antes de enviar otra solicitud.');
        return;
      }

      const nombreInput = document.getElementById('contact-nombre');
      const telefonoInput = document.getElementById('contact-telefono');
      const emailInput = document.getElementById('contact-email');
      const mensajeInput = document.getElementById('contact-mensaje');

      const nombre = sanitizeText(nombreInput ? nombreInput.value : '');
      const telefono = sanitizeText(telefonoInput ? telefonoInput.value : '');
      const email = sanitizeText(emailInput ? emailInput.value : '');
      const mensaje = sanitizeText(mensajeInput ? mensajeInput.value : '');

      if (nombre.length < 2) {
        showFormError('Por favor ingresa tu nombre y apellidos.');
        if (nombreInput) nombreInput.focus();
        return;
      }

      const phoneRegex = /^[0-9+\s()-]{7,20}$/;
      if (!phoneRegex.test(telefono)) {
        showFormError('Por favor ingresa un número de celular o WhatsApp válido.');
        if (telefonoInput) telefonoInput.focus();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(email)) {
        showFormError('Por favor ingresa un correo electrónico válido.');
        if (emailInput) emailInput.focus();
        return;
      }

      if (nombreInput) nombreInput.value = nombre;
      if (telefonoInput) telefonoInput.value = telefono;
      if (emailInput) emailInput.value = email;
      if (mensajeInput) mensajeInput.value = mensaje;

      lastSubmitTimestamp = now;

      // Envío real: abre WhatsApp con la consulta ya redactada (no hay servidor que reciba el formulario)
      const tipologiaSel = contactForm.querySelector('select[name="modalidad"]');
      const proyectoSel = contactForm.querySelector('select[name="proyecto"]');
      const optText = (sel) => (sel && sel.selectedOptions[0] ? sel.selectedOptions[0].textContent.trim() : '');
      const lineas = [
        'Hola, quiero agendar una visita / cotización.',
        'Nombre: ' + nombre,
        'Celular: ' + telefono,
        'Correo: ' + email,
        'Proyecto: ' + optText(proyectoSel),
        'Tipología: ' + optText(tipologiaSel)
      ];
      if (mensaje) lineas.push('Mensaje: ' + mensaje);
      const waUrl = 'https://wa.me/51989144212?text=' + encodeURIComponent(lineas.join('\n'));
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      contactForm.classList.add('is-submitted');
    });
  }
})();
