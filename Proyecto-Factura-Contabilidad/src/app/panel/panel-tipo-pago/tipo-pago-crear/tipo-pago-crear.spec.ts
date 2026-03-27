import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoPagoCrear } from './tipo-pago-crear';

describe('TipoPagoCrear', () => {
  let component: TipoPagoCrear;
  let fixture: ComponentFixture<TipoPagoCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoPagoCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoPagoCrear);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
