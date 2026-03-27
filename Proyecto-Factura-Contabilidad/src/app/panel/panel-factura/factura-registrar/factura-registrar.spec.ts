import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaRegistrar } from './factura-registrar';

describe('FacturaRegistrar', () => {
  let component: FacturaRegistrar;
  let fixture: ComponentFixture<FacturaRegistrar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaRegistrar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturaRegistrar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
