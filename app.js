// Referencias globales de elementos de la UI
const gridContainer = document.getElementById('movies-grid');
const loadingState = document.getElementById('loading-state');

// Inputs de Filtros
const searchInput = document.getElementById('search-input');
const genreSelect = document.getElementById('genre-select');
const locationSelect = document.getElementById('location-select');
const statusSelect = document.getElementById('status-select');

// Estado local de la aplicación (Memoria caché de producción)
let allMovies = [];

// 1. Carga Automática Inicial (Ciclo de vida)
async function initApp() {
    try {
        const response = await fetch('./peliculas.json');
        if (!response.ok) throw new Error("Fallo al conectar con la base de datos JSON");
        
        allMovies = await response.json();
        
        // Inicializar los filtros dinámicos basados en la data real
        populateSelectFilters(allMovies);
        
        // Escuchadores de eventos en tiempo real
        setupEventListeners();

        // Pequeño retardo de experiencia de usuario para mostrar el spinner
        setTimeout(() => {
            executeFilters();
            hideLoading();
        }, 800);

    } catch (error) {
        console.error(error);
        loadingState.innerHTML = `<p class="no-results" style="color: var(--danger)">Error al cargar la base de datos automatizada.</p>`;
    }
}

// 2. Extraer de forma automática géneros y ubicaciones únicas
function populateSelectFilters(movies) {
    const genres = new Set();
    const locations = new Set();

    movies.forEach(movie => {
        const g = movie.Type || movie.Tipo;
        const l = movie.Ubication || movie.Ubicación;
        
        if (g) genres.add(g.trim());
        if (l) locations.add(l.trim().toUpperCase()); // Normalizar a mayúsculas
    });

    // Inyectar opciones en Selector de Géneros
    genres.forEach(genre => {
        const opt = document.createElement('option');
        opt.value = genre.toLowerCase();
        opt.textContent = genre;
        genreSelect.appendChild(opt);
    });

    // Inyectar opciones en Selector de Ubicaciones
    locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc.toLowerCase();
        opt.textContent = loc;
        locationSelect.appendChild(opt);
    });
}

// 3. Vincular los triggers de cambio automáticos
function setupEventListeners() {
    searchInput.addEventListener('input', executeFilters);
    genreSelect.addEventListener('change', executeFilters);
    locationSelect.addEventListener('change', executeFilters);
    statusSelect.addEventListener('change', executeFilters);
}

// 4. Algoritmo central de Filtrado Cruzado
function executeFilters() {
    const searchText = searchInput.value.toLowerCase().trim();
    const selectedGenre = genreSelect.value;
    const selectedLocation = locationSelect.value;
    const selectedStatus = statusSelect.value;

    // Filtrar la lista completa basándose en las 4 condiciones al mismo tiempo
    const filteredMovies = allMovies.filter(movie => {
        const title = (movie.Title || '').toLowerCase();
        const movieGenre = ((movie.Type || movie.Tipo || '')).toLowerCase();
        const movieLoc = ((movie.Ubication || movie.Ubicación || '')).toLowerCase();
        
        // Validación 1: Texto de búsqueda
        const matchesSearch = title.includes(searchText);

        // Validación 2: Género
        const matchesGenre = (selectedGenre === 'all' || movieGenre === selectedGenre);

        // Validación 3: Ubicación
        const matchesLocation = (selectedLocation === 'all' || movieLoc === selectedLocation);

        // Validación 4: Estado (Disponibilidad)
        let matchesStatus = true;
        if (selectedStatus === 'available') matchesStatus = movie.Estado === true;
        if (selectedStatus === 'unavailable') matchesStatus = (movie.Estado === false || movie.Estado === null);

        return matchesSearch && matchesGenre && matchesLocation && matchesStatus;
    });

    renderGrid(filteredMovies);
}

// 5. Renderizar el HTML de las tarjetas resultantes
function renderGrid(movies) {
    gridContainer.innerHTML = '';

    if (movies.length === 0) {
        gridContainer.innerHTML = `<div class="no-results">No se encontraron películas que coincidan con los filtros seleccionados.</div>`;
        return;
    }

    movies.forEach(movie => {
        const year = movie.Year || movie.Año || 'N/A';
        const type = movie.Type || movie.Tipo || 'General';
        const location = movie.Ubication || movie.Ubicación || 'No especificada';
        const statusText = movie.Estado ? 'Disponible' : 'No Disponible';
        const statusClass = movie.Estado ? 'status-active' : 'status-inactive';
        const fallbackImg = 'https://via.placeholder.com/280x380?text=Sin+Poster';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="poster-container">
                <img src="${movie.Poster}" alt="${movie.Title}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="card-content">
                <h2 class="movie-title">${movie.Title}</h2>
                <div class="movie-meta">
                    <span>📅 ${year}</span>
                    <span>•</span>
                    <span>🎬 ${type}</span>
                </div>
                <p class="movie-desc">${movie.description || 'Sin descripción disponible.'}</p>
                <div class="movie-footer">
                    <div>📍 Ubicación: <strong>${location}</strong></div>
                    <div>🆔 ID: <strong>${movie.imdbID}</strong></div>
                </div>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

function hideLoading() {
    loadingState.classList.add('id-hidden');
    gridContainer.classList.remove('id-hidden');
}

// Inicialización automática al cargar el documento
document.addEventListener('DOMContentLoaded', initApp);