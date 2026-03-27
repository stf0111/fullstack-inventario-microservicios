import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KardexLista } from './kardex-lista';

describe('KardexLista', () => {
  let component: KardexLista;
  let fixture: ComponentFixture<KardexLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KardexLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KardexLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
