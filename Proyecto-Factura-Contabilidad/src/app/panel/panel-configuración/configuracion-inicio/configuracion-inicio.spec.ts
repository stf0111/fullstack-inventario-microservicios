import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracionInicio } from './configuracion-inicio';

describe('ConfiguracionInicio', () => {
  let component: ConfiguracionInicio;
  let fixture: ComponentFixture<ConfiguracionInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionInicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfiguracionInicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
