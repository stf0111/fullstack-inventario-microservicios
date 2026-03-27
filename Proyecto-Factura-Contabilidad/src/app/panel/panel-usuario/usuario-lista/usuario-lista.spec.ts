import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioLista } from './usuario-lista';

describe('UsuarioLista', () => {
  let component: UsuarioLista;
  let fixture: ComponentFixture<UsuarioLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuarioLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
