@extends('layouts.auth')
@section('title', 'Registro de usuario')
@section('css')
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
@endsection
@section('content')
    <div class="form-container">
        <div class="form-card">
            <div class="row g-0">
                <div class="col-lg-6">
                    <div class="illustration-section">
                        <div class="text-center">
                            <h2><strong>My Balance</strong></h2>
                        </div>
                        <div class="illustration-area">
                            <img src="{{ asset('img/meditacion-logo.jpg') }}" alt="" class="image">
                        </div>
                        <div class="copyright text-center">
                            &copy; 2026 Todos los derechos reservados | Abel Macedo
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="form-section">
                        <h2 class="form-title text-center">¡Unete a My Balance!</h2>
                        <form action="{{ route('user.store') }}" method="post">
                            @csrf
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="name" class="form-label">Nombre</label>
                                        <input type="text" class="form-control" id="name" name="name"
                                            placeholder="Ej. Miguel Angel">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="surnames" class="form-label">Apellidos</label>
                                        <input type="text" class="form-control" id="surnames" name="surnames"
                                            placeholder="Ej. Pérez García">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="mb-3">
                                        <label for="email" class="form-label">Correo electrónico</label>
                                        <input type="text" class="form-control" id="email" name="email"
                                            placeholder="usuario@gmail.com">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="password" class="form-label">Contraseña</label>
                                        <input type="password" class="form-control" id="password" name="password"
                                            placeholder="********">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="password_confirmation" class="form-label">Confirmar contraseña</label>
                                        <input type="password" class="form-control" id="password_confirmation"
                                            name="password_confirmation" placeholder="********">
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-form">Registrarse</button>
                            <div class="register-link">
                                ¿Ya tienes cuenta? <a href="{{ route('login') }}">Iniciar sesión</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('js')
@endsection
