import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteCrear } from './cliente-crear';

describe('ClienteCrear', () => {
  let component: ClienteCrear;
  let fixture: ComponentFixture<ClienteCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteCrear);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
