import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcaCrear } from './marca-crear';

describe('MarcaCrear', () => {
  let component: MarcaCrear;
  let fixture: ComponentFixture<MarcaCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcaCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarcaCrear);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
