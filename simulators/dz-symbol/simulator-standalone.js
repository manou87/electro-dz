(function () {
    function isLocalEnvironment() {
        const hostname = String(window.location.hostname || '').trim().toLowerCase();
        if (window.location.protocol === 'file:') return true;
        if (!hostname) return false;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
        if (hostname.endsWith('.local') || /^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
        const private172 = hostname.match(/^172\.(\d{1,3})\./);
        return !!private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31;
    }

    function installModalStyles() {
        if (document.getElementById('simucir-terms-modal-style')) return;
        const style = document.createElement('style');
        style.id = 'simucir-terms-modal-style';
        style.textContent = `
            .simucir-terms-modal {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background: rgba(5, 12, 22, .76);
            }
            .simucir-terms-modal.is-open { display: flex; }
            .simucir-terms-dialog {
                display: flex;
                flex-direction: column;
                width: min(920px, 100%);
                height: min(780px, calc(100vh - 36px));
                overflow: hidden;
                border: 1px solid rgba(148, 163, 184, .45);
                border-radius: 16px;
                background: #fff;
                box-shadow: 0 24px 70px rgba(0, 0, 0, .42);
            }
            .simucir-terms-frame {
                flex: 1 1 auto;
                width: 100%;
                min-height: 0;
                border: 0;
                background: #fff;
            }
            .simucir-terms-footer {
                display: flex;
                justify-content: flex-end;
                padding: 12px 16px;
                border-top: 1px solid #d8e2ee;
                background: #f5f8fc;
            }
            .simucir-terms-close {
                min-width: 104px;
                padding: 10px 18px;
                border: 0;
                border-radius: 9px;
                background: #1769aa;
                color: #fff;
                font: 700 14px "Segoe UI", sans-serif;
                cursor: pointer;
            }
            .simucir-terms-close:hover { background: #0f568e; }
            @media (max-width: 600px) {
                .simucir-terms-modal { padding: 8px; }
                .simucir-terms-dialog { height: calc(100vh - 16px); border-radius: 12px; }
            }
        `;
        document.head.appendChild(style);
    }

    function createTermsModal() {
        installModalStyles();
        const modal = document.createElement('div');
        modal.className = 'simucir-terms-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Termos de uso');
        modal.innerHTML = `
            <div class="simucir-terms-dialog">
                <iframe class="simucir-terms-frame" title="Termos de uso" src="termos-de-uso.html"></iframe>
                <div class="simucir-terms-footer">
                    <button class="simucir-terms-close" type="button">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeButton = modal.querySelector('.simucir-terms-close');
        const close = () => {
            modal.classList.remove('is-open');
            document.body.style.overflow = modal.dataset.previousOverflow || '';
        };
        closeButton.addEventListener('click', close);

        return {
            open() {
                modal.dataset.previousOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
                modal.classList.add('is-open');
                closeButton.focus();
            }
        };
    }

    function bootstrap() {
        document.querySelectorAll('[data-local-simulators-link]').forEach((link) => {
            link.hidden = !isLocalEnvironment();
            if (!isLocalEnvironment()) link.style.setProperty('display', 'none', 'important');
        });

        const termsLinks = Array.from(document.querySelectorAll('[data-terms-modal-link]'));
        if (!termsLinks.length) return;
        const modal = createTermsModal();
        termsLinks.forEach((link) => {
            link.setAttribute('href', 'termos-de-uso.html');
            link.addEventListener('click', (event) => {
                event.preventDefault();
                modal.open();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
    } else {
        bootstrap();
    }
})();
