import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedorLista } from './proveedor-lista';

describe('ProveedorLista', () => {
  let component: ProveedorLista;
  let fixture: ComponentFixture<ProveedorLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedorLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
