/* toast.js */
class Toast {
    static init() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
    }

    static show(message, type = 'success', duration = 3000) {
        this.init();
        const container = document.getElementById('toast-container');

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} glass`;

        // Icon mapping
        const icons = {
            success: '<i class="fas fa-check-circle mr-2"></i>',
            error: '<i class="fas fa-exclamation-circle mr-2"></i>',
            info: '<i class="fas fa-info-circle mr-2"></i>'
        };

        toast.innerHTML = `${icons[type] || ''} <span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.5s ease-out';
            setTimeout(() => toast.remove(), 500);
        }, duration);
    }

    static success(msg) { this.show(msg, 'success'); }
    static error(msg) { this.show(msg, 'error'); }
    static info(msg) { this.show(msg, 'info'); }
}

// Export for use
window.Toast = Toast;
