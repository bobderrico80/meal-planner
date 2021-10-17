import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    loadChildren: () =>
      import('./features/list/list.module').then((m) => m.ListModule),
  },
  {
    path: 'meal',
    loadChildren: () =>
      import('./features/meal/meal.module').then((m) => m.MealModule),
  },
  {
    path: 'plan',
    loadChildren: () =>
      import('./features/plan/plan.module').then((m) => m.PlanModule),
  },
  {
    path: 'recipe',
    loadChildren: () =>
      import('./features/recipe/recipe.module').then((m) => m.RecipeModule),
  },
  {
    path: 'store',
    loadChildren: () =>
      import('./features/store/store.module').then((m) => m.StoreModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
