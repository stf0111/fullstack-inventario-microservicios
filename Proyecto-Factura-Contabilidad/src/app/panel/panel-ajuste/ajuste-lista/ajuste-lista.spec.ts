import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjusteLista } from './ajuste-lista';

describe('AjusteLista', () => {
  let component: AjusteLista;
  let fixture: ComponentFixture<AjusteLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjusteLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjusteLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
