(function () {
    'use strict';

    const DEFAULT_LANGUAGE = 'pt-BR';
    const CATALOG_URL = 'data/lessons.catalog.json?v=20260810-lessons1';
    const state = {
        catalog: null,
        selectedModuleId: '',
        activeLesson: null,
        loading: false,
        error: ''
    };

    function tr(key, fallback) {
        return window.SimuDzI18n?.t?.(key) || fallback;
    }

    function currentLanguage() {
        return window.SimuDzI18n?.getLanguage?.() || DEFAULT_LANGUAGE;
    }

    function cleanText(value, fallback = '') {
        return String(value || fallback || '').trim();
    }

    function getLanguagePack() {
        const catalog = state.catalog || {};
        const lang = currentLanguage();
        return catalog[lang] || catalog.en || catalog[DEFAULT_LANGUAGE] || { modules: [] };
    }

    function getModules() {
        const modules = getLanguagePack().modules;
        return Array.isArray(modules) ? modules.filter((module) => module && Array.isArray(module.lessons)) : [];
    }

    function getSelectedModule(modules = getModules()) {
        if (!modules.length) return null;
        const selected = modules.find((module) => cleanText(module.id) === state.selectedModuleId);
        return selected || modules[0];
    }

    function getYoutubeId(url) {
        const match = String(url).match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
        return match ? match[1] : '';
    }

    function youtubeCaptionLanguage(lesson) {
        const map = { 'pt-BR': 'pt', en: 'en', es: 'es', fr: 'fr' };
        const explicit = cleanText(lesson?.captionLanguage || lesson?.captionLang || lesson?.captionsLanguage);
        if (explicit) return explicit;
        return map[currentLanguage()] || map[DEFAULT_LANGUAGE];
    }

    function withQueryParams(url, params) {
        try {
            const parsed = new URL(url, window.location.href);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') parsed.searchParams.set(key, value);
            });
            return parsed.toString();
        } catch (error) {
            const query = Object.entries(params)
                .filter(([, value]) => value !== undefined && value !== null && value !== '')
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');
            return query ? `${url}${url.includes('?') ? '&' : '?'}${query}` : url;
        }
    }

    function isYoutubeUrl(url) {
        return /(?:youtube\.com|youtu\.be)/i.test(String(url || ''));
    }

    function toYoutubeEmbed(url, lesson) {
        const id = getYoutubeId(url);
        if (!id) return '';
        const captionLang = youtubeCaptionLanguage(lesson);
        return withQueryParams(`https://www.youtube.com/embed/${id}`, {
            cc_load_policy: '1',
            cc_lang_pref: captionLang,
            hl: captionLang,
            enablejsapi: '1',
            origin: window.location.origin
        });
    }

    function applyYoutubeCaptionPreference(iframe, lesson) {
        const captionLang = youtubeCaptionLanguage(lesson);
        const post = (func, args) => {
            try {
                iframe.contentWindow?.postMessage(JSON.stringify({
                    event: 'command',
                    func,
                    args
                }), 'https://www.youtube.com');
            } catch (error) {
                // O player continua funcionando quando o YouTube bloqueia o comando.
            }
        };

        const apply = () => {
            post('loadModule', ['captions']);
            post('setOption', ['captions', 'track', { languageCode: captionLang }]);
            post('setOption', ['cc', 'track', { languageCode: captionLang }]);
        };
        iframe.addEventListener('load', () => {
            window.setTimeout(apply, 300);
            window.setTimeout(apply, 1200);
        }, { once: true });
    }

    function toVimeoEmbed(url) {
        const match = String(url).match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
        return match ? `https://player.vimeo.com/video/${match[1]}` : '';
    }
    function getLessonThumbnailUrl(lesson) {
        const explicit = cleanText(lesson?.thumbnail || lesson?.thumbnailUrl);
        if (explicit) return explicit;
        const youtubeId = getYoutubeId(cleanText(lesson?.url) || cleanText(lesson?.embedUrl));
        return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '';
    }
    function getLessonEmbedUrl(lesson) {
        const explicit = cleanText(lesson?.embedUrl);
        if (explicit) {
            return isYoutubeUrl(explicit) ? toYoutubeEmbed(explicit, lesson) : explicit;
        }
        const url = cleanText(lesson?.url);
        if (!url) return '';
        return toYoutubeEmbed(url, lesson) || toVimeoEmbed(url) || url;
    }

    async function loadCatalog() {
        if (state.catalog || state.loading) return;
        state.loading = true;
        state.error = '';
        try {
            const response = await fetch(CATALOG_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            state.catalog = data && typeof data === 'object' ? data : {};
        } catch (err) {
            state.error = tr('lessons.loadError', 'Nao foi possivel carregar as aulas.');
            state.catalog = {};
            console.warn('[lessons] Catalog load failed.', err);
        } finally {
            state.loading = false;
        }
    }

    function ensureModal() {
        let modal = document.getElementById('simucir-lessons-modal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'simucir-lessons-modal';
        modal.className = 'lessons-modal';
        modal.hidden = true;
        modal.innerHTML = [
            '<div class="lessons-modal-shell" role="dialog" aria-modal="true" aria-labelledby="lessons-modal-title">',
            '  <header class="lessons-modal-header">',
            '    <h2 id="lessons-modal-title"></h2>',
            '    <button type="button" class="lessons-modal-close" data-lessons-close aria-label=""></button>',
            '  </header>',
            '  <div class="lessons-modal-body">',
            '    <aside class="lessons-modules" aria-label=""></aside>',
            '    <main class="lessons-content"></main>',
            '  </div>',
            '</div>'
        ].join('');
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
        modal.querySelector('[data-lessons-close]')?.addEventListener('click', closeModal);
        document.body.appendChild(modal);
        return modal;
    }

    function renderModules(modal, modules, selectedModule) {
        const list = modal.querySelector('.lessons-modules');
        if (!list) return;
        list.setAttribute('aria-label', tr('lessons.modules', 'Modulos'));
        list.innerHTML = '';
        modules.forEach((module) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'lessons-module-btn';
            button.dataset.moduleId = cleanText(module.id);
            button.textContent = cleanText(module.title, tr('lessons.moduleFallback', 'Modulo'));
            if (cleanText(module.id) === cleanText(selectedModule?.id)) button.classList.add('is-active');
            button.addEventListener('click', () => {
                state.selectedModuleId = cleanText(module.id);
                state.activeLesson = null;
                renderModal();
            });
            list.appendChild(button);
        });
    }

    function renderLessonsList(content, module) {
        const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
        content.classList.remove('lesson-player-open');
        content.closest('.lessons-modal')?.classList.remove('is-playing');
        content.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'lessons-section-title';
        title.innerHTML = `<h3></h3><p></p>`;
        title.querySelector('h3').textContent = cleanText(module?.title, tr('lessons.moduleFallback', 'Modulo'));
        title.querySelector('p').textContent = cleanText(module?.description, tr('lessons.selectLesson', 'Selecione uma aula.'));
        content.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'lessons-grid';
        lessons.forEach((lesson, index) => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'lesson-card';
            card.innerHTML = [
                '<div class="lesson-card-thumb"><img alt="" loading="lazy"></div>',
                '<div class="lesson-card-copy"><span class="lesson-card-index"></span><strong></strong><span class="lesson-card-description"></span></div>'
            ].join('');
            const thumbnail = getLessonThumbnailUrl(lesson);
            const thumb = card.querySelector('.lesson-card-thumb');
            const thumbImg = card.querySelector('.lesson-card-thumb img');
            if (thumbnail && thumbImg) {
                thumbImg.addEventListener('error', () => {
                    thumb?.classList.add('is-empty');
                    thumbImg.remove();
                }, { once: true });
                thumbImg.src = thumbnail;
            } else if (thumb) {
                thumb.classList.add('is-empty');
                if (thumbImg) thumbImg.remove();
            }
            card.querySelector('.lesson-card-index').textContent = `${index + 1}`;
            card.querySelector('strong').textContent = cleanText(lesson.title, tr('lessons.lessonFallback', 'Aula'));
            card.querySelector('.lesson-card-description').textContent = cleanText(lesson.description, tr('lessons.openLesson', 'Abrir aula'));
            card.addEventListener('click', () => {
                state.activeLesson = lesson;
                renderModal();
            });
            grid.appendChild(card);
        });
        content.appendChild(grid);
    }

    function renderLessonPlayer(content, lesson) {
        const embedUrl = getLessonEmbedUrl(lesson);
        content.classList.add('lesson-player-open');
        content.innerHTML = '';

        const wrapper = document.createElement('section');
        wrapper.className = 'lesson-player';
        wrapper.innerHTML = [
            '<div class="lesson-player-top">',
            '  <div><h3></h3><p></p></div>',
            '  <button type="button" class="lesson-player-close"></button>',
            '</div>',
            '<div class="lesson-player-frame"></div>'
        ].join('');
        wrapper.querySelector('h3').textContent = cleanText(lesson?.title, tr('lessons.lessonFallback', 'Aula'));
        wrapper.querySelector('p').textContent = cleanText(lesson?.description, '');
        wrapper.querySelector('.lesson-player-close').textContent = tr('lessons.backToList', 'Voltar as aulas');
        wrapper.querySelector('.lesson-player-close').addEventListener('click', () => {
            state.activeLesson = null;
            renderModal();
        });

        const frameHost = wrapper.querySelector('.lesson-player-frame');
        if (embedUrl) {
            const iframe = document.createElement('iframe');
            iframe.src = embedUrl;
            iframe.title = cleanText(lesson?.title, tr('lessons.lessonFallback', 'Aula'));
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            if (isYoutubeUrl(embedUrl)) applyYoutubeCaptionPreference(iframe, lesson);
            frameHost.appendChild(iframe);
        } else {
            const empty = document.createElement('div');
            empty.className = 'lesson-empty-link';
            empty.textContent = tr('lessons.missingLink', 'Adicione o link desta aula no catalogo de aulas.');
            frameHost.appendChild(empty);
        }
        content.appendChild(wrapper);
    }
    function renderStateMessage(content, message) {
        content.classList.remove('lesson-player-open');
        content.closest('.lessons-modal')?.classList.remove('is-playing');
        content.innerHTML = '';
        const stateEl = document.createElement('div');
        stateEl.className = 'lessons-state';
        stateEl.textContent = message;
        content.appendChild(stateEl);
    }
    function renderModal() {
        const modal = ensureModal();
        const closeButton = modal.querySelector('[data-lessons-close]');
        const title = modal.querySelector('#lessons-modal-title');
        const content = modal.querySelector('.lessons-content');
        const modules = getModules();
        const selectedModule = getSelectedModule(modules);

        if (title) title.textContent = tr('lessons.title', 'Aulas');
        if (closeButton) {
            closeButton.textContent = '\u00d7';
            closeButton.setAttribute('aria-label', tr('modal.close', 'Fechar'));
        }

        renderModules(modal, modules, selectedModule);
        if (!content) return;

        if (state.loading) {
            renderStateMessage(content, tr('lessons.loading', 'Carregando aulas...'));
            return;
        }

        if (state.error) {
            renderStateMessage(content, state.error);
            return;
        }

        if (!selectedModule) {
            renderStateMessage(content, tr('lessons.empty', 'Nenhuma aula cadastrada para este idioma.'));
            return;
        }

        state.selectedModuleId = cleanText(selectedModule.id);
        if (state.activeLesson) renderLessonPlayer(content, state.activeLesson);
        else renderLessonsList(content, selectedModule);
    }

    async function openModal() {
        const modal = ensureModal();
        modal.hidden = false;
        document.body.classList.add('lessons-modal-open');
        renderModal();
        await loadCatalog();
        const modules = getModules();
        if (!state.selectedModuleId && modules[0]) state.selectedModuleId = cleanText(modules[0].id);
        renderModal();
    }

    function closeModal() {
        const modal = document.getElementById('simucir-lessons-modal');
        if (!modal) return;
        modal.hidden = true;
        state.activeLesson = null;
        document.body.classList.remove('lessons-modal-open');
    }

    function bindButton() {
        const button = document.getElementById('btn-lessons-modal');
        if (!button || button.dataset.lessonsReady === 'true') return;
        button.dataset.lessonsReady = 'true';
        button.addEventListener('click', (event) => {
            event.preventDefault();
            openModal();
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });

    window.addEventListener('simucir:languagechange', () => {
        if (!document.getElementById('simucir-lessons-modal')?.hidden) {
            state.activeLesson = null;
            state.selectedModuleId = '';
            renderModal();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindButton, { once: true });
    } else {
        bindButton();
    }

    window.SimuDzLessonsModal = Object.freeze({
        open: openModal,
        close: closeModal,
        reload: async () => {
            state.catalog = null;
            await loadCatalog();
            renderModal();
        }
    });
}());









