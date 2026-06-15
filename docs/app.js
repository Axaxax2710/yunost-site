// Мобильное меню
document.addEventListener('DOMContentLoaded', function() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');
    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', function() {
            mainNav.classList.toggle('open');
        });
    }
});
