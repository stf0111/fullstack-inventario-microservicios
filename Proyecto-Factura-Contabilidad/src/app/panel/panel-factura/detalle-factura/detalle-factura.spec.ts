import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleFactura } from './detalle-factura';

describe('DetalleFactura', () => {
  let component: DetalleFactura;
  let fixture: ComponentFixture<DetalleFactura>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleFactura]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleFactura);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
