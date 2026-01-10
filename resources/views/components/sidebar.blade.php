<div class="sidebar-overlay" id="sidebarOverlay"></div>
<button class="sidebar-toggle" id="sidebarToggle">
    <i class="bi bi-list"></i>
</button>
<div class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="user-avatar">
            {{ strtoupper(substr(Auth::user()->name, 0, 1)) }}
        </div>
        <div class="user-info">
            <h5>{{ Auth::user()->name }} {{ Auth::user()->surnames }}</h5>
            <p>{{ Auth::user()->email }}</p>
        </div>
    </div>
    <div class="sidebar-menu">
        <div class="menu-section">
            <div class="menu-section-title">Principal</div>
            <a href="{{ route('home') }}" class="menu-item {{ request()->routeIs('home') ? 'active' : '' }}">
                <i class="fi fi-sr-home"></i>
                <span>Inicio</span>
            </a>
            <a href="" class="menu-item {{ request()->routeIs('') ? 'active' : '' }}">
                <i class="fi fi-sr-task-checklist"></i>
                <span>Tareas</span>
            </a>
            <a href="" class="menu-item {{ request()->routeIs('') ? 'active' : '' }}">
                <i class="fi fi-sr-dumbbell-weightlifting"></i>
                <span>Habitos</span>
            </a>
            <a href="" class="menu-item {{ request()->routeIs('') ? 'active' : '' }}">
                <i class="fi fi-sr-user-hard-work"></i>
                <span>Retos</span>
            </a>
            <a href="" class="menu-item {{ request()->routeIs('') ? 'active' : '' }}">
                <i class="fi fi-sr-laugh-beam"></i>
                <span>Estado de animo</span>
            </a>
            <a href="" class="menu-item {{ request()->routeIs('') ? 'active' : '' }}">
                <i class="fi fi-sr-balance-scale-left"></i>
                <span>Mi balance diario</span>
            </a>
            <a href="" class="menu-item {{ request()->routeIs('') ? 'active' : '' }}">
                <i class="fi fi-sr-lightbulb-on"></i>
                <span>Consejos</span>
            </a>
            <div class="menu-section-title">Mi cuenta</div>
            </a> <a href="" class="menu-item {{ request()->routeIs('') ? 'active' : '' }}">
                <i class="fi fi-sr-user-pen"></i>
                <span>Perfil</span>
            </a>
        </div>
    </div>
    <div class="sidebar-footer">
        <form action="{{ route('logout') }}" method="post">
            @csrf
            <button type="submit" class="btn-logout">
                <i class="bi bi-box-arrow-right"></i>
                <span>Cerrar Sesión</span>
            </button>
        </form>
    </div>
</div>

<script>
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });

    sidebar.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    });
</script>
