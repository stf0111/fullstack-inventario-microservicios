import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedorCrear } from './proveedor-crear';

describe('ProveedorCrear', () => {
  let component: ProveedorCrear;
  let fixture: ComponentFixture<ProveedorCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedorCrear);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
