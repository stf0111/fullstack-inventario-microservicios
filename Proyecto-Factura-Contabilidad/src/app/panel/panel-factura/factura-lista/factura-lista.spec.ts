import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaLista } from './factura-lista';

describe('FacturaLista', () => {
  let component: FacturaLista;
  let fixture: ComponentFixture<FacturaLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturaLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
