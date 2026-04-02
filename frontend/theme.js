(function() {
    function applyTheme() {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
        
        
        const toggle = document.getElementById("themeToggle");
        if (toggle) {
            if (savedTheme === "dark") toggle.classList.add("active");
            else toggle.classList.remove("active");
        }
    }

    
    applyTheme();

    
    document.addEventListener("DOMContentLoaded", applyTheme);

    
    window.toggleTheme = function() {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const newTheme = currentTheme === "light" ? "dark" : "light";
        
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        
        const toggle = document.getElementById("themeToggle");
        if (toggle) {
            if (newTheme === "dark") toggle.classList.add("active");
            else toggle.classList.remove("active");
        }
    };
})();
