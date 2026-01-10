<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\TaskCategory;

class TaskCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Personal', 'icon' => 'bi bi-person-arms-up', 'color' => '#2196F3'],
            ['name' => 'Trabajo', 'icon' => 'fi fi-sr-briefcase', 'color' => '#FF9800'],
            ['name' => 'Salud', 'icon' => 'fi fi-sr-gym', 'color' => '#4CAF50'],
            ['name' => 'Estudio', 'icon' => 'fi fi-sr-user-graduate', 'color' => '#9C27B0'],
            ['name' => 'Hogar', 'icon' => 'bi bi-house-heart-fill', 'color' => '#00BCD4'],
            ['name' => 'Social', 'icon' => 'fi fi-sr-gay-couple', 'color' => '#E91E63'],
        ];

        foreach ($categories as $category) {
            TaskCategory::create($category);
        }
    }
}
