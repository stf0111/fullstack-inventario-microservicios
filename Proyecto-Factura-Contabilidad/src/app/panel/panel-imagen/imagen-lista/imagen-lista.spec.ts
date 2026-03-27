import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagenLista } from './imagen-lista';

describe('ImagenLista', () => {
  let component: ImagenLista;
  let fixture: ComponentFixture<ImagenLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagenLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagenLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
