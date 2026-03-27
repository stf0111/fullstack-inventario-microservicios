import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagenModificar } from './imagen-modificar';

describe('ImagenModificar', () => {
  let component: ImagenModificar;
  let fixture: ComponentFixture<ImagenModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagenModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagenModificar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
