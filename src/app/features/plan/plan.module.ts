import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlanRoutingModule } from './plan-routing.module';
import { PlanComponent } from './containers/plan/plan.component';

@NgModule({
  declarations: [PlanComponent],
  imports: [CommonModule, PlanRoutingModule],
})
export class PlanModule {}
