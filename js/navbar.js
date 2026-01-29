class NavbarManager {
    constructor() {
        this.dropdown = document.querySelector('.dropdown');
        this.dropdownBtn = document.querySelector('.dropdown-btn');
        this.currentTitle = document.getElementById('currentPageTitle');
        this.helpBtn = document.getElementById('helpBtn');
        this.helpModal = document.getElementById('helpModal');
        this.closeModal = document.querySelector('.close');
        
        this.init();
    }

    init() {
        // 드롭다운 토글
        if (this.dropdownBtn) {
            this.dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dropdown.classList.toggle('active');
            });
        }

        // 외부 클릭 시 드롭다운 닫기
        document.addEventListener('click', () => {
            if (this.dropdown) {
                this.dropdown.classList.remove('active');
            }
        });

        // 메뉴 아이템 클릭
        document.querySelectorAll('.dropdown-content a').forEach(link => {
            link.addEventListener('click', (e) => {
                const title = e.target.getAttribute('data-title');
                this.updateTitle(title);
                this.dropdown.classList.remove('active');
            });
        });

        // 도움말 모달
        if (this.helpBtn && this.helpModal) {
            this.helpBtn.addEventListener('click', () => {
                this.helpModal.style.display = 'block';
            });

            if (this.closeModal) {
                this.closeModal.addEventListener('click', () => {
                    this.helpModal.style.display = 'none';
                });
            }

            window.addEventListener('click', (e) => {
                if (e.target === this.helpModal) {
                    this.helpModal.style.display = 'none';
                }
            });
        }
    }

    updateTitle(title) {
        if (!this.currentTitle) return;
        
        const textNode = Array.from(this.currentTitle.childNodes)
            .find(node => node.nodeType === Node.TEXT_NODE);
        
        if (textNode) {
            textNode.textContent = title + ' ';
        } else {
            this.currentTitle.insertBefore(
                document.createTextNode(title + ' '),
                this.currentTitle.firstChild
            );
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.navbarManager = new NavbarManager();
});
