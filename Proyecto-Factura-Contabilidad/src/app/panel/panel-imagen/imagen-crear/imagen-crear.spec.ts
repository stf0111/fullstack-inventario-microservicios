import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagenCrear } from './imagen-crear';

describe('ImagenCrear', () => {
  let component: ImagenCrear;
  let fixture: ComponentFixture<ImagenCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagenCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagenCrear);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
