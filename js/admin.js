(function () {
  'use strict';

  var KEY = 'pansur_products_cms_v2';
  var LEGACY_KEY = 'pansur_products_cms_v1';
  var TITLE_MAX = 80;
  var DESCRIPTION_MAX = 360;
  var IMAGE_URL_MAX = 500;
  var PRODUCT_IMAGE_MAX_BYTES = 900 * 1024; // 900 KB
  var DEFAULT_DATA = {
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

  var state = null;

  function byId(id) { return document.getElementById(id); }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function defaultDescription(title) {
    var safeTitle = String(title || '').trim() || 'este producto';
    return 'Descripcion general de ' + safeTitle + '. Puedes editar este texto desde el panel CMS.';
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (!Array.isArray(raw.products) || raw.products.length < 3) return null;

    var products = raw.products.map(function (item, idx) {
      var id = (item && typeof item.id === 'string' && item.id.trim()) ? item.id.trim() : 'p' + (idx + 1);
      var title = (item && typeof item.title === 'string') ? item.title.trim() : '';
      var image = (item && typeof item.image === 'string') ? item.image.trim() : '';
      var description = (item && typeof item.description === 'string') ? item.description.trim() : '';
      if (!title || !image) return null;
      return { id: id, title: title, image: image, description: description || defaultDescription(title) };
    }).filter(Boolean);

    if (products.length < 3) return null;

    var ids = products.map(function (p) { return p.id; });
    var featured = Array.isArray(raw.featuredIds) ? raw.featuredIds.filter(function (id) { return ids.indexOf(id) !== -1; }) : [];
    featured = Array.from(new Set(featured)).slice(0, 3);
    while (featured.length < 3) {
      var next = products[featured.length];
      if (!next) break;
      if (featured.indexOf(next.id) === -1) featured.push(next.id);
    }
    if (featured.length < 3) return null;

    return { products: products, featuredIds: featured };
  }

  function loadData() {
    var parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (err) {
      parsed = null;
    }
    var valid = normalize(parsed);
    if (valid) return valid;

    try {
      var legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
      if (Array.isArray(legacy) && legacy.length >= 3) {
        var migrated = clone(DEFAULT_DATA);
        for (var i = 0; i < 3; i += 1) {
          if (legacy[i] && legacy[i].title && legacy[i].image) {
            migrated.products[i].title = String(legacy[i].title);
            migrated.products[i].image = String(legacy[i].image);
            migrated.products[i].description = defaultDescription(migrated.products[i].title);
          }
        }
        return migrated;
      }
    } catch (err2) {
      return clone(DEFAULT_DATA);
    }

    return clone(DEFAULT_DATA);
  }

  function saveData() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function setStatus(message, ok) {
    var el = byId('status');
    if (!el) return;
    el.textContent = message;
    el.style.color = ok ? '#1f7a1f' : '#b02020';
  }

  function prettySize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return Math.round(bytes / 1024) + ' KB';
  }

  function productTemplate(product, index) {
    return '' +
      '<div class="product-item" data-item-index="' + index + '">' +
        '<div class="row g-3 align-items-start">' +
          '<div class="col-md-7">' +
            '<label class="form-label">Titulo</label>' +
            '<input class="form-control product-title" type="text" maxlength="' + TITLE_MAX + '" value="' + escapeHtml(product.title) + '" required>' +
            '<label class="form-label mt-2">URL de imagen</label>' +
            '<input class="form-control product-image" type="url" maxlength="' + IMAGE_URL_MAX + '" value="' + escapeHtml(product.image) + '">' +
            '<label class="form-label mt-2">Descripcion del producto</label>' +
            '<textarea class="form-control product-description" rows="4" maxlength="' + DESCRIPTION_MAX + '" required>' + escapeHtml(product.description || '') + '</textarea>' +
            '<label class="form-label mt-2">O subir imagen (maximo 900 KB)</label>' +
            '<input class="form-control product-file" type="file" accept="image/*">' +
            '<div class="mt-3">' +
              '<button class="btn btn-outline-danger btn-sm remove-product" type="button">Eliminar producto</button>' +
            '</div>' +
          '</div>' +
          '<div class="col-md-5">' +
            '<img class="preview product-preview" src="' + escapeHtml(product.image) + '" alt="Vista previa producto">' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderFeaturedOptions() {
    var selects = [byId('featured-0'), byId('featured-1'), byId('featured-2')];
    selects.forEach(function (sel, idx) {
      if (!sel) return;
      sel.innerHTML = state.products.map(function (p) {
        return '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.title) + '</option>';
      }).join('');
      sel.value = state.featuredIds[idx] || state.products[idx].id;
    });
  }

  function bindFeaturedEvents() {
    [0, 1, 2].forEach(function (idx) {
      var sel = byId('featured-' + idx);
      if (!sel) return;
      sel.addEventListener('change', function () {
        state.featuredIds[idx] = sel.value;
      });
    });
  }

  function bindProductEvents(container) {
    container.querySelectorAll('.product-item').forEach(function (item) {
      var idx = Number(item.getAttribute('data-item-index'));
      var titleInput = item.querySelector('.product-title');
      var imageInput = item.querySelector('.product-image');
      var descriptionInput = item.querySelector('.product-description');
      var fileInput = item.querySelector('.product-file');
      var preview = item.querySelector('.product-preview');
      var removeBtn = item.querySelector('.remove-product');

      titleInput.addEventListener('input', function () {
        state.products[idx].title = titleInput.value.slice(0, TITLE_MAX);
        titleInput.value = state.products[idx].title;
        renderFeaturedOptions();
      });

      imageInput.addEventListener('input', function () {
        state.products[idx].image = imageInput.value.slice(0, IMAGE_URL_MAX);
        imageInput.value = state.products[idx].image;
        preview.src = imageInput.value;
      });
      descriptionInput.addEventListener('input', function () {
        state.products[idx].description = descriptionInput.value.slice(0, DESCRIPTION_MAX);
        descriptionInput.value = state.products[idx].description;
      });

      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          setStatus('El archivo seleccionado no es una imagen valida.', false);
          fileInput.value = '';
          return;
        }
        if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
          setStatus('La imagen del producto supera el limite de ' + prettySize(PRODUCT_IMAGE_MAX_BYTES) + '.', false);
          fileInput.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          var src = String(e.target.result || '');
          state.products[idx].image = src;
          imageInput.value = src;
          preview.src = src;
        };
        reader.readAsDataURL(file);
      });

      removeBtn.addEventListener('click', function () {
        if (state.products.length <= 3) {
          setStatus('Debes mantener al menos 3 productos en el catalogo.', false);
          return;
        }
        var removed = state.products.splice(idx, 1)[0];
        state.featuredIds = state.featuredIds.filter(function (id) { return id !== removed.id; });
        while (state.featuredIds.length < 3) {
          var next = state.products.find(function (p) { return state.featuredIds.indexOf(p.id) === -1; });
          if (!next) break;
          state.featuredIds.push(next.id);
        }
        render();
      });
    });
  }

  function renderProductsList() {
    var list = byId('products-list');
    list.innerHTML = state.products.map(function (product, idx) {
      return productTemplate(product, idx);
    }).join('');
    bindProductEvents(list);
  }

  function render() {
    renderFeaturedOptions();
    renderProductsList();
  }

  function validateBeforeSave() {
    if (!Array.isArray(state.products) || state.products.length < 3) {
      setStatus('Debes tener al menos 3 productos.', false);
      return false;
    }

    var ids = new Set();
    for (var i = 0; i < state.products.length; i += 1) {
      var p = state.products[i];
      p.title = String(p.title || '').trim();
      p.image = String(p.image || '').trim();
      p.description = String(p.description || '').trim();
      p.title = p.title.slice(0, TITLE_MAX);
      p.image = p.image.slice(0, IMAGE_URL_MAX);
      p.description = p.description.slice(0, DESCRIPTION_MAX);
      if (!p.title || !p.image || !p.description) {
        setStatus('Todos los productos deben tener titulo, imagen y descripcion.', false);
        return false;
      }
      if (!p.id || ids.has(p.id)) p.id = 'p' + Date.now() + '_' + i;
      ids.add(p.id);
    }

    state.featuredIds = [byId('featured-0').value, byId('featured-1').value, byId('featured-2').value];
    var uniqueFeatured = new Set(state.featuredIds);
    if (uniqueFeatured.size !== 3) {
      setStatus('Debes seleccionar 3 productos destacados distintos.', false);
      return false;
    }
    if (!state.featuredIds.every(function (id) { return ids.has(id); })) {
      setStatus('Uno o mas destacados no existen en el catalogo.', false);
      return false;
    }

    return true;
  }

  function init() {
    var form = byId('products-cms-form');
    var resetBtn = byId('reset-btn');
    var addBtn = byId('add-product-btn');
    if (!form || !resetBtn || !addBtn) return;

    state = loadData();
    bindFeaturedEvents();
    render();

    addBtn.addEventListener('click', function () {
      var id = 'p' + Date.now();
      state.products.push({
        id: id,
        title: 'Nuevo producto'.slice(0, TITLE_MAX),
        image: 'images/product-01-370x300.jpg'.slice(0, IMAGE_URL_MAX),
        description: 'Descripcion general de este producto. Edita este texto con las caracteristicas principales.'.slice(0, DESCRIPTION_MAX)
      });
      render();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateBeforeSave()) return;
      saveData();
      setStatus('Cambios guardados correctamente.', true);
    });

    resetBtn.addEventListener('click', function () {
      localStorage.removeItem(KEY);
      state = clone(DEFAULT_DATA);
      render();
      setStatus('Se restauraron los valores por defecto.', true);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
