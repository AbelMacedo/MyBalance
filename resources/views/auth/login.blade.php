@extends('layouts.auth')
@section('title', 'Inicio de sesión')
@section('css')
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
@endsection
@section('content')
    <!--
                <div class="circle-decoration circle-1"></div>
                <div class="circle-decoration circle-2"></div>
                <div class="circle-decoration circle-3"></div>
            -->
    <div class="form-container">
        <div class="form-card">
            <div class="row g-0">
                <div class="col-lg-6">
                    <div class="illustration-section">
                        <div class="text-center">
                            <h2><strong>My Balance</strong></h2>
                        </div>
                        <div class="illustration-area">
                            <img src="{{ asset('img/meditacion-logo.png') }}" alt="" class="image">
                        </div>
                        <div class="copyright text-center">
                            &copy; 2026 Todos los derechos reservados | Abel Macedo
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="form-section">
                        <h2 class="form-title text-center">Inicio de sesión</h2>
                        <form action="{{ route('login.authenticate') }}" method="post">
                            @csrf
                            <div class="mb-3">
                                <label for="email" class="form-label">Correo electrónico</label>
                                <input type="text" class="form-control" id="email" name="email"
                                    placeholder="usuario@gmail.com">
                            </div>
                            <div class="mb-2">
                                <label for="password" class="form-label">Contraseña</label>
                                <input type="password" class="form-control" id="password" name="password"
                                    placeholder="********">
                            </div>
                            <div class="forgot-password">
                                <a href="#">Olvide mi contraseña</a>
                            </div>
                            <button type="submit" class="btn btn-form">Iniciar sesión</button>
                            <div class="register-link">
                                ¿Aún no tienes cuenta? <a href="{{ route('user.create') }}">Registrarse</a>
                            </div>
                        </form>
                        <!--
                                <div class="footer-links">
                                    <a href="#">Terminos y condiciones</a>
                                </div>
                                <div class="footer-contact">
                                    ¿Tienes algún problema? Contacta con nosotros<br>
                                    <a href="#" style="color: var(--light-sage); text-decoration: none;">Contactar</a>
                                </div>
                            -->
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('js')
@endsection
