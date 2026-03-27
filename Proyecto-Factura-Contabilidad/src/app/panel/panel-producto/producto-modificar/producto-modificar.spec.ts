import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoModificar } from './producto-modificar';

describe('ProductoModificar', () => {
  let component: ProductoModificar;
  let fixture: ComponentFixture<ProductoModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductoModificar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
