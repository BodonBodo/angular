import { NgModule } from '@angular/core';
import { PropertyViewBodyComponent } from './property-view-body/property-view-body.component';
import { CommonModule } from '@angular/common';
import { MatTreeModule } from '@angular/material/tree';
import { PropertyViewHeaderComponent } from './property-view-header/property-view-header.component';
import { PropertyViewComponent } from './property-view.component';
import { PropertyViewTreeComponent } from './property-view-body/property-view-tree/property-view-tree.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PropertyEditorComponent } from './property-view-body/property-view-tree/property-editor/property-editor.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    PropertyViewBodyComponent,
    PropertyViewHeaderComponent,
    PropertyViewComponent,
    PropertyViewTreeComponent,
    PropertyEditorComponent,
  ],
  imports: [MatTreeModule, CommonModule, MatExpansionModule, DragDropModule, FormsModule],
  exports: [PropertyViewBodyComponent, PropertyViewHeaderComponent, PropertyViewComponent],
})
export class PropertyViewModule {}
