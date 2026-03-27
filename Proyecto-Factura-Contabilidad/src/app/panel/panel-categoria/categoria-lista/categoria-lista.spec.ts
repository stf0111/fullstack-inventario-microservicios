import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaLista } from './categoria-lista';

describe('CategoriaLista', () => {
  let component: CategoriaLista;
  let fixture: ComponentFixture<CategoriaLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
