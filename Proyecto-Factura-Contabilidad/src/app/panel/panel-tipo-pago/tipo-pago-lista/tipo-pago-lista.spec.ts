import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoPagoLista } from './tipo-pago-lista';

describe('TipoPagoLista', () => {
  let component: TipoPagoLista;
  let fixture: ComponentFixture<TipoPagoLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoPagoLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoPagoLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
