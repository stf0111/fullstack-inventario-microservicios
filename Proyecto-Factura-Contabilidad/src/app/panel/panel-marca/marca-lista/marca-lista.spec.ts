import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcaLista } from './marca-lista';

describe('MarcaLista', () => {
  let component: MarcaLista;
  let fixture: ComponentFixture<MarcaLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcaLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarcaLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
