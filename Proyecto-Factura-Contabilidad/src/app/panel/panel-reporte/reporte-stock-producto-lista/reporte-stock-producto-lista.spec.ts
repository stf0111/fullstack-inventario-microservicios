import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteStockProductoLista } from './reporte-stock-producto-lista';

describe('ReporteStockProductoLista', () => {
  let component: ReporteStockProductoLista;
  let fixture: ComponentFixture<ReporteStockProductoLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteStockProductoLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteStockProductoLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
