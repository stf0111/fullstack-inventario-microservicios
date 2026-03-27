import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompraRegistrar } from './compra-registrar';

describe('CompraRegistrar', () => {
  let component: CompraRegistrar;
  let fixture: ComponentFixture<CompraRegistrar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompraRegistrar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompraRegistrar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
