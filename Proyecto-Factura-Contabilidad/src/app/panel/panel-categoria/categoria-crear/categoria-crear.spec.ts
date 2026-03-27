import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaCrear } from './categoria-crear';

describe('CategoriaCrear', () => {
  let component: CategoriaCrear;
  let fixture: ComponentFixture<CategoriaCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaCrear);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
