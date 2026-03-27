import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioModificar } from './usuario-modificar';

describe('UsuarioModificar', () => {
  let component: UsuarioModificar;
  let fixture: ComponentFixture<UsuarioModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuarioModificar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
