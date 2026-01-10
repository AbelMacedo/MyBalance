@extends('layouts.app')
@section('title', 'Home')
@section('css')
    <link rel="stylesheet" href="{{ asset('css/sidebar.css') }}">
@endsection
@section('content')
    <x-sidebar></x-sidebar>
@endsection
@section('js')

@endsection
