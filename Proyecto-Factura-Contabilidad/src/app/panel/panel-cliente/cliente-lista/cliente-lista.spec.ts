import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteLista } from './cliente-lista';

describe('ClienteLista', () => {
  let component: ClienteLista;
  let fixture: ComponentFixture<ClienteLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
