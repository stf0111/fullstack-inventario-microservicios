import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompraLista } from './compra-lista';

describe('CompraLista', () => {
  let component: CompraLista;
  let fixture: ComponentFixture<CompraLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompraLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompraLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
