import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleCompra } from './detalle-compra';

describe('DetalleCompra', () => {
  let component: DetalleCompra;
  let fixture: ComponentFixture<DetalleCompra>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleCompra]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleCompra);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
