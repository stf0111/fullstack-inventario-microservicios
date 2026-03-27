import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedorModificar } from './proveedor-modificar';

describe('ProveedorModificar', () => {
  let component: ProveedorModificar;
  let fixture: ComponentFixture<ProveedorModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedorModificar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
