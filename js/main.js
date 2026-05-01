/* ============================================================
   EcoTech Solar Panels — Main JS
   ============================================================ */

(function () {
  'use strict';
  const PRODUCTS_CMS_KEY = 'pansur_products_cms_v2';
  const LEGACY_PRODUCTS_CMS_KEY = 'pansur_products_cms_v1';
  const CONTACT_CMS_KEY = 'pansur_contact_cms_v1';
  const ABOUT_CMS_KEY = 'pansur_about_cms_v1';
  const QUOTE_CMS_KEY = 'pansur_quote_cms_v1';
  const HEADER_CMS_KEY = 'pansur_header_cms_v1';
  const SAVINGS_CMS_KEY = 'pansur_savings_cms_v1';
  const SOCIAL_CMS_KEY = 'pansur_social_cms_v1';
  const VISIBILITY_CMS_KEY = 'pansur_visibility_cms_v1';
  const FAQ_CMS_KEY = 'pansur_faq_cms_v1';
  const WHY_CMS_KEY = 'pansur_why_cms_v1';
  const KPIS_CMS_KEY = 'pansur_kpis_cms_v1';
  const SAFE_HREF_RE = /^(?:https?:|mailto:|tel:|#|\/(?!\/))/i;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const DEFAULT_PRODUCTS_CMS = {
    products: [
      { id: 'p1', title: 'NeON 2 315W', image: 'images/product-01-370x300.jpg', description: 'Panel solar monocristalino de alta eficiencia para instalaciones residenciales, con excelente rendimiento en distintas condiciones climaticas.' },
      { id: 'p2', title: 'SolarWorld SW 270 Black', image: 'images/product-02-370x300.jpg', description: 'Panel de diseño elegante color negro, ideal para proyectos que requieren estetica y produccion energetica confiable.' },
      { id: 'p3', title: 'EcoGreen 5W 12V Panel Solar', image: 'images/product-03-370x300.jpg', description: 'Solucion compacta para consumos menores, perfecta para sistemas aislados, iluminacion y respaldo de energia.' },
      { id: 'p4', title: 'Kit residencial 3kW', image: 'images/product-01-370x300.jpg', description: 'Kit completo para vivienda, pensado para reducir el consumo electrico mensual y mejorar la autonomia energetica del hogar.' },
      { id: 'p5', title: 'Kit comercial 8kW', image: 'images/product-02-370x300.jpg', description: 'Sistema para comercios y pymes con mayor demanda, diseñado para estabilizar costos y optimizar el retorno de inversion.' },
      { id: 'p6', title: 'Inversor hibrido 5kW', image: 'images/product-03-370x300.jpg', description: 'Inversor hibrido para integrar paneles, red y baterias, permitiendo mayor continuidad operativa y control del consumo.' }
    ],
    featuredIds: ['p1', 'p2', 'p3']
  };
  const DEFAULT_CONTACT_CMS = {
    contactTitle: 'Contactanos',
    navPhone: '555-376-7872',
    formTitle: 'Solicita una cotizacion para una instalacion de paneles solares residencial o comercial',
    offices: [
      {
        name: 'Oficina central (Boston, MA, EE. UU.)',
        address1: '8949 Kenamar Drive, Suite 101',
        address2: 'Boston, MA 92121',
        phone: '555-376-7872',
        fax: '555-376-7873'
      },
      {
        name: 'Oficina de Toronto',
        address1: '2000 Finch Avenue West',
        address2: 'Toronto, Ontario M3J 2V5',
        phone: '555-376-7872',
        fax: '555-376-7873'
      }
    ]
  };
  const DEFAULT_ABOUT_CMS = {
    title: 'Quienes somos',
    subtitle: 'Equipo de especialistas en energia alternativa',
    description: 'Nuestra empresa ofrece un servicio integral y orientado al cliente en energia alternativa, centrado en la comercializacion, distribucion y transporte de paneles solares. Somos una empresa de energia renovable amigable con el medioambiente que ofrece un amplio portafolio de tecnologias, productos y soluciones para nuestros clientes.',
    images: [
      'images/about-01-639x480.jpg',
      'images/about-02-639x480.jpg',
      'images/about-03-639x480.jpg'
    ]
  };
  const DEFAULT_QUOTE_CMS = {
    destinationEmail: 'ventas@pansur.cl',
    enabledRegions: [
      'Arica y Parinacota',
      'Tarapaca',
      'Antofagasta',
      'Atacama',
      'Coquimbo',
      'Valparaiso',
      "Libertador General Bernardo O'Higgins",
      'Maule',
      'Biobio',
      'Araucania',
      'Los Rios',
      'Los Lagos',
      'Aysen',
      'Magallanes y Antartica Chilena',
      'Metropolitana de Santiago'
    ]
  };
  const DEFAULT_HEADER_CMS = {
    heroPrimary: 'PAN',
    heroSecondary: 'SUR Paneles Solares',
    heroDescription: 'Los paneles solares son perfectos si buscas una fuente confiable de energia adicional para tu hogar u oficina.',
    heroButtonText: 'Mas informacion',
    heroButtonLink: '#about',
    slides: [
      'images/slide-03.jpg',
      'images/slide-02.jpg',
      'images/slide-01.jpg'
    ]
  };
  const DEFAULT_SAVINGS_CMS = {
    defaultKwh: 320,
    defaultBill: 85000,
    coverageMin: 20,
    coverageMax: 95,
    coverageStep: 5,
    coverageDefault: 60
  };
  const DEFAULT_SOCIAL_CMS = {
    links: [
      { key: 'facebook', label: 'Facebook', iconClass: 'fa-brands fa-facebook-f', href: '#', enabled: true },
      { key: 'twitter', label: 'X (Twitter)', iconClass: 'fa-brands fa-x-twitter', href: '#', enabled: true },
      { key: 'instagram', label: 'Instagram', iconClass: 'fa-brands fa-instagram', href: '#', enabled: true },
      { key: 'youtube', label: 'YouTube', iconClass: 'fa-brands fa-youtube', href: '#', enabled: true },
      { key: 'linkedin', label: 'LinkedIn', iconClass: 'fa-brands fa-linkedin-in', href: '#', enabled: true }
    ]
  };
  const DEFAULT_VISIBILITY_CMS = {
    header: true,
    why: true,
    kpis: true,
    about: true,
    savings: true,
    products: true,
    faq: true,
    contact: true,
    quote: true,
    social: true
  };
  const DEFAULT_FAQ_CMS = {
    items: [
      {
        question: '¿Cuanto puedo ahorrar con paneles solares?',
        answer: 'El ahorro depende de tu consumo, ubicacion y porcentaje de cobertura solar. Puedes usar la calculadora del sitio para obtener una referencia inicial.'
      },
      {
        question: '¿Cuanto tarda la instalacion?',
        answer: 'En proyectos residenciales suele completarse en pocos dias luego de la visita tecnica y validacion del sistema recomendado.'
      },
      {
        question: '¿Que incluye el servicio de PANSU?',
        answer: 'Incluye asesoria, propuesta tecnica, instalacion, puesta en marcha y acompañamiento postventa segun el tipo de proyecto.'
      }
    ]
  };
  const DEFAULT_WHY_CMS = {
    caption: 'Descubre los principales beneficios de trabajar con nosotros en cada etapa de tu proyecto solar.',
    items: [
      {
        iconClass: 'fa-solid fa-chart-line',
        title: 'Calcula tu ahorro',
        description: 'Con nuestra calculadora de ahorro, puedes tomar la mejor decision para instalar paneles solares de PANSU.'
      },
      {
        iconClass: 'fa-solid fa-solar-panel',
        title: 'Instalacion: Como funciona?',
        description: 'Conoce todos los aspectos del proceso de instalacion de paneles solares junto a nuestros expertos y resuelve tus dudas.'
      },
      {
        iconClass: 'fa-solid fa-headset',
        title: 'Soporte al cliente 24/7',
        description: 'Nuestra empresa ofrece soporte gratuito 24/7 a todos nuestros clientes que tengan consultas o problemas con los productos y servicios de PANSU.'
      }
    ]
  };
  const DEFAULT_KPIS_CMS = {
    items: [
      { iconClass: 'fa-solid fa-solar-panel', value: '1.250+', label: 'Instalaciones realizadas' },
      { iconClass: 'fa-solid fa-house-chimney', value: '980+', label: 'Hogares con energia solar' },
      { iconClass: 'fa-solid fa-building', value: '270+', label: 'Proyectos comerciales' },
      { iconClass: 'fa-solid fa-bolt', value: '32%', label: 'Ahorro promedio anual' }
    ]
  };
  const CHILE_REGIONS_COMUNAS = {
    'Arica y Parinacota': ['Arica', 'Camarones', 'Putre', 'General Lagos'],
    'Tarapaca': ['Alto Hospicio', 'Iquique', 'Huara', 'Camina', 'Colchane', 'Pica', 'Pozo Almonte'],
    'Antofagasta': ['Tocopilla', 'Maria Elena', 'Calama', 'Ollague', 'San Pedro de Atacama', 'Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal'],
    'Atacama': ['Chanaral', 'Diego de Almagro', 'Copiapo', 'Caldera', 'Tierra Amarilla', 'Vallenar', 'Freirina', 'Huasco', 'Alto del Carmen'],
    'Coquimbo': ['La Serena', 'La Higuera', 'Coquimbo', 'Andacollo', 'Vicuna', 'Paihuano', 'Ovalle', 'Rio Hurtado', 'Monte Patria', 'Combarbala', 'Punitaqui', 'Illapel', 'Salamanca', 'Los Vilos', 'Canela'],
    'Valparaiso': ['La Ligua', 'Petorca', 'Cabildo', 'Zapallar', 'Papudo', 'Los Andes', 'San Esteban', 'Calle Larga', 'Rinconada', 'San Felipe', 'Putaendo', 'Santa Maria', 'Panquehue', 'Llaillay', 'Catemu', 'Quillota', 'La Cruz', 'Calera', 'Nogales', 'Hijuelas', 'Limache', 'Olmue', 'Valparaiso', 'Vina del Mar', 'Quintero', 'Puchuncavi', 'Quilpue', 'Villa Alemana', 'Casablanca', 'Concon', 'Juan Fernandez', 'San Antonio', 'Cartagena', 'El Tabo', 'El Quisco', 'Algarrobo', 'Santo Domingo', 'Isla de Pascua'],
    "Libertador General Bernardo O'Higgins": ['Rancagua', 'Graneros', 'Mostazal', 'Codegua', 'Machali', 'Olivar', 'Requinoa', 'Rengo', 'Malloa', 'Quinta de Tilcoco', 'San Vicente', 'Pichidegua', 'Peumo', 'Coltauco', 'Coinco', 'Donihue', 'Las Cabras', 'San Fernando', 'Chimbarongo', 'Placilla', 'Nancagua', 'Chepica', 'Santa Cruz', 'Lolol', 'Pumanque', 'Palmilla', 'Peralillo', 'Pichilemu', 'Navidad', 'Litueche', 'La Estrella', 'Marchihue', 'Paredones'],
    'Maule': ['Curico', 'Teno', 'Romeral', 'Molina', 'Sagrada Familia', 'Hualane', 'Licanten', 'Vichuquen', 'Rauco', 'Talca', 'Pelarco', 'Rio Claro', 'San Clemente', 'Maule', 'San Rafael', 'Empedrado', 'Pencahue', 'Constitucion', 'Curepto', 'Linares', 'Yerbas Buenas', 'Colbun', 'Longavi', 'Parral', 'Retiro', 'Villa Alegre', 'San Javier', 'Cauquenes', 'Pelluhue', 'Chanco'],
    'Biobio': ['Chillan', 'San Carlos', 'Niquen', 'San Fabian', 'Coihueco', 'Pinto', 'San Ignacio', 'El Carmen', 'Yungay', 'Pemuco', 'Bulnes', 'Quillon', 'Ranquil', 'Portezuelo', 'Coelemu', 'Treguaco', 'Cobquecura', 'Quirihue', 'Ninhue', 'San Nicolas', 'Chillan Viejo', 'Alto Biobio', 'Los Angeles', 'Cabrero', 'Tucapel', 'Antuco', 'Quilleco', 'Santa Barbara', 'Quilaco', 'Mulchen', 'Negrete', 'Nacimiento', 'Laja', 'San Rosendo', 'Yumbel', 'Concepcion', 'Talcahuano', 'Penco', 'Tome', 'Florida', 'Hualpen', 'Hualqui', 'Santa Juana', 'Lota', 'Coronel', 'San Pedro de la Paz', 'Chiguayante', 'Lebu', 'Arauco', 'Curanilahue', 'Los Alamos', 'Canete', 'Contulmo', 'Tirua'],
    'Araucania': ['Angol', 'Renaico', 'Collipulli', 'Lonquimay', 'Curacautin', 'Ercilla', 'Victoria', 'Traiguen', 'Lumaco', 'Puren', 'Los Sauces', 'Temuco', 'Lautaro', 'Perquenco', 'Vilcun', 'Cholchol', 'Cunco', 'Melipeuco', 'Curarrehue', 'Pucon', 'Villarrica', 'Freire', 'Pitrufquen', 'Gorbea', 'Loncoche', 'Tolten', 'Teodoro Schmidt', 'Saavedra', 'Carahue', 'Nueva Imperial', 'Galvarino', 'Padre las Casas'],
    'Los Rios': ['Valdivia', 'Mariquina', 'Lanco', 'Mafil', 'Corral', 'Los Lagos', 'Panguipulli', 'Paillaco', 'La Union', 'Futrono', 'Rio Bueno', 'Lago Ranco'],
    'Los Lagos': ['Osorno', 'San Pablo', 'Puyehue', 'Puerto Octay', 'Purranque', 'Rio Negro', 'San Juan de la Costa', 'Puerto Montt', 'Puerto Varas', 'Cochamo', 'Calbuco', 'Maullin', 'Los Muermos', 'Fresia', 'Llanquihue', 'Frutillar', 'Castro', 'Ancud', 'Quemchi', 'Dalcahue', 'Curaco de Velez', 'Quinchao', 'Puqueldon', 'Chonchi', 'Queilen', 'Quellon', 'Chaiten', 'Hualaihue', 'Futaleufu', 'Palena'],
    'Aysen': ['Coyhaique', 'Lago Verde', 'Aysen', 'Cisnes', 'Guaitecas', 'Chile Chico', 'Rio Ibanez', 'Cochrane', "O'Higgins", 'Tortel'],
    'Magallanes y Antartica Chilena': ['Natales', 'Torres del Paine', 'Punta Arenas', 'Rio Verde', 'Laguna Blanca', 'San Gregorio', 'Porvenir', 'Primavera', 'Timaukel', 'Cabo de Hornos', 'Antartica'],
    'Metropolitana de Santiago': ['Santiago', 'Independencia', 'Conchali', 'Huechuraba', 'Recoleta', 'Providencia', 'Vitacura', 'Lo Barnechea', 'Las Condes', 'Nunoa', 'La Reina', 'Macul', 'Penalolen', 'La Florida', 'San Joaquin', 'La Granja', 'La Pintana', 'San Ramon', 'San Miguel', 'La Cisterna', 'El Bosque', 'Pedro Aguirre Cerda', 'Lo Espejo', 'Estacion Central', 'Cerrillos', 'Maipu', 'Quinta Normal', 'Lo Prado', 'Pudahuel', 'Cerro Navia', 'Renca', 'Quilicura', 'Colina', 'Lampa', 'Tiltil', 'Puente Alto', 'San Jose de Maipo', 'Pirque', 'San Bernardo', 'Buin', 'Paine', 'Calera de Tango', 'Melipilla', 'Maria Pinto', 'Curacavi', 'Alhue', 'San Pedro', 'Talagante', 'Penaflor', 'Isla de Maipo', 'El Monte', 'Padre Hurtado']
  };
  function defaultProductDescription(title) {
    const safeTitle = String(title || '').trim() || 'este producto';
    return 'Descripcion general de ' + safeTitle + '. Puedes editar este texto desde el panel CMS.';
  }

  function normalizeSocialLinks(rawLinks) {
    function sanitizeHref(value) {
      const href = String(value || '').trim();
      if (!href) return '#';
      return SAFE_HREF_RE.test(href) ? href : '#';
    }

    const raw = Array.isArray(rawLinks) ? rawLinks : [];
    const byKey = new Map();
    raw.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const key = String(item.key || '').trim();
      if (!key) return;
      byKey.set(key, item);
    });

    const merged = DEFAULT_SOCIAL_CMS.links.map((fallback) => {
      const item = byKey.get(fallback.key) || {};
      return {
        key: String(item.key || fallback.key || ''),
        label: String(item.label || fallback.label || '').trim(),
        iconClass: String(item.iconClass || fallback.iconClass || '').trim(),
        href: sanitizeHref(item.href || fallback.href || '#'),
        enabled: Boolean(typeof item.enabled === 'undefined' ? fallback.enabled : item.enabled)
      };
    });

    raw.forEach((item) => {
      const key = String(item && item.key || '').trim();
      if (!key || DEFAULT_SOCIAL_CMS.links.some((fallback) => fallback.key === key)) return;
      merged.push({
        key: key,
        label: String(item.label || key).trim(),
        iconClass: String(item.iconClass || '').trim(),
        href: sanitizeHref(item.href || '#'),
        enabled: Boolean(item.enabled)
      });
    });

    return merged.filter((item) => item.iconClass);
  }

  function normalizeVisibility(raw) {
    if (!raw || typeof raw !== 'object') return DEFAULT_VISIBILITY_CMS;
    return Object.keys(DEFAULT_VISIBILITY_CMS).reduce((acc, key) => {
      acc[key] = typeof raw[key] === 'undefined' ? DEFAULT_VISIBILITY_CMS[key] : Boolean(raw[key]);
      return acc;
    }, {});
  }

  function normalizeQuoteRegions(rawRegions, fallbackRegions) {
    const allowed = new Set(Object.keys(CHILE_REGIONS_COMUNAS));
    if (!Array.isArray(rawRegions)) {
      return Array.isArray(fallbackRegions) ? fallbackRegions.slice() : [];
    }
    const selected = rawRegions
      .map(region => String(region || '').trim())
      .filter(region => region && allowed.has(region));
    const unique = Array.from(new Set(selected));
    return Object.keys(CHILE_REGIONS_COMUNAS).filter(region => unique.includes(region));
  }

  /* ── Preloader ─────────────────────────────────────────── */
  function initPreloader() {
    const el = document.querySelector('.preloader');
    if (!el) return;
    function hide() {
      el.classList.add('hidden');
      setTimeout(() => (el.style.display = 'none'), 600);
    }
    if (document.readyState === 'complete') { hide(); }
    else {
      window.addEventListener('load', hide);
      setTimeout(hide, 4000);
    }
  }

  /* ── Logo text injection ───────────────────────────────── */
  function initLogo() {
    document.querySelectorAll('.brand-name').forEach(link => {
      if (link.querySelector('img')) return;

      link.classList.add('brand-name--header');

      const picture = document.createElement('picture');
      const mobileSource = document.createElement('source');
      mobileSource.media = '(max-width: 991px)';
      mobileSource.srcset = 'images/logo_web_hor.png';
      mobileSource.dataset.defaultSrc = 'images/logo_web_hor.png';
      mobileSource.dataset.stuckSrc = 'images/logo_web_hor2.png';

      const image = document.createElement('img');
      image.src = 'images/logo_web_hor.png';
      image.dataset.defaultSrc = 'images/logo_web_hor.png';
      image.dataset.stuckSrc = 'images/logo_web_hor2.png';
      image.alt = 'Pansu';
      image.width = 198;
      image.height = 56;

      picture.appendChild(mobileSource);
      picture.appendChild(image);
      link.appendChild(picture);
    });
  }

  /* ── CMS header (lectura) ──────────────────────────────── */
  function getHeaderCMSData() {
    function normalize(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const slides = Array.isArray(raw.slides)
        ? raw.slides.map(x => String(x || '').trim()).filter(Boolean).slice(0, 3)
        : [];

      return {
        heroPrimary: String(raw.heroPrimary || '').trim() || DEFAULT_HEADER_CMS.heroPrimary,
        heroSecondary: String(raw.heroSecondary || '').trim() || DEFAULT_HEADER_CMS.heroSecondary,
        heroDescription: String(raw.heroDescription || '').trim() || DEFAULT_HEADER_CMS.heroDescription,
        heroButtonText: String(raw.heroButtonText || '').trim() || DEFAULT_HEADER_CMS.heroButtonText,
        heroButtonLink: String(raw.heroButtonLink || '').trim() || DEFAULT_HEADER_CMS.heroButtonLink,
        slides: slides.length === 3 ? slides : DEFAULT_HEADER_CMS.slides
      };
    }

    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(HEADER_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    return normalize(parsed) || DEFAULT_HEADER_CMS;
  }

  function initHeaderCMS() {
    const data = getHeaderCMSData();
    const primary = document.querySelector('[data-header-hero-primary]');
    const secondary = document.querySelector('[data-header-hero-secondary]');
    const desc = document.querySelector('[data-header-hero-description]');
    const button = document.querySelector('[data-header-hero-button]');

    if (primary) primary.textContent = data.heroPrimary;
    if (secondary) secondary.textContent = data.heroSecondary;
    if (desc) desc.textContent = data.heroDescription;
    if (button) {
      button.textContent = data.heroButtonText;
      button.setAttribute('href', data.heroButtonLink);
    }

    document.querySelectorAll('[data-header-slide]').forEach((slideEl) => {
      const idx = Number(slideEl.getAttribute('data-header-slide'));
      if (!Number.isFinite(idx) || idx < 0 || idx > 2) return;
      const image = data.slides[idx];
      if (!image) return;
      slideEl.setAttribute('data-slide-bg', image);
      slideEl.style.backgroundImage = `url('${image}')`;
    });
  }

  function getVisibilityCMSData() {
    function normalize(raw) {
      if (!raw || typeof raw !== 'object') return null;
      return normalizeVisibility(raw);
    }

    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(VISIBILITY_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    return normalize(parsed) || DEFAULT_VISIBILITY_CMS;
  }

  function initSectionVisibility() {
    const data = getVisibilityCMSData();
    const sectionMap = {
      header: ['[data-cms-section="header"]'],
      why: ['[data-cms-section="why"]'],
      kpis: ['[data-cms-section="kpis"]'],
      savings: ['[data-cms-section="savings"]'],
      products: ['[data-cms-section="products"]'],
      about: ['[data-cms-section="about"]'],
      contact: ['[data-cms-section="contact"]'],
      faq: ['[data-cms-section="faq"]', '[data-cms-section="faq-divider"]'],
      quote: ['[data-cms-section="quote"]', '#quoteMobileModal', '[data-quote-form]', '[data-quote-cta]'],
      social: ['[data-social-links]']
    };

    Object.keys(sectionMap).forEach((key) => {
      const visible = data[key] !== false;
      sectionMap[key].forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          el.hidden = !visible;
          el.setAttribute('aria-hidden', visible ? 'false' : 'true');
        });
      });
    });

    const quoteCard = document.querySelector('[data-cms-section="quote-card"]');
    if (quoteCard) {
      const visible = data.quote !== false;
      quoteCard.hidden = !visible;
      quoteCard.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    const visibleNav = {
      about: data.about !== false,
      products: data.products !== false,
      faq: data.faq !== false,
      contacts: data.contact !== false
    };
    document.querySelectorAll('[data-cms-nav-section]').forEach((item) => {
      const key = item.getAttribute('data-cms-nav-section');
      if (!Object.prototype.hasOwnProperty.call(visibleNav, key)) return;
      item.hidden = !visibleNav[key];
      item.setAttribute('aria-hidden', visibleNav[key] ? 'false' : 'true');
    });

    const quoteRows = document.querySelectorAll('[data-cms-section="header"] .row, [data-cms-section="contact"] .contact-right-stack');
    quoteRows.forEach((row) => {
      if (data.quote === false) {
        row.classList.add('cms-quote-hidden');
      } else {
        row.classList.remove('cms-quote-hidden');
      }
    });
  }

  /* ── Hero Slider ───────────────────────────────────────── */
  function initSlider() {
    const slider  = document.querySelector('.swiper-slider');
    if (!slider) return;
    const slides  = slider.querySelectorAll('.swiper-slide');
    const pagEl   = slider.querySelector('.swiper-pagination');
    if (!slides.length) return;

    let current = 0;
    let timer   = null;
    const delay = parseInt(slider.getAttribute('data-autoplay') || '4000', 10);

    // Set backgrounds from data attributes
    slides.forEach(slide => {
      const bg = slide.getAttribute('data-slide-bg');
      if (bg) slide.style.backgroundImage = `url('${bg}')`;
    });

    // Build pagination bullets
    if (pagEl) {
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.className = 'swiper-pagination-bullet';
        b.setAttribute('aria-label', `Diapositiva ${i + 1}`);
        b.addEventListener('click', () => goTo(i));
        pagEl.appendChild(b);
      });
    }

    function getBullets() {
      return pagEl ? pagEl.querySelectorAll('.swiper-pagination-bullet') : [];
    }
    function goTo(idx) {
      slides[current].classList.remove('active');
      const bullets = getBullets();
      bullets[current]?.classList.remove('active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('active');
      bullets[current]?.classList.add('active');
    }
    function startAuto() { clearInterval(timer); timer = setInterval(() => goTo(current + 1), delay); }

    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', startAuto);

    goTo(0);
    startAuto();
  }

  /* ── Navbar ────────────────────────────────────────────── */
  function initNavbar() {
    const wrap    = document.querySelector('.rd-navbar-wrap');
    const toggle  = document.querySelector('.rd-navbar-toggle');
    const navWrap = document.querySelector('.rd-navbar-nav-wrap');
    if (!wrap) return;

    function onScroll() {
      const isStuck = window.scrollY > 60;
      wrap.classList.toggle('stuck', isStuck);
      wrap.querySelectorAll('.brand-name--header source, .brand-name--header img').forEach((logoEl) => {
        const nextSrc = isStuck ? logoEl.dataset.stuckSrc : logoEl.dataset.defaultSrc;
        if (!nextSrc) return;
        if (logoEl.tagName === 'SOURCE') logoEl.srcset = nextSrc;
        else logoEl.src = nextSrc;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && navWrap) {
      toggle.addEventListener('click', () => navWrap.classList.toggle('open'));
      // Close on link click
      navWrap.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => navWrap.classList.remove('open'))
      );
    }

    // Active nav highlight
    const sections = Array.from(document.querySelectorAll('[id]')).filter((sec) => !sec.hidden && sec.offsetParent !== null);
    const links    = Array.from(document.querySelectorAll('.rd-navbar-nav a[href^="#"]')).filter((link) => !link.closest('li')?.hidden);
    function updateActive() {
      let active = '';
      sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 120) active = sec.id;
      });
      links.forEach(a => {
        a.closest('li')?.classList.toggle('active', a.getAttribute('href') === `#${active}`);
      });
    }
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  function initAnchorScroll() {
    const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
    if (!anchorLinks.length) return;

    function getOffset() {
      const wrap = document.querySelector('.rd-navbar-wrap');
      return wrap ? wrap.offsetHeight : 0;
    }

    anchorLinks.forEach((link) => {
      link.addEventListener('click', function (e) {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const top = href === '#home'
          ? 0
          : Math.max(0, window.scrollY + target.getBoundingClientRect().top - getOffset());

        window.history.replaceState(null, '', href);
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* ── Form floating labels ──────────────────────────────── */
  function initFormLabels() {
    document.querySelectorAll('.form-wrap').forEach(wrap => {
      const input = wrap.querySelector('.form-input');
      const label = wrap.querySelector('.form-label');
      if (!input) return;

      if (input.tagName === 'SELECT') wrap.classList.add('is-select');
      if (!label) return;

      function check() {
        if (input.tagName === 'SELECT') {
          const first = input.options[0]?.value || '';
          wrap.classList.toggle('has-value', input.value !== '' && input.value !== first);
        } else {
          wrap.classList.toggle('has-value', input.value.trim() !== '');
        }
      }
      input.addEventListener('change', check);
      input.addEventListener('input',  check);
      input.addEventListener('focus',  () => wrap.classList.add('focused'));
      input.addEventListener('blur',   () => { wrap.classList.remove('focused'); check(); });
      check();
    });
  }

  /* ── Parallax backgrounds ──────────────────────────────── */
  function initParallax() {
    const containers = document.querySelectorAll('.parallax-container[data-parallax-img]');
    containers.forEach(el => {
      const img = el.getAttribute('data-parallax-img');
      if (img) el.style.backgroundImage = `url('${img}')`;
    });

    function onScroll() {
      containers.forEach(el => {
        const rect  = el.getBoundingClientRect();
        const speed = 0.3;
        const offset = rect.top * speed;
        el.style.backgroundPositionY = `calc(50% + ${offset}px)`;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── News Carousel (center-mode) ───────────────────────── */
  function initCarousel() {
    const wrapper = document.querySelector('.slick-slider');
    if (!wrapper) return;
    const items = Array.from(wrapper.querySelectorAll('.item'));
    if (!items.length) return;

    // Build track
    const track = document.createElement('div');
    track.className = 'slick-track';
    items.forEach(item => track.appendChild(item));
    wrapper.appendChild(track);

    // Arrows
    const prev = document.createElement('button');
    prev.className = 'slick-arrow slick-prev';
    prev.innerHTML = '&#8249;';
    prev.setAttribute('aria-label', 'Anterior');

    const next = document.createElement('button');
    next.className = 'slick-arrow slick-next';
    next.innerHTML = '&#8250;';
    next.setAttribute('aria-label', 'Siguiente');

    wrapper.appendChild(prev);
    wrapper.appendChild(next);

    let center = Math.floor(items.length / 2);

    function getItemWidth() {
      return items[0]?.offsetWidth || 360;
    }

    function render() {
      const wrapW    = wrapper.offsetWidth;
      const itemW    = getItemWidth();
      const gapW     = 24;

      items.forEach((item, i) => {
        item.classList.toggle('center', i === center);
      });

      // Position: center item at wrapper center, others offset
      const baseX = (wrapW - itemW) / 2;
      items.forEach((item, i) => {
        const offset = (i - center) * (itemW + gapW);
        item.style.position = 'absolute';
        item.style.left = (baseX + offset) + 'px';
      });

      // Track needs relative positioning
      track.style.position = 'relative';
      track.style.height = (items[0]?.offsetHeight || 300) + 40 + 'px';
    }

    function goTo(idx) {
      center = ((idx % items.length) + items.length) % items.length;
      render();
    }

    prev.addEventListener('click', () => goTo(center - 1));
    next.addEventListener('click', () => goTo(center + 1));

    // Touch/drag support
    let startX = 0;
    wrapper.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    wrapper.addEventListener('touchend',   e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(center + (diff > 0 ? 1 : -1));
    });

    // Autoplay
    let autoTimer = setInterval(() => goTo(center + 1), 5000);
    wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
    wrapper.addEventListener('mouseleave', () => { autoTimer = setInterval(() => goTo(center + 1), 5000); });

    render();
    window.addEventListener('resize', render);
  }

  /* ── Back to top ───────────────────────────────────────── */
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
    btn.setAttribute('aria-label', 'Volver arriba');
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Calculadora de ahorro hogar ───────────────────────── */
  function getSavingsCMSData() {
    function toPositiveInt(value, fallback) {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
    }
    function normalize(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const defaultKwh = toPositiveInt(raw.defaultKwh, DEFAULT_SAVINGS_CMS.defaultKwh);
      const defaultBill = toPositiveInt(raw.defaultBill, DEFAULT_SAVINGS_CMS.defaultBill);
      const coverageMin = toPositiveInt(raw.coverageMin, DEFAULT_SAVINGS_CMS.coverageMin);
      const coverageMax = toPositiveInt(raw.coverageMax, DEFAULT_SAVINGS_CMS.coverageMax);
      const coverageStep = toPositiveInt(raw.coverageStep, DEFAULT_SAVINGS_CMS.coverageStep);
      let coverageDefault = toPositiveInt(raw.coverageDefault, DEFAULT_SAVINGS_CMS.coverageDefault);

      if (coverageMin >= coverageMax) return null;
      if (coverageStep > (coverageMax - coverageMin)) return null;
      if (coverageDefault < coverageMin) coverageDefault = coverageMin;
      if (coverageDefault > coverageMax) coverageDefault = coverageMax;

      return {
        defaultKwh,
        defaultBill,
        coverageMin,
        coverageMax,
        coverageStep,
        coverageDefault
      };
    }

    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(SAVINGS_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    return normalize(parsed) || DEFAULT_SAVINGS_CMS;
  }

  function initSavingsCalculator() {
    const widget = document.querySelector('#savings-widget');
    if (!widget) return;
    const savingsData = getSavingsCMSData();

    const kwhInput      = widget.querySelector('#home-kwh');
    const billInput     = widget.querySelector('#home-bill');
    const coverageInput = widget.querySelector('#solar-coverage');
    const coverageValue = widget.querySelector('#coverage-value');

    const resultMonthly   = widget.querySelector('#result-monthly');
    const resultYearly    = widget.querySelector('#result-yearly');
    const resultCovered   = widget.querySelector('#result-covered-kwh');

    if (!kwhInput || !billInput || !coverageInput) return;

    kwhInput.value = String(savingsData.defaultKwh);
    billInput.value = String(savingsData.defaultBill);
    coverageInput.min = String(savingsData.coverageMin);
    coverageInput.max = String(savingsData.coverageMax);
    coverageInput.step = String(savingsData.coverageStep);
    coverageInput.value = String(savingsData.coverageDefault);

    const moneyFormatter = new Intl.NumberFormat('es-CL');
    const numFormatter   = new Intl.NumberFormat('es-CL');

    function parsePositive(value) {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : 0;
    }

    function update() {
      const kwh = parsePositive(kwhInput.value);
      const bill = parsePositive(billInput.value);
      const coverage = parsePositive(coverageInput.value);

      if (coverageValue) coverageValue.textContent = `${coverage}%`;

      const factor = coverage / 100;
      const coveredKwh = kwh * factor;
      const monthlySavings = bill * factor;
      const yearlySavings = monthlySavings * 12;

      if (resultMonthly) resultMonthly.textContent = `$${moneyFormatter.format(Math.round(monthlySavings))}`;
      if (resultYearly) resultYearly.textContent = `$${moneyFormatter.format(Math.round(yearlySavings))}`;
      if (resultCovered) resultCovered.textContent = `${numFormatter.format(Math.round(coveredKwh))} kWh`;
    }

    ['input', 'change'].forEach(evt => {
      kwhInput.addEventListener(evt, update);
      billInput.addEventListener(evt, update);
      coverageInput.addEventListener(evt, update);
    });

    update();
  }

  /* ── CMS productos (lectura) ───────────────────────────── */
  function getProductsCMSData() {
    function sanitizeProduct(item, idx) {
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const image = typeof item.image === 'string' ? item.image.trim() : '';
      const description = typeof item.description === 'string' ? item.description.trim() : '';
      const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : 'p' + (idx + 1);
      if (!title || !image) return null;
      return { id, title, image, description: description || defaultProductDescription(title) };
    }

    function normalizeData(raw) {
      if (!raw || typeof raw !== 'object') return null;
      if (!Array.isArray(raw.products) || raw.products.length < 3) return null;

      const products = raw.products.map(sanitizeProduct).filter(Boolean);
      if (products.length < 3) return null;

      const ids = new Set(products.map(p => p.id));
      const featured = Array.isArray(raw.featuredIds) ? raw.featuredIds.filter(id => ids.has(id)) : [];
      const uniqueFeatured = Array.from(new Set(featured)).slice(0, 3);
      while (uniqueFeatured.length < 3) {
        const next = products[uniqueFeatured.length];
        if (!next) break;
        if (!uniqueFeatured.includes(next.id)) uniqueFeatured.push(next.id);
      }
      if (uniqueFeatured.length < 3) return null;

      return { products, featuredIds: uniqueFeatured };
    }

    function migrateLegacy() {
      let legacy = null;
      try {
        legacy = JSON.parse(localStorage.getItem(LEGACY_PRODUCTS_CMS_KEY) || 'null');
      } catch (err) {
        legacy = null;
      }
      if (!Array.isArray(legacy) || legacy.length < 3) return null;
      const products = legacy.slice(0, 3).map((item, idx) => sanitizeProduct({ id: 'p' + (idx + 1), title: item.title, image: item.image }, idx)).filter(Boolean);
      if (products.length < 3) return null;
      return { products: DEFAULT_PRODUCTS_CMS.products.map((p, i) => products[i] || p), featuredIds: ['p1', 'p2', 'p3'] };
    }

    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(PRODUCTS_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }

    let data = normalizeData(parsed);
    if (!data) data = normalizeData(migrateLegacy());
    if (!data) data = DEFAULT_PRODUCTS_CMS;
    return data;
  }

  function productCardHtml(item, colClass) {
    const safeTitle = String(item.title)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const safeImage = String(item.image)
      .replace(/"/g, '&quot;');
    const safeId = encodeURIComponent(String(item.id || ''));
    return (
      '<div class="' + colClass + '">' +
        '<div class="thumbnail-img">' +
          '<img class="img-responsive img-fullwidth" src="' + safeImage + '" alt="' + safeTitle + '" width="370" height="300">' +
          '<div class="caption"><h6 class="text-transform-none"><a class="text-dark" href="producto.html?id=' + safeId + '">' + safeTitle + '</a></h6></div>' +
        '</div>' +
      '</div>'
    );
  }

  function initProductsCMS() {
    const data = getProductsCMSData();

    const featuredGrid = document.querySelector('#featured-products-grid');
    if (featuredGrid) {
      const featured = data.featuredIds.map(id => data.products.find(p => p.id === id)).filter(Boolean).slice(0, 3);
      if (featured.length === 3) {
        featuredGrid.innerHTML = featured.map(item => productCardHtml(item, 'col-md-6 col-lg-4')).join('');
      }
    }

    const allGrid = document.querySelector('#all-products-grid');
    if (allGrid) {
      allGrid.innerHTML = data.products.map(item => productCardHtml(item, 'col-md-6 col-lg-4')).join('');
    }
  }

  function initProductDetailPage() {
    const container = document.querySelector('[data-product-detail]');
    if (!container) return;

    const data = getProductsCMSData();
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const product = data.products.find(p => p.id === productId) || data.products[0];

    const titleEl = document.querySelector('[data-product-title]');
    const imageEl = document.querySelector('[data-product-image]');
    const descEl = document.querySelector('[data-product-description]');

    if (titleEl) titleEl.textContent = product.title;
    if (imageEl) {
      imageEl.src = product.image;
      imageEl.alt = product.title;
    }
    if (descEl) descEl.textContent = product.description || defaultProductDescription(product.title);
  }

  /* ── CMS contacto (lectura) ────────────────────────────── */
  function getContactCMSData() {
    function sanitizeOffice(raw) {
      raw = raw || {};
      return {
        name: String(raw.name || '').trim(),
        address1: String(raw.address1 || '').trim(),
        address2: String(raw.address2 || '').trim(),
        phone: String(raw.phone || '').trim(),
        fax: String(raw.fax || '').trim()
      };
    }
    function normalize(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const officesRaw = Array.isArray(raw.offices)
        ? raw.offices
        : [raw.office1, raw.office2].filter(Boolean);
      const offices = officesRaw.map(sanitizeOffice);
      return {
        contactTitle: String(raw.contactTitle || '').trim() || DEFAULT_CONTACT_CMS.contactTitle,
        navPhone: String(raw.navPhone || '').trim() || DEFAULT_CONTACT_CMS.navPhone,
        formTitle: String(raw.formTitle || '').trim() || DEFAULT_CONTACT_CMS.formTitle,
        offices: offices.length ? offices : DEFAULT_CONTACT_CMS.offices
      };
    }

    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(CONTACT_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    return normalize(parsed) || DEFAULT_CONTACT_CMS;
  }

  function toTel(value) {
    const digits = String(value || '').replace(/[^\d+]/g, '');
    return digits || '#';
  }

  function initContactCMS() {
    const data = getContactCMSData();

    function setText(selector, value) {
      const el = document.querySelector(selector);
      if (el) el.textContent = value;
    }
    setText('[data-contact-title]', data.contactTitle);
    setText('[data-contact-form-title]', data.formTitle);
    const navPhoneLink = document.querySelector('[data-contact-nav-phone-link]');
    const navPhoneText = document.querySelector('[data-contact-nav-phone-text]');
    if (navPhoneLink) navPhoneLink.setAttribute('href', 'tel:' + toTel(data.navPhone));
    if (navPhoneText) navPhoneText.textContent = data.navPhone;

    const offices = Array.isArray(data.offices) ? data.offices : [];
    const mainOffice = offices[0] || {};
    const name = String(mainOffice.name || '').trim();
    const address1 = String(mainOffice.address1 || '').trim();
    const address2 = String(mainOffice.address2 || '').trim();
    const phone = String(mainOffice.phone || '').trim();
    const fax = String(mainOffice.fax || '').trim();

    setText('[data-contact-main-office-name]', name || 'Oficina principal');
    setText('[data-contact-main-office-address1]', address1);
    setText('[data-contact-main-office-address2]', address2);

    const phoneLink = document.querySelector('[data-contact-main-office-phone-link]');
    const phoneText = document.querySelector('[data-contact-main-office-phone-text]');
    if (phoneLink) phoneLink.setAttribute('href', phone ? ('tel:' + toTel(phone)) : '#');
    if (phoneText) phoneText.textContent = phone || '-';

    const faxLink = document.querySelector('[data-contact-main-office-fax-link]');
    const faxText = document.querySelector('[data-contact-main-office-fax-text]');
    if (faxLink) faxLink.setAttribute('href', fax ? ('tel:' + toTel(fax)) : '#');
    if (faxText) faxText.textContent = fax || '-';

    const mapFrame = document.querySelector('[data-contact-map-frame]');
    if (mapFrame) {
      const query = name || [address1, address2].filter(Boolean).join(', ');
      const mapQuery = encodeURIComponent(query || 'Chile');
      mapFrame.setAttribute('src', 'https://www.google.com/maps?q=' + mapQuery + '&output=embed');
    }
  }

  /* ── CMS quienes somos (lectura) ───────────────────────── */
  function getAboutCMSData() {
    function normalize(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const images = Array.isArray(raw.images) ? raw.images.map(x => String(x || '').trim()).filter(Boolean) : [];
      if (images.length < 3) return null;
      return {
        title: String(raw.title || '').trim() || DEFAULT_ABOUT_CMS.title,
        subtitle: String(raw.subtitle || '').trim() || DEFAULT_ABOUT_CMS.subtitle,
        description: String(raw.description || '').trim() || DEFAULT_ABOUT_CMS.description,
        images: images.slice(0, 3)
      };
    }
    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(ABOUT_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    return normalize(parsed) || DEFAULT_ABOUT_CMS;
  }

  function initAboutCMS() {
    const data = getAboutCMSData();
    const titleEl = document.querySelector('[data-about-title]');
    const subtitleEl = document.querySelector('[data-about-subtitle]');
    const descEl = document.querySelector('[data-about-description]');
    if (titleEl) titleEl.textContent = data.title;
    if (subtitleEl) subtitleEl.textContent = data.subtitle;
    if (descEl) descEl.textContent = data.description;
    document.querySelectorAll('[data-about-image]').forEach((img, idx) => {
      if (data.images[idx]) img.src = data.images[idx];
    });
  }

  /* ── CMS solicitud de cotizacion (lectura y forms) ─────── */
  function getQuoteCMSData() {
    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(QUOTE_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    if (!parsed || typeof parsed !== 'object') return DEFAULT_QUOTE_CMS;
    const email = String(parsed.destinationEmail || '').trim();
    return {
      destinationEmail: EMAIL_RE.test(email) ? email : DEFAULT_QUOTE_CMS.destinationEmail,
      enabledRegions: normalizeQuoteRegions(parsed.enabledRegions, DEFAULT_QUOTE_CMS.enabledRegions)
    };
  }

  async function fetchQuoteCMSData() {
    try {
      const response = await fetch('/api/content', { credentials: 'same-origin' });
      if (!response.ok) return null;
      const data = await response.json();
      const email = String(data && data.content && data.content.quote && data.content.quote.destinationEmail || '').trim();
      if (!EMAIL_RE.test(email)) return null;
      return {
        destinationEmail: email,
        enabledRegions: normalizeQuoteRegions(
          data && data.content && data.content.quote && data.content.quote.enabledRegions,
          DEFAULT_QUOTE_CMS.enabledRegions
        )
      };
    } catch (err) {
      return null;
    }
  }

  function initQuoteFormsCMS() {
    ensureQuoteModal();
    const forms = Array.from(document.querySelectorAll('[data-quote-form]'));
    if (!forms.length) return;
    let quoteData = getQuoteCMSData();

    function applyDestination(email) {
      forms.forEach((form) => {
        const destination = form.querySelector('[data-quote-destination]');
        if (destination) destination.value = email;
      });
    }

    function fillRegions(regionSelect) {
      const regions = Array.isArray(quoteData.enabledRegions) ? quoteData.enabledRegions : Object.keys(CHILE_REGIONS_COMUNAS);
      regionSelect.innerHTML = '<option value="">Region de Chile</option>' +
        regions.map(region => '<option value="' + region + '">' + region + '</option>').join('');
    }

    function fillComunas(comunaSelect, region) {
      const comunas = CHILE_REGIONS_COMUNAS[region] || [];
      comunaSelect.innerHTML = '<option value="">Comuna</option>' +
        comunas.map(comuna => '<option value="' + comuna + '">' + comuna + '</option>').join('');
    }

    function toMailBody(data) {
      return [
        'Nueva solicitud de cotizacion',
        '',
        'Nombre y Apellidos: ' + data.full_name,
        'Region: ' + data.region,
        'Comuna: ' + data.comuna,
        'Correo de contacto: ' + data.contact_email,
        'Numero de telefono: ' + data.contact_phone,
        'Tipo de solicitud: ' + data.quote_type
      ].join('\n');
    }

    forms.forEach(form => {
      const regionSelect = form.querySelector('[data-quote-region]');
      const comunaSelect = form.querySelector('[data-quote-comuna]');
      applyDestination(quoteData.destinationEmail);

      if (regionSelect && comunaSelect) {
        fillRegions(regionSelect);
        fillComunas(comunaSelect, '');
        regionSelect.addEventListener('change', function () {
          fillComunas(comunaSelect, regionSelect.value);
          const comunaWrap = comunaSelect.closest('.form-wrap');
          if (comunaWrap) comunaWrap.classList.remove('has-value');
        });
      }

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const required = ['full_name', 'region', 'comuna', 'contact_email', 'contact_phone', 'quote_type'];
        const valid = required.every(key => String(data[key] || '').trim() !== '');
        if (!valid) {
          alert('Completa todos los campos para enviar la solicitud.');
          return;
        }
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'ENVIANDO...';
        }

        try {
          const payload = {
            _subject: 'Solicitud de cotizacion PANSU',
            _captcha: 'false',
            nombre_apellidos: data.full_name,
            region: data.region,
            comuna: data.comuna,
            correo_contacto: data.contact_email,
            telefono_contacto: data.contact_phone,
            tipo_solicitud: data.quote_type,
            detalle: toMailBody(data)
          };

          const response = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(quoteData.destinationEmail), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error('Solicitud no enviada');

          alert('Solicitud enviada correctamente. Te contactaremos pronto.');
          form.reset();
          const modalEl = form.closest('.modal');
          if (modalEl && window.bootstrap && typeof window.bootstrap.Modal === 'function') {
            const instance = window.bootstrap.Modal.getInstance(modalEl);
            if (instance) instance.hide();
          }
          const comunaSelect = form.querySelector('[data-quote-comuna]');
          if (comunaSelect) comunaSelect.innerHTML = '<option value="">Comuna</option>';
          const formWraps = form.querySelectorAll('.form-wrap');
          formWraps.forEach(wrap => wrap.classList.remove('has-value'));
        } catch (err) {
          alert('No se pudo enviar la solicitud en este momento. Intenta nuevamente.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText || 'SOLICITAR COTIZACION';
          }
        }
      });
    });

    fetchQuoteCMSData().then((serverQuote) => {
      if (!serverQuote || !serverQuote.destinationEmail) return;
      quoteData = serverQuote;
      forms.forEach((form) => {
        const regionSelect = form.querySelector('[data-quote-region]');
        const comunaSelect = form.querySelector('[data-quote-comuna]');
        if (regionSelect && comunaSelect) {
          fillRegions(regionSelect);
          if (!quoteData.enabledRegions.includes(regionSelect.value)) {
            regionSelect.value = '';
            fillComunas(comunaSelect, '');
          }
        }
      });
      applyDestination(quoteData.destinationEmail);
    }).catch(function () {});
  }

  function ensureQuoteModal() {
    let modalEl = document.querySelector('#quoteMobileModal');
    if (modalEl) return modalEl;

    const shell = document.createElement('div');
    shell.innerHTML = '' +
      '<div class="modal fade" id="quoteMobileModal" tabindex="-1" aria-labelledby="quoteMobileModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered quote-modal-dialog">' +
          '<div class="modal-content quote-modal-content">' +
            '<button type="button" class="btn-close quote-modal-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>' +
            '<div class="bg-default section-form-slider quote-modal-card">' +
              '<h5 id="quoteMobileModalLabel">Solicita una cotizacion para una instalacion de paneles solares residencial o comercial</h5>' +
              '<form class="rd-mailform text-center offset-top-30 quote-modal-form" data-quote-form data-form-output="form-output-global" data-form-type="contact" method="post" action="#">' +
                '<input type="hidden" name="destination_email" data-quote-destination value="">' +
                '<div class="form-wrap">' +
                  '<label class="form-label" for="contact-name-mobile">Nombre y Apellidos</label>' +
                  '<input class="form-input" id="contact-name-mobile" type="text" name="full_name" placeholder="Nombre y Apellidos" data-constraints="@Required">' +
                '</div>' +
                '<div class="form-wrap">' +
                  '<select class="form-input select-filter" id="contact-region-mobile" name="region" data-quote-region data-placeholder="Región" data-minimum-results-search="Infinity" data-constraints="@Required">' +
                    '<option value="">Region de Chile</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-wrap">' +
                  '<select class="form-input select-filter" id="contact-comuna-mobile" name="comuna" data-quote-comuna data-placeholder="Comuna" data-minimum-results-search="Infinity" data-constraints="@Required">' +
                    '<option value="">Comuna</option>' +
                  '</select>' +
                '</div>' +
                '<div class="form-wrap">' +
                  '<label class="form-label" for="contact-email-mobile">Correo de contacto</label>' +
                  '<input class="form-input" id="contact-email-mobile" type="email" name="contact_email" placeholder="nombre@correo.cl" data-constraints="@Email @Required">' +
                '</div>' +
                '<div class="form-wrap">' +
                  '<label class="form-label" for="contact-phone-mobile">Numero de telefono</label>' +
                  '<input class="form-input" id="contact-phone-mobile" type="text" name="contact_phone" placeholder="+56 9 XXXX XXXX" data-constraints="@Numeric @Required">' +
                '</div>' +
                '<div class="form-wrap">' +
                  '<select class="form-input select-filter" name="quote_type" data-placeholder="Tipo de solicitud" data-minimum-results-search="Infinity" data-constraints="@Required">' +
                    '<option value="">Tipo de solicitud</option>' +
                    '<option value="Residencia">Residencia</option>' +
                    '<option value="Comercial">Comercial</option>' +
                  '</select>' +
                '</div>' +
                '<button class="btn btn-primary offset-top-30" type="submit">SOLICITAR COTIZACION</button>' +
              '</form>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(shell.firstElementChild);
    modalEl = document.querySelector('#quoteMobileModal');
    return modalEl;
  }

  function initQuoteModalTriggers() {
    const modalEl = ensureQuoteModal();
    const triggers = Array.from(document.querySelectorAll('[data-quote-cta], [data-quote-modal-trigger]'));
    if (!triggers.length || !modalEl) return;

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.bootstrap && typeof window.bootstrap.Modal === 'function') {
          const instance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
          instance.show();
        }
      });
    });
  }

  function getSocialCMSData() {
    function normalize(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const links = normalizeSocialLinks(raw.links).slice(0, 12);
      if (!links.length) return null;
      return { links };
    }

    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(SOCIAL_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    return normalize(parsed) || DEFAULT_SOCIAL_CMS;
  }

  function initSocialCMS() {
    const data = getSocialCMSData();
    document.querySelectorAll('[data-social-links]').forEach((list) => {
      const visible = data.links.filter(item => item.enabled);
      if (!visible.length) {
        list.innerHTML = '';
        return;
      }
      list.innerHTML = visible.map((item) => {
        const href = String(item.href || '#').replace(/"/g, '&quot;');
        const iconClass = String(item.iconClass || '').replace(/"/g, '&quot;');
        const label = String(item.label || 'Red social').replace(/"/g, '&quot;');
        return '<li><a class="icon icon-circle icon-dark icon-xs" href="' + href + '" aria-label="' + label + '" target="_blank" rel="noopener noreferrer"><i class="' + iconClass + '"></i></a></li>';
      }).join('');
    });
  }

  function getFaqCMSData() {
    function normalize(raw) {
      if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return null;
      const items = raw.items
        .map((item) => ({
          question: String((item && item.question) || '').trim(),
          answer: String((item && item.answer) || '').trim()
        }))
        .filter(item => item.question && item.answer);
      if (!items.length) return null;
      return { items: items.slice(0, 20) };
    }
    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(FAQ_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    return normalize(parsed) || DEFAULT_FAQ_CMS;
  }

  function initFaqCMS() {
    const wrap = document.querySelector('[data-faq-list]');
    if (!wrap) return;
    const data = getFaqCMSData();
    wrap.innerHTML = data.items.map((item, idx) => {
      const n = idx + 1;
      const open = idx === 0;
      const question = String(item.question)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      const answer = String(item.answer)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return '' +
        '<div class="accordion-item">' +
          '<h2 class="accordion-header" id="faq-heading-' + n + '">' +
            '<button class="accordion-button' + (open ? '' : ' collapsed') + '" type="button" data-bs-toggle="collapse" data-bs-target="#faq-collapse-' + n + '" aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="faq-collapse-' + n + '">' +
              question +
            '</button>' +
          '</h2>' +
          '<div class="accordion-collapse collapse' + (open ? ' show' : '') + '" id="faq-collapse-' + n + '" aria-labelledby="faq-heading-' + n + '" data-bs-parent="#faqAccordion">' +
            '<div class="accordion-body">' + answer + '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function getWhyCMSData() {
    function normalize(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const caption = String(raw.caption || '').trim() || DEFAULT_WHY_CMS.caption;
      if (!Array.isArray(raw.items) || raw.items.length < 3) return null;
      const items = raw.items.slice(0, 3).map((item, idx) => {
        const fallback = DEFAULT_WHY_CMS.items[idx];
        const iconClass = String((item && item.iconClass) || '').trim() || fallback.iconClass;
        const title = String((item && item.title) || '').trim() || fallback.title;
        const description = String((item && item.description) || '').trim() || fallback.description;
        return { iconClass, title, description };
      });
      return { caption, items };
    }
    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(WHY_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    return normalize(parsed) || DEFAULT_WHY_CMS;
  }

  function initWhyCMS() {
    const data = getWhyCMSData();
    const captionEl = document.querySelector('[data-why-caption]');
    if (captionEl) captionEl.textContent = data.caption;

    const list = document.querySelector('[data-why-list]');
    if (!list) return;
    list.innerHTML = data.items.map((item) => {
      const safeIcon = String(item.iconClass).replace(/"/g, '&quot;');
      const safeTitle = String(item.title)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      const safeDesc = String(item.description)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return '' +
        '<div class="col-md-6 col-lg-4">' +
          '<div class="unit unit-spacing-sm flex-column flex-sm-row why-pansur-feature">' +
            '<div class="unit-body">' +
              '<p class="why-pansur-icon"><i class="' + safeIcon + ' text-primary"></i></p>' +
              '<h6 class="text-white">' + safeTitle + '</h6>' +
              '<p class="font-size-12 offset-top-10 text-white">' + safeDesc + '</p>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function getKpisCMSData() {
    function normalize(raw) {
      if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return null;
      const items = raw.items
        .map((item, idx) => {
          const fallback = DEFAULT_KPIS_CMS.items[idx] || DEFAULT_KPIS_CMS.items[0];
          return {
            iconClass: String((item && item.iconClass) || '').trim() || fallback.iconClass,
            value: String((item && item.value) || '').trim() || fallback.value,
            label: String((item && item.label) || '').trim() || fallback.label
          };
        })
        .filter((item) => item.value && item.label)
        .slice(0, 4);
      if (!items.length) return null;
      return { items };
    }
    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(KPIS_CMS_KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    return normalize(parsed) || DEFAULT_KPIS_CMS;
  }

  function initKpisCMS() {
    const list = document.querySelector('[data-kpi-list]');
    if (!list) return;
    const data = getKpisCMSData();
    list.innerHTML = data.items.map((item) => {
      const safeIcon = String(item.iconClass || '').replace(/"/g, '&quot;');
      const safeValue = String(item.value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      const safeLabel = String(item.label || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return '' +
        '<div class="col-6 col-md-3">' +
          '<article class="kpi-card text-center">' +
            '<p class="kpi-icon"><i class="' + safeIcon + '"></i></p>' +
            '<p class="kpi-value">' + safeValue + '</p>' +
            '<p class="kpi-label">' + safeLabel + '</p>' +
          '</article>' +
        '</div>';
    }).join('');

    animateKpisOnView(list);
  }

  function parseKpiValueParts(rawText) {
    const text = String(rawText || '').trim();
    const match = text.match(/-?[\d.,]+/);
    if (!match) return null;
    const token = match[0];
    const idx = match.index || 0;
    const prefix = text.slice(0, idx);
    const suffix = text.slice(idx + token.length);

    const dotCount = (token.match(/\./g) || []).length;
    const commaCount = (token.match(/,/g) || []).length;

    let normalized = token;
    let decimals = 0;

    if (dotCount && commaCount) {
      const lastDot = token.lastIndexOf('.');
      const lastComma = token.lastIndexOf(',');
      const decimalSep = lastDot > lastComma ? '.' : ',';
      const thousandSep = decimalSep === '.' ? ',' : '.';
      normalized = token.split(thousandSep).join('');
      if (decimalSep === ',') normalized = normalized.replace(',', '.');
      decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0;
    } else if (commaCount) {
      if (/^\d{1,3}(,\d{3})+$/.test(token)) {
        normalized = token.replace(/,/g, '');
        decimals = 0;
      } else {
        normalized = token.replace(',', '.');
        decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0;
      }
    } else if (dotCount) {
      if (/^\d{1,3}(\.\d{3})+$/.test(token)) {
        normalized = token.replace(/\./g, '');
        decimals = 0;
      } else {
        decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0;
      }
    }

    const target = Number(normalized);
    if (!Number.isFinite(target)) return null;
    return { prefix, suffix, target, decimals };
  }

  function formatKpiNumber(value, decimals) {
    return Number(value).toLocaleString('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function animateKpiElement(el) {
    if (!el || el.dataset.kpiAnimated === '1') return;
    const parts = parseKpiValueParts(el.textContent);
    if (!parts) {
      el.dataset.kpiAnimated = '1';
      return;
    }

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      el.textContent = parts.prefix + formatKpiNumber(parts.target, parts.decimals) + parts.suffix;
      el.dataset.kpiAnimated = '1';
      return;
    }

    const start = performance.now();
    const duration = 1200;

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = parts.target * eased;
      el.textContent = parts.prefix + formatKpiNumber(current, parts.decimals) + parts.suffix;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = parts.prefix + formatKpiNumber(parts.target, parts.decimals) + parts.suffix;
        el.dataset.kpiAnimated = '1';
      }
    }

    requestAnimationFrame(frame);
  }

  function animateKpisOnView(scope) {
    const values = Array.from((scope || document).querySelectorAll('.kpi-value'));
    if (!values.length) return;

    if (!('IntersectionObserver' in window)) {
      values.forEach(animateKpiElement);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateKpiElement(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });

    values.forEach((el) => observer.observe(el));
  }

  /* ── Copyright year ────────────────────────────────────── */
  function initCopyright() {
    const el = document.querySelector('.copyright-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── Boot ──────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var syncPromise = window.PansurCMS && typeof window.PansurCMS.syncFromServer === 'function'
      ? window.PansurCMS.syncFromServer().catch(function () { return null; })
      : Promise.resolve(null);

    syncPromise.finally(function () {
      ensureQuoteModal();
      initSectionVisibility();
      initLogo();
      initHeaderCMS();
      initPreloader();
      initSlider();
      initNavbar();
      initAnchorScroll();
      initFormLabels();
      initParallax();
      initCarousel();
      initBackToTop();
      initSavingsCalculator();
      initProductsCMS();
      initProductDetailPage();
      initContactCMS();
      initAboutCMS();
      initQuoteFormsCMS();
      initQuoteModalTriggers();
      initFaqCMS();
      initWhyCMS();
      initKpisCMS();
      initSocialCMS();
      initCopyright();
    });
  });
})();
