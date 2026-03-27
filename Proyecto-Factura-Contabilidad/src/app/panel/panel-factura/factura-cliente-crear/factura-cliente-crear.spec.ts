import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaClienteCrear } from './factura-cliente-crear';

describe('FacturaClienteCrear', () => {
  let component: FacturaClienteCrear;
  let fixture: ComponentFixture<FacturaClienteCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaClienteCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturaClienteCrear);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
