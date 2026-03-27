import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioCrear } from './usuario-crear';

describe('UsuarioCrear', () => {
  let component: UsuarioCrear;
  let fixture: ComponentFixture<UsuarioCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuarioCrear);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
